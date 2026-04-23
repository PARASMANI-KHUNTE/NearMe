export type ThemeMode = 'day' | 'night';

const sharedTheme = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: 'bold' },
    h2: { fontSize: 24, fontWeight: 'bold' },
    h3: { fontSize: 20, fontWeight: 'bold' },
    body: { fontSize: 16, fontWeight: 'normal' },
    caption: { fontSize: 14, fontWeight: 'normal' },
    small: { fontSize: 12, fontWeight: 'normal' },
  },
};

const warmDayColors = {
  primary: '#D97706',
  secondary: '#F59E0B',
  background: '#FFF8EE',
  surface: '#FFFFFF',
  text: '#3B2A16',
  accent: '#C2410C',
  danger: '#DC2626',
  border: '#F3D9B1',
};

const warmNightColors = {
  primary: '#F59E0B',
  secondary: '#FBBF24',
  background: '#1A120B',
  surface: '#2A1D14',
  text: '#FFF3E0',
  accent: '#FDBA74',
  danger: '#F87171',
  border: '#4A3323',
};

export const getTheme = (mode: ThemeMode) => ({
  ...sharedTheme,
  colors: mode === 'day' ? warmDayColors : warmNightColors,
});

// Default fallback for files not migrated to dynamic theming yet.
export const theme = getTheme('night');

export type AppTheme = ReturnType<typeof getTheme>;
