export const Colors = {
  // Fonds
  bg: '#F0F2F8',
  bgAlt: '#E8EBF4',

  // Bleu marine
  navy: '#0F172A',
  navyLight: '#1E293B',
  navyMedium: '#334155',
  navyMuted: 'rgba(15, 23, 42, 0.07)',
  navyBorder: 'rgba(15, 23, 42, 0.12)',

  // Surface
  surface: '#FFFFFF',
  surfaceAlt: '#F4F6FB',
  surfaceElevated: '#FFFFFF',

  // Accent Or
  accent: '#D97706',
  accentLight: '#FEF3C7',
  accentLighter: '#FFFBEB',
  accentBorder: 'rgba(217, 119, 6, 0.22)',

  // Textes
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textLight: '#F8FAFC',
  textLightMuted: '#94A3B8',

  // Catégories
  talk: '#6366F1',
  talkBg: '#EEF2FF',
  talkGradient: 'rgba(99, 102, 241, 0.12)',
  workshop: '#059669',
  workshopBg: '#ECFDF5',
  workshopGradient: 'rgba(5, 150, 105, 0.12)',
  club: '#D97706',
  clubBg: '#FFFBEB',
  clubGradient: 'rgba(217, 119, 6, 0.12)',
  exam: '#DC2626',
  examBg: '#FEF2F2',
  examGradient: 'rgba(220, 38, 38, 0.12)',
  other: '#7C3AED',
  otherBg: '#F5F3FF',
  otherGradient: 'rgba(124, 58, 237, 0.12)',

  // Statuts
  success: '#059669',
  warning: '#D97706',
  danger: '#DC2626',

  // Bordures
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  full: 999,
};

export function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    Talk: Colors.talk,
    Workshop: Colors.workshop,
    Club: Colors.club,
    Exam: Colors.exam,
    Other: Colors.other,
  };
  return map[category] || Colors.other;
}

export function getCategoryBg(category: string): string {
  const map: Record<string, string> = {
    Talk: Colors.talkBg,
    Workshop: Colors.workshopBg,
    Club: Colors.clubBg,
    Exam: Colors.examBg,
    Other: Colors.otherBg,
  };
  return map[category] || Colors.otherBg;
}

export function getCategoryGradient(category: string): string {
  const map: Record<string, string> = {
    Talk: Colors.talkGradient,
    Workshop: Colors.workshopGradient,
    Club: Colors.clubGradient,
    Exam: Colors.examGradient,
    Other: Colors.otherGradient,
  };
  return map[category] || Colors.otherGradient;
}

export function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    Talk: '🎤',
    Workshop: '🛠️',
    Club: '🎭',
    Exam: '📝',
    Other: '✨',
  };
  return map[category] || '✨';
}