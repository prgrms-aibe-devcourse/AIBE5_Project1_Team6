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
  setThemes: (theme) => set((state) => {
    const isSelected = state.themes.includes(theme);
    if (isSelected) {
      return { themes: state.themes.filter(t => t !== theme) };
    } else {
      return { themes: [...state.themes, theme] };
    }
  }),
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
