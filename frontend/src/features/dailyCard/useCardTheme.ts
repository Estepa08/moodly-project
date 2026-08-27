import { useState } from 'react';
import { getCardTheme, setCardTheme, type CardTheme } from './dailyCard';

export interface UseCardThemeResult {
  theme: CardTheme;
  setTheme: (theme: CardTheme) => void;
}

export function useCardTheme(): UseCardThemeResult {
  const [theme, setThemeState] = useState<CardTheme>(() => getCardTheme());

  return {
    theme,
    setTheme: (next) => {
      setCardTheme(next);
      setThemeState(next);
    },
  };
}
