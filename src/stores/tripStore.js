import { create } from 'zustand';

export const useTripStore = create((set) => ({
  step: 0,
  transport: null,
  budget: null,
  duration: null,
  themes: [],
  priority: null,

  setStep: (step) => set({ step }),
  nextStep: () => set((state) => ({ step: state.step + 1 })),
  prevStep: () => set((state) => ({ step: Math.max(0, state.step - 1) })),
  
  setTransport: (transport) => set({ transport }),
  setBudget: (budget) => set({ budget }),
  setDuration: (duration) => set({ duration }),
  // 단일 선택(토스형 스무고개 UX): 하나를 고르면 바로 그 값으로 교체
  // 기존 코드(다중 선택)와의 호환을 위해 배열 형태는 유지합니다.
  setThemes: (theme) => set({ themes: [theme] }),
  setPriority: (priority) => set({ priority }),
  
  reset: () => set({ 
    step: 0, 
    transport: null, 
    budget: null, 
    duration: null, 
    themes: [], 
    priority: null
  }),
}));
