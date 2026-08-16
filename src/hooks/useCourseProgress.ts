import { useState, useEffect, useCallback } from "react";
import { get, set } from "idb-keyval";
import type { Questao, Flashcard } from "./useTopicContent";
import { markPendingSync } from "@/lib/sync";

export interface QuestaoReviewItem {
  id: string;
  type: "questao";
  topicId: string;
  topicLabel: string;
  subject: string;
  data: Questao;
}

export interface FlashcardReviewItem {
  id: string;
  type: "flashcard";
  topicId: string;
  topicLabel: string;
  subject: string;
  data: Flashcard;
}

export interface SubjectProgress {
  historicoQuestoes: Record<string, boolean>; // questaoId -> isCorrect (última tentativa)
  reviewQuestoes: Record<string, QuestaoReviewItem>;
  reviewFlashcards: Record<string, FlashcardReviewItem>;
}

export interface CourseProgressState {
  subjects: Record<string, SubjectProgress>;
}

export function useCourseProgress(courseId: string) {
  const cacheKey = `aivur_progress_${courseId}`;
  
  const [state, setState] = useState<CourseProgressState>({ subjects: {} });
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    get<CourseProgressState>(cacheKey).then((cached) => {
      if (cached) {
        setState(cached);
      }
      setIsHydrated(true);
    });
  }, [cacheKey]);

  const initSubjectIfNeeded = (currentState: CourseProgressState, subject: string) => {
    if (!currentState.subjects[subject]) {
      currentState.subjects[subject] = {
        historicoQuestoes: {},
        reviewQuestoes: {},
        reviewFlashcards: {}
      };
    }
  };

  const logQuestaoAnswer = useCallback(async (
    subject: string, 
    isCorrect: boolean, 
    questao?: QuestaoReviewItem
  ) => {
    setState(prev => {
      const newState = { subjects: { ...prev.subjects } };
      initSubjectIfNeeded(newState, subject);
      
      const subjState = { ...newState.subjects[subject] };
      
      // Atualiza o histórico com a última tentativa
      if (questao) {
        subjState.historicoQuestoes = {
          ...subjState.historicoQuestoes,
          [questao.id]: isCorrect
        };
      }
      
      if (!isCorrect && questao) {
        subjState.reviewQuestoes = { ...subjState.reviewQuestoes, [questao.id]: questao };
      }
      
      newState.subjects[subject] = subjState;
      set(cacheKey, newState).then(() => markPendingSync(courseId, "course_progress"));
      return newState;
    });
  }, [cacheKey, courseId]);

  const removeReviewQuestao = useCallback(async (subject: string, questaoId: string) => {
    setState(prev => {
      const newState = { subjects: { ...prev.subjects } };
      if (!newState.subjects[subject]) return prev;
      
      const subjState = { ...newState.subjects[subject] };
      const newReviewQuestoes = { ...subjState.reviewQuestoes };
      delete newReviewQuestoes[questaoId];
      subjState.reviewQuestoes = newReviewQuestoes;
      
      newState.subjects[subject] = subjState;
      set(cacheKey, newState).then(() => markPendingSync(courseId, "course_progress"));
      return newState;
    });
  }, [cacheKey, courseId]);

  const addReviewFlashcard = useCallback(async (subject: string, flashcard: FlashcardReviewItem) => {
    setState(prev => {
      const newState = { subjects: { ...prev.subjects } };
      initSubjectIfNeeded(newState, subject);
      
      const subjState = { ...newState.subjects[subject] };
      subjState.reviewFlashcards = { ...subjState.reviewFlashcards, [flashcard.id]: flashcard };
      
      newState.subjects[subject] = subjState;
      set(cacheKey, newState).then(() => markPendingSync(courseId, "course_progress"));
      return newState;
    });
  }, [cacheKey, courseId]);

  const removeReviewFlashcard = useCallback(async (subject: string, flashcardId: string) => {
    setState(prev => {
      const newState = { subjects: { ...prev.subjects } };
      if (!newState.subjects[subject]) return prev;
      
      const subjState = { ...newState.subjects[subject] };
      const newReviewFlashcards = { ...subjState.reviewFlashcards };
      delete newReviewFlashcards[flashcardId];
      subjState.reviewFlashcards = newReviewFlashcards;
      
      newState.subjects[subject] = subjState;
      set(cacheKey, newState).then(() => markPendingSync(courseId, "course_progress"));
      return newState;
    });
  }, [cacheKey, courseId]);

  const getSubjectMetrics = useCallback((subject: string) => {
    const subj = state.subjects[subject];
    if (!subj) {
      return { pctAcerto: 0, pendingReview: 0, totalAnswered: 0 };
    }
    
    const historico = Object.values(subj.historicoQuestoes || {});
    const totalAnswered = historico.length;
    const totalCorretas = historico.filter(Boolean).length;
    
    const pctAcerto = totalAnswered > 0 
      ? Math.round((totalCorretas / totalAnswered) * 100) 
      : 0;
      
    const pendingReview = Object.keys(subj.reviewQuestoes || {}).length + Object.keys(subj.reviewFlashcards || {}).length;
    
    return {
      pctAcerto,
      pendingReview,
      totalAnswered
    };
  }, [state.subjects]);

  const syncReviewQuestoes = useCallback(async (subject: string, topicId: string, validQuestaoIds: string[]) => {
    setState(prev => {
      const newState = { subjects: { ...prev.subjects } };
      if (!newState.subjects[subject]) return prev;
      
      const subjState = { ...newState.subjects[subject] };
      const newReviewQuestoes = { ...subjState.reviewQuestoes };
      
      let changed = false;
      for (const id of Object.keys(newReviewQuestoes)) {
        if (newReviewQuestoes[id].topicId === topicId && !validQuestaoIds.includes(id)) {
          delete newReviewQuestoes[id];
          changed = true;
        }
      }
      
      if (!changed) return prev;
      
      subjState.reviewQuestoes = newReviewQuestoes;
      newState.subjects[subject] = subjState;
      set(cacheKey, newState).then(() => markPendingSync(courseId, "course_progress"));
      return newState;
    });
  }, [cacheKey, courseId]);

  return {
    state,
    isHydrated,
    logQuestaoAnswer,
    removeReviewQuestao,
    addReviewFlashcard,
    removeReviewFlashcard,
    getSubjectMetrics,
    syncReviewQuestoes
  };
}
