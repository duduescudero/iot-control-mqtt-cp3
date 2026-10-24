import type { ThemeMode } from '../types/mqtt';
export const palettes = {
  dark: {
    background: '#0B121A', surface: '#131F2B', raised: '#1A2A38', border: '#263848',
    text: '#F1F6FA', muted: '#9BABB9', faint: '#718799', accent: '#54D6B3',
    accentSoft: '#173B36', onAccent: '#08261F', orange: '#FFC372', orangeSoft: '#3A2D20',
    blue: '#80BFFF', blueSoft: '#1D3148', danger: '#FF9B9B', dangerSoft: '#3B252C',
    nav: '#101B25', input: '#0F1923', shadow: '#000000',
  },
  light: {
    background: '#F3F6F7', surface: '#FFFFFF', raised: '#EDF3F4', border: '#DFE7EA',
    text: '#142D3B', muted: '#566C79', faint: '#6D818C', accent: '#167D65',
    accentSoft: '#E0F5ED', onAccent: '#FFFFFF', orange: '#A6630B', orangeSoft: '#FFF0D8',
    blue: '#246FAA', blueSoft: '#E8F2FC', danger: '#B73543', dangerSoft: '#FDECEF',
    nav: '#FFFFFF', input: '#F6F9FA', shadow: '#183240',
  },
} as const;
export type Colors = typeof palettes.dark | typeof palettes.light;
export const getColors = (mode: ThemeMode): Colors => palettes[mode];
