export const colors = {
  bg: '#F4F5F7',
  card: '#FFFFFF',
  cardAlt: '#EEF0F3',
  border: '#E1E4E9',
  text: '#14161B',
  muted: '#6B7080',
  // Lime is for fills only (buttons, checks); on white it is too light for text.
  primary: '#C6F432',
  primaryText: '#14161B',
  // Darker green for accent text and icons on light surfaces.
  accent: '#4D7C0F',
  // Soft tints behind button labels.
  accentSoft: '#ECFCCB',
  accentBorder: '#D3EDA6',
  // Warm tone for the encouragement entry point, distinct from actions.
  support: '#B4442A',
  supportSoft: '#FDEEE8',
  danger: '#E5484D',
  dangerText: '#C62A2F',
  dangerSoft: '#FDECEC',
  success: '#2F9E6B',
};

// Chart colors by muscle group: validated categorical palette (fixed order,
// colorblind-safe adjacent pairs). Labels always accompany the color.
export const muscleColors = {
  Pecho: '#2a78d6',
  Espalda: '#eb6834',
  Piernas: '#1baf7a',
  Hombros: '#eda100',
  Bíceps: '#e87ba4',
  Tríceps: '#008300',
  Core: '#6250d6',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
};
