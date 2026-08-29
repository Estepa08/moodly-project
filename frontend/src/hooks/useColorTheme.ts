import { useState } from 'react';
import { getColorTheme, setColorTheme, type ColorThemeId } from '../lib/colorTheme';

export interface UseColorThemeResult {
  theme: ColorThemeId;
  setTheme: (theme: ColorThemeId) => void;
}

export function useColorTheme(): UseColorThemeResult {
  const [theme, setThemeState] = useState<ColorThemeId>(() => getColorTheme());

  return {
    theme,
    setTheme: (next) => {
      setColorTheme(next);
      setThemeState(next);
    },
  };
}
