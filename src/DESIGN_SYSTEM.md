# SnowUI Design System — Intentsly

## 90% Principle
If a token is used less than 10% of the time, don't add it to the system. Keep it minimal.

## Typography
- **Primary font**: Inter
- **Alternates**: SF Pro, Roboto, Averta

### Text Styles
| Name | Size | Weight |
|------|------|--------|
| Display | 64px | Semibold |
| H1 | 48px | Semibold |
| H2 | 32px | Semibold |
| H3 | 24px | Semibold |
| H4 | 18px | Semibold |
| Body | 16px | Regular |
| Body Small | 14px | Regular |
| Caption | 12px | Regular |

## Spacing (multiples of 4)
`0 · 4 · 8 · 12 · 16 · 20 · 24 · 28 · 32 · 40 · 48 · 80`

## Icon Sizes
`16 · 20 · 24 · 32 · 40 · 48 · 80`

## Corner Radius
| Token | Value | Usage |
|-------|-------|-------|
| none | 0px | — |
| xs | 4px | Tags, badges |
| sm | 8px | Inputs, buttons |
| md | 12px | Cards |
| lg | 16px | Modals, panels |
| xl | 20px | Large cards, metric cards |
| 2xl | 24px | Hero sections |

## Colors

### Primary (Black scale)
| Token | Hex | Opacity |
|-------|-----|---------|
| black-100 | #000000 | 100% |
| black-80 | #333333 | 80% |
| black-40 | #666666 | 40% |
| black-20 | #999999 | 20% |
| black-10 | #CCCCCC | 10% |
| black-4 | #F5F5F5 | 4% |

### Backgrounds & Surfaces
| Token | Hex | Usage |
|-------|-----|-------|
| background-1 | #FFFFFF | Page background |
| background-2 | #F7F8FA | Section background |
| background-3 | #F0F1F3 | Inset areas |
| surface-1 | #FFFFFF | Cards |
| surface-2 | #F7F8FA | Elevated surfaces |
| surface-3 | #EDEDF0 | Muted surfaces |

### Secondary Palette
| Name | Hex |
|------|-----|
| Purple | #7B61FF |
| Indigo | #6366F1 |
| Blue | #3B82F6 |
| Cyan | #06B6D4 |
| Mint | #34D399 |
| Green | #22C55E |
| Yellow | #EAB308 |
| Orange | #F97316 |
| Red | #EF4444 |

## Effect Styles
| Name | Value |
|------|-------|
| Drop Shadow 1 | `0 1px 2px rgba(0,0,0,0.05)` |
| Drop Shadow 2 | `0 4px 12px rgba(0,0,0,0.08)` |
| Inner Shadow | `inset 0 1px 2px rgba(0,0,0,0.06)` |
| Glass 1 | `background: rgba(255,255,255,0.72); backdrop-filter: blur(40px)` |
| Glass 2 | `background: rgba(255,255,255,0.48); backdrop-filter: blur(100px)` |
| Focus | `0 0 0 2px #3B82F6` |

## Component Philosophy
- Minimize component count — reuse base components
- Cards: white bg, `border-gray-200/60`, `rounded-[12px]`, `shadow-sm`
- Buttons: `rounded-lg` (8px), solid fills, no gradients in dashboard
- Inputs: no focus ring, flat style, `border-gray-200`

## CSS Utility Classes
Use these in components:
- `.snow-card` — standard card
- `.snow-card-lg` — large card (20px radius)
- `.snow-surface` — background-2 surface
- `.snow-text-primary` — headings
- `.snow-text-secondary` — metadata
- `.snow-btn-primary` — primary button
