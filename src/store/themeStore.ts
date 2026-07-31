// src/store/themeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeState = {
  darkMode: boolean;
  toggleDarkMode: () => void;
};

const prefersDarkMode =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      darkMode: prefersDarkMode,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
    }),
    {
      name: 'theme-storage',
    }
  )
);
