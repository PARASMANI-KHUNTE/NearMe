import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getTheme } from '../theme';

export const useAppTheme = () => {
  const themeMode = useAppStore((state) => state.themeMode);

  const appTheme = useMemo(() => getTheme(themeMode), [themeMode]);

  return {
    theme: appTheme,
    themeMode,
    isDay: themeMode === 'day',
    isNight: themeMode === 'night',
  };
};
