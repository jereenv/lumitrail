/**
 * Lumitrail design tokens — the single source of truth for the brand in code.
 *
 * The concept is "a trail of light burning fog off the world": a deep fog-blue
 * canvas, warm amber "lumen" as the primary light, and a teal "aurora" accent
 * for discovery/progress. See BRAND.md for the full rationale, and keep this
 * file in sync with it.
 */

export const palette = {
  /** Deep fog — the unexplored world and the darkest background. */
  ink: '#0F1B2D',
  surface: '#17263B',
  surfaceAlt: '#1E3149',
  /** Warm light that dispels the fog — the primary brand colour. */
  lumen: '#FFB74D',
  lumenBright: '#FFC97A',
  /** Discovery / progress accent. */
  aurora: '#38E0A6',
  /** Cool secondary accent for links and info. */
  sky: '#5B8DEF',
  text: '#E8EEF5',
  textMuted: '#8FA3BC',
  danger: '#FF6B6B',
  success: '#38E0A6',
  warning: '#FFB74D',
  /** Semi-transparent fog fill painted over unexplored map tiles. */
  fogOverlay: 'rgba(15, 27, 45, 0.86)',
  /** Green-teal fog painted over UNEXPLORED map (translucent so streets hint through). */
  fog: 'rgba(30, 107, 92, 0.82)',
  /** Dashed frontier border tracing the explored region's edge. */
  frontier: '#FFFFFF',
  /** Dark casing drawn under the frontier dashes for contrast. */
  frontierCasing: 'rgba(17, 42, 36, 0.6)',
} as const;

export const typography = {
  /** Distinctive geometric display face for headings and stats. */
  display: 'SpaceGrotesk',
  /** Highly readable body face. */
  body: 'Inter',
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 40,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
} as const;

export const tierColors = {
  bronze: '#CD7F32',
  silver: '#C7D0DB',
  gold: '#FFC24B',
  platinum: '#7FE7FF',
} as const;

export const theme = { palette, typography, spacing, radii, tierColors } as const;

export type Theme = typeof theme;
