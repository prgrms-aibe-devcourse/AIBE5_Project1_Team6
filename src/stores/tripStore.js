import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useTripStore = create(
  persist(
    (set) => ({
      step: 0,
      transport: null,
      budget: null,
      duration: null,
      themes: [],
      priority: null,
      
      // New Wellness States
      mood: null,
      companion: null,
      destination: null,
      trafficOption: null,
      budgetAmount: null,

      setStep: (step) => set({ step }),
      nextStep: () => set((state) => ({ step: state.step + 1 })),
      prevStep: () => set((state) => ({ step: Math.max(0, state.step - 1) })),
      
      setTransport: (transport) => set({ transport }),
      setBudget: (budget) => set({ budget }),
      setDuration: (duration) => set({ duration }),
      setThemes: (theme) => set({ themes: [theme] }),
      setPriority: (priority) => set({ priority }),
      
      // New Setters
      setMood: (mood) => set({ mood }),
      setCompanion: (companion) => set({ companion }),
      setDestination: (destination) => set({ destination }),
      setTrafficOption: (trafficOption) => set({ trafficOption }),
      setBudgetAmount: (budgetAmount) => set({ budgetAmount }),
      
      reset: () => set({ 
        step: 0, 
        transport: null, 
        budget: null, 
        duration: null, 
        themes: [], 
        priority: null,
        mood: null,
        companion: null,
        destination: null,
        trafficOption: null,
        budgetAmount: null
      }),
    }),
    {
      name: 'trip-storage', // localStorage key
      getStorage: () => localStorage, // Default is localStorage
    }
  )
);
