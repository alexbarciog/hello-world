/**
 * SnowUI Design System — Programmatic Tokens
 *
 * Import and use these constants for consistent styling across the app.
 * Prefer Tailwind utility classes (.snow-card, .snow-surface, etc.) in JSX.
 * Use these constants when you need values in JS (e.g. chart colors, inline styles).
 */

export const snowui = {
  colors: {
    black: {
      100: '#000000',
      80: '#333333',
      40: '#666666',
      20: '#999999',
      10: '#CCCCCC',
      4: '#F5F5F5',
    },
    background: {
      1: '#FFFFFF',
      2: '#F7F8FA',
      3: '#F0F1F3',
    },
    surface: {
      1: '#FFFFFF',
      2: '#F7F8FA',
      3: '#EDEDF0',
    },
    secondary: {
      purple: '#7B61FF',
      indigo: '#6366F1',
      blue: '#3B82F6',
      cyan: '#06B6D4',
      mint: '#34D399',
      green: '#22C55E',
      yellow: '#EAB308',
      orange: '#F97316',
      red: '#EF4444',
    },
  },

  radius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
  },

  spacing: {
    0: 0,
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    10: 40,
    12: 48,
    20: 80,
  },

  text: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
    '4xl': 64,
  },

  shadows: {
    dropShadow1: '0 1px 2px rgba(0,0,0,0.05)',
    dropShadow2: '0 4px 12px rgba(0,0,0,0.08)',
    innerShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)',
    glass1: '0 0 0 0 transparent',
    focus: '0 0 0 2px #3B82F6',
  },

  blur: {
    glass1: 40,
    glass2: 100,
  },
} as const;

/** Shorthand chart color palette from secondary colors */
export const chartColors = [
  snowui.colors.secondary.blue,
  snowui.colors.secondary.indigo,
  snowui.colors.secondary.purple,
  snowui.colors.secondary.cyan,
  snowui.colors.secondary.mint,
  snowui.colors.secondary.green,
  snowui.colors.secondary.yellow,
  snowui.colors.secondary.orange,
  snowui.colors.secondary.red,
] as const;
