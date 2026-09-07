import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { studyService } from "@/services/api";
import type { StudyModule } from "@/mocks/studyPathMock";

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
  error: string | null;
  modules: StudyModule[];
  progressData: StudyProgressData;
  completedTopicIds: string[];
  setActiveModule: (id: string) => void;
  selectTopic: (moduleId: string, topicId: string) => void;
  setActiveTab: (tab: StudyTab) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  loadStudyPath: () => Promise<void>;
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
      error: null,
      modules: [],
      progressData: initialProgress,
      completedTopicIds: [],

      setActiveModule: (id) => set({ activeModuleId: id }),
      selectTopic: (moduleId, topicId) => set({ activeModuleId: moduleId, currentTopicId: topicId }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      loadStudyPath: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await studyService.fetchStudyPath();
          set({ modules: data, isLoading: false });
        } catch (err: any) {
          set({ error: err.message || "Erro ao carregar dados", isLoading: false });
        }
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
