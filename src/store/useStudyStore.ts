import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type StudyTab = "video" | "resumo" | "flashcards" | "questoes";

export interface StudyProgressData {
  answered: number;
  correct: number;
  incorrect: number;
  answers: Record<string, boolean>;
}

interface StudyStore {
  activeModuleId: string | null;
  currentTopicId: string | null;
  activeTab: StudyTab;
  isSidebarOpen: boolean;
  isLoading: boolean;
  progressData: StudyProgressData;
  completedTopicIds: string[];
  setActiveModule: (id: string) => void;
  setCurrentTopic: (id: string) => void;
  setActiveTab: (tab: StudyTab) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  fetchQuestions: () => void;
  registerAnswer: (questionId: string, isCorrect: boolean) => void;
  toggleTopicCompletion: (topicId: string) => void;
}

const initialProgress: StudyProgressData = {
  answered: 0,
  correct: 0,
  incorrect: 0,
  answers: {},
};

export const useStudyStore = create<StudyStore>()(
  persist(
    (set) => ({
      activeModuleId: null,
      currentTopicId: null,
      activeTab: "resumo",
      isSidebarOpen: false,
      isLoading: true,
      progressData: initialProgress,
      completedTopicIds: [],

      setActiveModule: (id) => set({ activeModuleId: id }),
      setCurrentTopic: (id) => set({ currentTopicId: id }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
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
      toggleTopicCompletion: (topicId) =>
        set((state) => ({
          completedTopicIds: state.completedTopicIds.includes(topicId)
            ? state.completedTopicIds.filter((id) => id !== topicId)
            : [...state.completedTopicIds, topicId],
        })),
    }),
    {
      name: "aivur-study-store",
      storage: createJSONStorage(() => localStorage),
      // Only persist navigation state — never isLoading (transient)
      partialize: (state) => ({
        activeModuleId: state.activeModuleId,
        currentTopicId: state.currentTopicId,
        activeTab: state.activeTab,
        progressData: state.progressData,
        completedTopicIds: state.completedTopicIds,
      }),
    }
  )
);
