import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AivoState = 'idle' | 'greeting' | 'speaking' | 'thinking' | 'loading' | 'success' | 'error' | 'sleepy' | 'hidden' | 'minimized';

export interface Message {
  id: string;
  sender: 'user' | 'aivo';
  text: string;
  timestamp: number;
}

interface AivoStore {
  state: AivoState;
  messages: Message[];
  targetAnchor: string | null;
  isOpen: boolean;
  isSending: boolean;
  
  setState: (state: AivoState) => void;
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  clearMessages: () => void;
  setTargetAnchor: (anchor: string | null) => void;
  setIsOpen: (isOpen: boolean) => void;
  setIsSending: (isSending: boolean) => void;
}

export const useAivoStore = create<AivoStore>()(
  persist(
    (set) => ({
      state: 'idle',
      messages: [
        { id: '1', sender: 'aivo', text: 'Olá! Sou o AIVU, seu assistente. Como posso ajudar?', timestamp: Date.now() }
      ],
      targetAnchor: null,
      isOpen: false,
      isSending: false,

      setState: (state) => set({ state }),
      addMessage: (msg) => set((prev) => ({
        messages: [...prev.messages, { ...msg, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() }]
      })),
      clearMessages: () => set({ messages: [] }),
      setTargetAnchor: (targetAnchor) => set({ targetAnchor }),
      setIsOpen: (isOpen) => set({ isOpen }),
      setIsSending: (isSending) => set({ isSending }),
    }),
    {
      name: 'aivo-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
