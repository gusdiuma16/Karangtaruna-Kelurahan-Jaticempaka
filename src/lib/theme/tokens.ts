export type ThemeMode = 'light' | 'dark';

export interface ThemeTokenSet {
  mode: ThemeMode;
  canvas: string;
  surface: string;
  surfaceElevated: string;
  border: string;
  textPrimary: string;
  textMuted: string;
  accentBlue: string;
  accentOrange: string;
  accentRed: string;
}

export const KARANG_TARUNA_THEME_TOKENS: Record<ThemeMode, ThemeTokenSet> = {
  light: {
    mode: 'light',
    canvas: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceElevated: '#FFFFFF',
    border: '#E2E8F0',
    textPrimary: '#0F172A',
    textMuted: '#475569',
    accentBlue: '#1D4ED8',
    accentOrange: '#EA580C',
    accentRed: '#DC2626',
  },
  dark: {
    mode: 'dark',
    canvas: '#0B1220',
    surface: '#111C30',
    surfaceElevated: '#16233B',
    border: '#1E2D4A',
    textPrimary: '#F1F5F9',
    textMuted: '#94A3B8',
    accentBlue: '#3B82F6',
    accentOrange: '#FB923C',
    accentRed: '#F87171',
  },
};
