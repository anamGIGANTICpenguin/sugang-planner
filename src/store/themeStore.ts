// src/store/themeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeState = {
  darkMode: boolean;
  toggleDarkMode: () => void;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      // Always return true for dark mode
      darkMode: true,
      toggleDarkMode: () => set(() => ({ darkMode: true })),
    }),
    {
      name: 'theme-storage',
    }
  )
);