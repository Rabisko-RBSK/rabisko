import { theme } from './index';

export const studioDashboardTheme = {
  colors: {
    background: '#F1EBE4',
    card: theme.colors.paper,
    text: '#1C1917',
    muted: '#7A7570',
    purple: '#5B2368',
    tint: '#F5EEF7',
    soft: '#F8F6F4',
    line: '#F1ECE7',
    success: theme.colors.success,
  },
  fonts: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
    extraBold: 'Inter_800ExtraBold',
  },
  radius: { card: 26, row: theme.radius.lg, pill: theme.radius.pill },
  spacing: theme.spacing,
} as const;
