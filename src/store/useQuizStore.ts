import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Mode = 'concurso' | 'livre' | 'redacao' | 'aivos360' | null;

export interface QuizFilters {
  materia: string;
  assunto: string;
  banca: string;
  cargo: string;
  dificuldade: string;
  ano: string;
  orgao: string;
  nivel: string;
  quantidade: number;
  tipoQuestao: string;
  alternativas: number;
}

export interface FreeStudyState {
  text: string;
  qtd: number;
  tipo: string;
}

export interface QuizState {
  step: number;
  mode: Mode;
  filters: QuizFilters;
  freeStudy: FreeStudyState;
  generatedQuestions: any[];
  answered: number;
  isDrawerOpen: boolean;
  editalText: string;
  
  setStep: (step: number) => void;
  setMode: (mode: Mode) => void;
  setFilters: (filters: Partial<QuizFilters>) => void;
  setFreeStudy: (freeStudy: Partial<FreeStudyState>) => void;
  setGeneratedQuestions: (questions: any[]) => void;
  setAnswered: (count: number) => void;
  setDrawerOpen: (open: boolean) => void;
  setEditalText: (text: string) => void;
  resetState: () => void;
}

const defaultFilters: QuizFilters = {
  materia: 'Todas',
  assunto: 'Todos',
  banca: 'Todas',
  cargo: 'Todos',
  dificuldade: 'Todas',
  ano: 'Todos',
  orgao: 'Todos',
  nivel: 'Todos',
  quantidade: 10,
  tipoQuestao: 'mc',
  alternativas: 5
};

const defaultFreeStudy: FreeStudyState = {
  text: '',
  qtd: 5,
  tipo: 'multipla'
};

export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      step: 1,
      mode: null,
      filters: defaultFilters,
      freeStudy: defaultFreeStudy,
      generatedQuestions: [],
      answered: 0,
      isDrawerOpen: false,
      editalText: '',

      setStep: (step) => set({ step }),
      setMode: (mode) => set({ mode }),
      setFilters: (newFilters) => 
        set((state) => ({ filters: { ...state.filters, ...newFilters } })),
      setFreeStudy: (newFree) => 
        set((state) => ({ freeStudy: { ...state.freeStudy, ...newFree } })),
      setGeneratedQuestions: (questions) => set({ generatedQuestions: questions }),
      setAnswered: (answered) => set({ answered }),
      setDrawerOpen: (isDrawerOpen) => set({ isDrawerOpen }),
      setEditalText: (editalText) => set({ editalText }),
      resetState: () => set({ 
        step: 1, 
        mode: null, 
        filters: defaultFilters,
        freeStudy: defaultFreeStudy,
        generatedQuestions: [], 
        answered: 0,
        editalText: ''
      }),
    }),
    {
      name: 'aivur-quiz-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
