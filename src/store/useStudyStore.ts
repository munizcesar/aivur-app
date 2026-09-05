import { create } from "zustand";

export type StudyTab = "resumo" | "flashcards" | "questoes";

export interface StudyProgressData {
  answered: number;
  correct: number;
  incorrect: number;
  answers: Record<string, boolean>;
}

interface StudyStore {
  activeModuleId: string | null;
  activeTab: StudyTab;
  isLoading: boolean;
  progressData: StudyProgressData;
  setActiveModule: (id: string) => void;
  setActiveTab: (tab: StudyTab) => void;
  fetchQuestions: () => void;
  registerAnswer: (questionId: string, isCorrect: boolean) => void;
}

const initialProgress: StudyProgressData = {
  answered: 0,
  correct: 0,
  incorrect: 0,
  answers: {},
};

export const useStudyStore = create<StudyStore>((set) => ({
  activeModuleId: null,
  activeTab: "resumo",
  isLoading: true,
  progressData: initialProgress,

  setActiveModule: (id) => set({ activeModuleId: id }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  fetchQuestions: () => {
    set({ isLoading: true });
    setTimeout(() => set({ isLoading: false }), 1500);
  },
  registerAnswer: (questionId, isCorrect) =>
    set((state) => {
      const previousAnswer = state.progressData.answers[questionId];
      const answers = { ...state.progressData.answers, [questionId]: isCorrect };

      if (previousAnswer === isCorrect) {
        return { progressData: { ...state.progressData, answers } };
      }

      if (previousAnswer !== undefined) {
        return {
          progressData: {
            answered: state.progressData.answered,
            correct: state.progressData.correct + (isCorrect ? 1 : -1),
            incorrect: state.progressData.incorrect + (isCorrect ? -1 : 1),
            answers,
          },
        };
      }

      return {
        progressData: {
          answered: state.progressData.answered + 1,
          correct: state.progressData.correct + (isCorrect ? 1 : 0),
          incorrect: state.progressData.incorrect + (isCorrect ? 0 : 1),
          answers,
        },
      };
    }),
}));
