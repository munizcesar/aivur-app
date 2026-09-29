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
  isMobileDrawerOpen: boolean;
  isLoading: boolean;
  error: string | null;
  modules: StudyModule[];
  progressData: StudyProgressData;
  completedTopicIds: string[];
  setActiveModule: (id: string) => void;
  selectTopic: (moduleId: string, topicId: string) => void;
  setActiveTab: (tab: StudyTab) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  toggleMobileDrawer: () => void;
  loadStudyPath: () => Promise<void>;
  registerAnswer: (questionId: string, isCorrect: boolean) => Promise<void>;
  toggleTopicCompletion: (topicId: string) => Promise<void>;
  customTrilhas: import("@/lib/validations/trilha").TrilhaTemplateType[];
  addCustomTrilha: (trilha: import("@/lib/validations/trilha").TrilhaTemplateType) => void;
  updateCustomTrilha: (id: string, updates: Partial<import("@/lib/validations/trilha").TrilhaTemplateType>) => void;
  deleteCustomTrilha: (id: string) => void;
  videoResultsCache: Record<string, any[]>;
  setVideoResults: (trilhaId: string, results: any[]) => void;
  selectedVideoByTrilha: Record<string, string>;
  setSelectedVideo: (trilhaId: string, videoId: string | null) => void;
  questoesCache: Record<string, { data: import("@/mocks/trilhasMock").TrilhaQuestao[]; timestamp: number }>;
  setQuestoesCache: (topicoId: string, questoes: import("@/mocks/trilhasMock").TrilhaQuestao[]) => void;
}

const initialProgress: StudyProgressData = {
  answered: 0,
  correct: 0,
  incorrect: 0,
  answers: {},
};

export const useStudyStore = create<StudyStore>()(
  persist(
    (set, get) => ({
      activeModuleId: null,
      currentTopicId: null,
      activeTab: "resumo",
      isSidebarOpen: false,
      isMobileDrawerOpen: false,
      isLoading: true,
      error: null,
      modules: [],
      progressData: initialProgress,
      completedTopicIds: [],

      customTrilhas: [],
      addCustomTrilha: (trilha) => set((state) => ({ customTrilhas: [...state.customTrilhas, trilha] })),
      updateCustomTrilha: (id, updates) => set((state) => ({
        customTrilhas: state.customTrilhas.map((t) => t.id === id ? { ...t, ...updates } : t)
      })),
      deleteCustomTrilha: (id) => set((state) => {
        const nextSelectedVideo = { ...state.selectedVideoByTrilha };
        delete nextSelectedVideo[id];
        
        const nextVideoCache = { ...state.videoResultsCache };
        delete nextVideoCache[id];
        
        const nextQuestoesCache = { ...state.questoesCache };
        delete nextQuestoesCache[id];

        return {
          customTrilhas: state.customTrilhas.filter((t) => t.id !== id),
          selectedVideoByTrilha: nextSelectedVideo,
          videoResultsCache: nextVideoCache,
          questoesCache: nextQuestoesCache
        };
      }),

      videoResultsCache: {},
      setVideoResults: (trilhaId, results) => set((state) => ({
        videoResultsCache: { ...state.videoResultsCache, [trilhaId]: results }
      })),

      selectedVideoByTrilha: {},
      setSelectedVideo: (trilhaId, videoId) => set((state) => {
        const next = { ...state.selectedVideoByTrilha };
        if (videoId) {
          next[trilhaId] = videoId;
        } else {
          delete next[trilhaId];
        }
        return { selectedVideoByTrilha: next };
      }),

      setActiveModule: (id) => set({ activeModuleId: id }),
      selectTopic: (moduleId, topicId) => set({ activeModuleId: moduleId, currentTopicId: topicId, isMobileDrawerOpen: false }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      toggleMobileDrawer: () => set((state) => ({ isMobileDrawerOpen: !state.isMobileDrawerOpen })),
      loadStudyPath: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await studyService.fetchStudyPath();
          set({ modules: data, isLoading: false });
        } catch (err: any) {
          set({ error: err.message || "Erro ao carregar dados", isLoading: false });
        }
      },
      questoesCache: {},
      setQuestoesCache: (topicoId, questoes) => set((state) => ({ 
        questoesCache: { ...state.questoesCache, [topicoId]: { data: questoes, timestamp: Date.now() } } 
      })),

      registerAnswer: async (questionId, isCorrect) => {
        const previousAnswer = get().progressData.answers[questionId];
        if (previousAnswer === isCorrect) return;

        // Optimistic Update
        set((state) => {
          const answers = { ...state.progressData.answers, [questionId]: isCorrect };

          if (previousAnswer !== undefined) {
            return {
              progressData: {
                ...state.progressData,
                correct: state.progressData.correct + (isCorrect ? 1 : -1),
                incorrect: state.progressData.incorrect + (isCorrect ? -1 : 1),
                answers,
              },
            };
          }

          return {
            progressData: {
              ...state.progressData,
              answered: state.progressData.answered + 1,
              correct: state.progressData.correct + (isCorrect ? 1 : 0),
              incorrect: state.progressData.incorrect + (isCorrect ? 0 : 1),
              answers,
            },
          };
        });

        // Backend Sync (Delta) & Rollback Granular
        try {
          const res = await fetch("/api/sync/push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "REGISTER_ANSWER",
              payload: { questionId, isCorrect },
              updatedAt: Date.now(),
            }),
          });
          if (!res.ok) throw new Error("Sync failed");
        } catch (err) {
          console.error("[StudyStore] Rollback on registerAnswer:", err);
          set((state) => {
            const newAnswers = { ...state.progressData.answers };
            let newCorrect = state.progressData.correct;
            let newIncorrect = state.progressData.incorrect;
            let newAnswered = state.progressData.answered;
            
            if (previousAnswer === undefined) {
              delete newAnswers[questionId];
              newAnswered -= 1;
              newCorrect -= (isCorrect ? 1 : 0);
              newIncorrect -= (isCorrect ? 0 : 1);
            } else {
              newAnswers[questionId] = previousAnswer;
              newCorrect += (previousAnswer ? 1 : -1);
              newIncorrect += (previousAnswer ? -1 : 1);
            }
            
            return { 
              progressData: { answered: newAnswered, correct: newCorrect, incorrect: newIncorrect, answers: newAnswers }, 
              error: "Falha ao sincronizar resposta. Ação revertida localmente." 
            };
          });
          setTimeout(() => set({ error: null }), 4000);
        }
      },
      toggleTopicCompletion: async (topicId) => {
        const wasCompleted = get().completedTopicIds.includes(topicId);

        // Optimistic Update
        set((state) => ({
          completedTopicIds: wasCompleted
            ? state.completedTopicIds.filter((id) => id !== topicId)
            : [...state.completedTopicIds, topicId],
        }));

        // Backend Sync (Delta) & Rollback Granular
        try {
          const res = await fetch("/api/sync/push", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "TOGGLE_TOPIC",
              payload: { topicId, isCompleted: !wasCompleted },
              updatedAt: Date.now(),
            }),
          });
          if (!res.ok) throw new Error("Sync failed");
        } catch (err) {
          console.error("[StudyStore] Rollback on toggleTopicCompletion:", err);
          set((state) => ({ 
            completedTopicIds: wasCompleted
              ? [...state.completedTopicIds, topicId]
              : state.completedTopicIds.filter((id) => id !== topicId), 
            error: "Falha ao salvar conclusão do tópico. Tente novamente." 
          }));
          setTimeout(() => set({ error: null }), 4000);
        }
      },
    }),
    {
      name: "aivur-study-store",
      storage: createJSONStorage(() => localStorage),
      // Only persist navigation state and custom trilhas
      partialize: (state) => ({
        activeModuleId: state.activeModuleId,
        currentTopicId: state.currentTopicId,
        activeTab: state.activeTab,
        progressData: state.progressData,
        completedTopicIds: state.completedTopicIds,
        customTrilhas: state.customTrilhas,
        selectedVideoByTrilha: state.selectedVideoByTrilha,
      }),
    }
  )
);
