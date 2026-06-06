import { create } from 'zustand';
import { getColorScheme } from '@/lib/telegram';

interface ThemeState {
  colorScheme: 'light' | 'dark';
  setColorScheme: (scheme: 'light' | 'dark') => void;
  syncFromTelegram: () => void;
}

export const useThemeStore = create<ThemeState>()((set) => ({
  colorScheme: getColorScheme(),

  setColorScheme: (colorScheme) => {
    set({ colorScheme });
    // Apply to <html> for Tailwind dark mode
    if (colorScheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  syncFromTelegram: () => {
    const scheme = getColorScheme();
    set({ colorScheme: scheme });
    if (scheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },
}));
