/**
 * SnowUI Design System — Programmatic Tokens
 *
 * All dashboard surfaces, cards, and components should reference
 * these tokens for consistent spacing, radii, and colour.
 */

export const snow = {
  /* ── Colour palette ─────────────────────────────────── */
  colors: {
    // Primary black scale
    black: {
      DEFAULT: "#1A1A2E",
      100: "#6E6E80",   // muted text
      200: "#3A3A4A",   // secondary text
    },
    white: {
      DEFAULT: "#FFFFFF",
      100: "#F9F9FA",   // Background 2 — surface
      200: "#F4F4F5",   // Background 3
      300: "#EBEBED",   // subtle border
      400: "#E0E0E3",   // divider
    },
    // Semantic / accent
    primary:   "#4F46E5",   // indigo-600
    success:   "#16A34A",
    warning:   "#F59E0B",
    danger:    "#EF4444",
    info:      "#3B82F6",
    // Pastel card backgrounds
    pastel: {
      indigo:  "#EDEEFC",  // Hot Opportunities
      blue:    "#E6F1FD",  // default metric
      green:   "#E6F9EE",
      amber:   "#FEF3C7",
    },
  },

  /* ── Radii ──────────────────────────────────────────── */
  radius: {
    card:       "12px",      // standard card
    component:  "20px",      // larger surfaces / sections
    metric:     "24px",      // MetricCard
  },

  /* ── Shadows ────────────────────────────────────────── */
  shadow: {
    none: "none",
    sm: "0 1px 2px rgba(0,0,0,0.04)",
  },
} as const;
