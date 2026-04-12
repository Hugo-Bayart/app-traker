export type ThemeId = 'f1' | 'violet-nuit' | 'noir-brutal' | 'corail' | 'teal-premium';

export interface ThemeVars {
  bg: string;
  card: string;
  surface2: string;
  accent1: string;
  accent2: string;
  accent3: string;
  primaryLight: string;
  primaryShadow: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  radiusCard: string;
  radiusBtn: string;
  radiusPill: string;
  radiusIcon: string;
  titleFont: string;
  dataFont: string;
  titleTransform: string;
  titleWeight: string;
  dataWeight: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  vars: ThemeVars;
}

export const THEMES: Theme[] = [
  {
    id: 'f1',
    name: 'F1 / HUD',
    description: 'Cockpit technique · Rouge & noir',
    vars: {
      bg: '#060608', card: '#0D0D0F', surface2: '#141416',
      accent1: '#E10600', accent2: '#FF8800', accent3: '#FFD700',
      primaryLight: 'rgba(225, 6, 0, 0.15)', primaryShadow: 'rgba(225, 6, 0, 0.35)',
      textPrimary: '#F0F0F0', textSecondary: '#888888', textMuted: '#555555',
      border: '#1E1E22',
      radiusCard: '6px', radiusBtn: '6px', radiusPill: '6px', radiusIcon: '6px',
      titleFont: "'Exo 2'", dataFont: "'Share Tech Mono'",
      titleTransform: 'uppercase', titleWeight: '800', dataWeight: '400',
    },
  },
  {
    id: 'violet-nuit',
    name: 'Violet Nuit',
    description: 'Sombre & élégant · Mauve profond',
    vars: {
      bg: '#0E0B1F', card: '#151028', surface2: '#1C1638',
      accent1: '#7C6BFF', accent2: '#A78BFA', accent3: '#C4B5FD',
      primaryLight: 'rgba(124, 107, 255, 0.15)', primaryShadow: 'rgba(124, 107, 255, 0.35)',
      textPrimary: '#E8E3FF', textSecondary: '#6B5FAA', textMuted: '#4A4080',
      border: 'rgba(124, 107, 255, 0.2)',
      radiusCard: '12px', radiusBtn: '12px', radiusPill: '20px', radiusIcon: '10px',
      titleFont: "'Space Grotesk'", dataFont: "'Space Grotesk'",
      titleTransform: 'none', titleWeight: '700', dataWeight: '500',
    },
  },
  {
    id: 'noir-brutal',
    name: 'Noir Brutal',
    description: 'Minimalisme agressif · Blanc sur noir',
    vars: {
      bg: '#111111', card: '#1E1E1E', surface2: '#262626',
      accent1: '#FFFFFF', accent2: '#AAAAAA', accent3: '#555555',
      primaryLight: 'rgba(255, 255, 255, 0.1)', primaryShadow: 'rgba(255, 255, 255, 0.2)',
      textPrimary: '#FFFFFF', textSecondary: '#888888', textMuted: '#555555',
      border: '#2A2A2A',
      radiusCard: '2px', radiusBtn: '2px', radiusPill: '4px', radiusIcon: '2px',
      titleFont: "'Bebas Neue'", dataFont: "'JetBrains Mono'",
      titleTransform: 'uppercase', titleWeight: '400', dataWeight: '400',
    },
  },
  {
    id: 'corail',
    name: 'Corail',
    description: 'Chaleureux & moderne · Terracotta',
    vars: {
      bg: '#FFF8F6', card: '#FFFFFF', surface2: '#FFF0EC',
      accent1: '#C94A2B', accent2: '#E07055', accent3: '#F5A896',
      primaryLight: 'rgba(201, 74, 43, 0.1)', primaryShadow: 'rgba(201, 74, 43, 0.25)',
      textPrimary: '#1A0A06', textSecondary: '#7A4030', textMuted: '#C4A098',
      border: '#FDDDD7',
      radiusCard: '16px', radiusBtn: '24px', radiusPill: '20px', radiusIcon: '10px',
      titleFont: "'Nunito'", dataFont: "'Nunito'",
      titleTransform: 'none', titleWeight: '900', dataWeight: '700',
    },
  },
  {
    id: 'teal-premium',
    name: 'Teal Premium',
    description: 'Nature & luxe · Vert sombre',
    vars: {
      bg: '#0D1F1B', card: '#1D3830', surface2: '#243F38',
      accent1: '#1D9E75', accent2: '#5DCAA5', accent3: '#9FE1CB',
      primaryLight: 'rgba(29, 158, 117, 0.15)', primaryShadow: 'rgba(29, 158, 117, 0.35)',
      textPrimary: '#D4F5EC', textSecondary: '#3A8A6E', textMuted: '#2A6050',
      border: 'rgba(29, 158, 117, 0.25)',
      radiusCard: '10px', radiusBtn: '10px', radiusPill: '16px', radiusIcon: '10px',
      titleFont: "'Space Grotesk'", dataFont: "'Space Grotesk'",
      titleTransform: 'none', titleWeight: '700', dataWeight: '500',
    },
  },
];

export const DEFAULT_THEME_ID: ThemeId = 'f1';
export function getThemeById(id: ThemeId): Theme {
  return THEMES.find(t => t.id === id) ?? THEMES[0];
}
