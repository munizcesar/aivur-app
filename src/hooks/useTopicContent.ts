import { useState, useEffect } from "react";
import { get, set } from "idb-keyval";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface Questao {
  id: string;
  enunciado: string;
  alternativas: Record<string, string>;
  correta: string;
  justificativa: string;
}

interface TopicContentState {
  teoria: string | null;
  flashcards: Flashcard[] | null;
  questoes: Questao[] | null;
  userResponses: Record<string, string>; // questaoId -> alternativa escolhida
  flashcardStatus: Record<string, "sei" | "nao_sei">;
  userId?: string | null;
}

export async function getTopicCounts(topicId: string) {
  const cacheKey = `aivur_topic_${topicId}`;
  const cached = await get<TopicContentState>(cacheKey);
  if (!cached) return { questoes: 0, flashcards: 0 };
  return {
    questoes: cached.questoes ? cached.questoes.length : 0,
    flashcards: cached.flashcards ? cached.flashcards.length : 0,
  };
}

export function useTopicContent(topicId: string) {
  const cacheKey = `aivur_topic_${topicId}`;

  const [state, setState] = useState<TopicContentState>({
    teoria: null,
    flashcards: null,
    questoes: null,
    userResponses: {},
    flashcardStatus: {},
    userId: null,
  });

  const [isLoadingTeoria, setIsLoadingTeoria] = useState(false);
  const [isLoadingFlashcards, setIsLoadingFlashcards] = useState(false);
  const [isLoadingQuestoes, setIsLoadingQuestoes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from IndexedDB on mount
  useEffect(() => {
    get(cacheKey).then((cached) => {
      if (cached) {
        setState(cached);
      }
    });
  }, [cacheKey]);

  const saveState = async (newState: TopicContentState) => {
    setState(newState);
    await set(cacheKey, newState);
  };

  const updateState = (partial: Partial<TopicContentState>) => {
    saveState({ ...state, ...partial });
  };

  const generateTeoria = async (label: string, subject: string, nicho: string) => {
    if (state.teoria || isLoadingTeoria) return; // already cached or loading
    setIsLoadingTeoria(true);
    setError(null);
    try {
      const res = await fetch("/api/mentor/teoria", {
        method: "POST",
        body: JSON.stringify({ label, subject, nicho }),
      });
      if (res.status === 429) throw new Error("A inteligência artificial está sobrecarregada. Aguarde alguns segundos e tente novamente.");
      if (!res.ok) throw new Error("Erro na API");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      updateState({ teoria: data.teoria });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingTeoria(false);
    }
  };

  const generateFlashcards = async (label: string, subject: string, nicho: string) => {
    if (state.flashcards || isLoadingFlashcards) return; // already cached or loading
    setIsLoadingFlashcards(true);
    setError(null);
    try {
      const res = await fetch("/api/mentor/flashcards", {
        method: "POST",
        body: JSON.stringify({ label, subject, nicho, context: state.teoria }),
      });
      if (res.status === 429) throw new Error("A inteligência artificial está sobrecarregada. Aguarde alguns segundos e tente novamente.");
      if (!res.ok) throw new Error("Erro na API");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      updateState({ flashcards: data.flashcards });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingFlashcards(false);
    }
  };

  const generateQuestoes = async (label: string, subject: string, nicho: string, dificuldade: string, banca: string, force = false) => {
    if ((!force && state.questoes) || isLoadingQuestoes) return; // already cached unless forced, or loading
    setIsLoadingQuestoes(true);
    setError(null);
    try {
      const res = await fetch("/api/mentor/questoes", {
        method: "POST",
        body: JSON.stringify({ label, subject, nicho, dificuldade, banca }),
      });
      if (res.status === 429) throw new Error("A inteligência artificial está sobrecarregada. Aguarde alguns segundos e tente novamente.");
      if (!res.ok) throw new Error("Erro na API");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      // Preserve user responses for old questions if we want, or reset them
      updateState({ questoes: data.questoes, userResponses: force ? {} : state.userResponses });
      return data.questoes;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setIsLoadingQuestoes(false);
    }
  };

  const markFlashcard = (id: string, status: "sei" | "nao_sei") => {
    const newStatus = { ...state.flashcardStatus, [id]: status };
    updateState({ flashcardStatus: newStatus });
  };

  const answerQuestao = (id: string, alternativa: string) => {
    const newResponses = { ...state.userResponses, [id]: alternativa };
    updateState({ userResponses: newResponses });
  };

  return {
    state,
    isLoadingTeoria,
    isLoadingFlashcards,
    isLoadingQuestoes,
    error,
    generateTeoria,
    generateFlashcards,
    generateQuestoes,
    markFlashcard,
    answerQuestao,
  };
}
