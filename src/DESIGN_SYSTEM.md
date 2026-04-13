# SnowUI Design System

## Colour Tokens (snow namespace)

| Token | Value | Usage |
|---|---|---|
| `snow-black` | `#1A1A2E` | Primary text |
| `snow-black-100` | `#6E6E80` | Muted / secondary text |
| `snow-black-200` | `#3A3A4A` | Subtitle text |
| `snow-white` | `#FFFFFF` | Card backgrounds |
| `snow-white-100` | `#F9F9FA` | Background 2 (surfaces) |
| `snow-white-200` | `#F4F4F5` | Background 3 |
| `snow-white-300` | `#EBEBED` | Subtle borders |
| `snow-white-400` | `#E0E0E3` | Dividers |
| `snow-primary` | `#4F46E5` | Accent / links |

## Radii

- Cards: `12px`
- Components / sections: `20px`
- MetricCards: `24px`

## Dashboard Layout

- White background
- Two-column: Main content + 280px sidebar (xl+)
- All surface panels use `snow-white-100` bg, `20px` rounded corners, no border or shadow

## MetricCards

- Pastel backgrounds (`#EDEEFC` for Hot Opportunities, `#E6F1FD` for others)
- `24px` corners, increased vertical padding (`py-7`)
- Title: `text-sm text-snow-black-100 tracking-wide font-normal`

## Lead Previews

- Minimalist: rounded-lg avatar (initials), name, truncated headline
- Status dots (green/amber/gray) — no emoji
- Clickable signal icon if post URL exists
