# devsigner demo showcase

A static single-page site that demonstrates devsigner's design personality system.

## What this shows

The same SaaS dashboard concept — three stat cards, a sidebar, and a CTA button — rendered six times, each with a different design personality:

| Personality | Key traits |
|---|---|
| **Bold Minimal** | Sharp corners (4px), no shadows, 1px borders, weight 800, spacious |
| **Warm Professional** | Rounded (12px), subtle shadows, gradient fills, balanced spacing |
| **Energetic Pop** | Pill corners (9999px), dramatic shadows, bold color, Nunito font |
| **Elegant Editorial** | Near-sharp (2px), no shadows, Playfair Display serif, generous whitespace |
| **Data Dense** | Subtle corners (4px), no shadows, compact spacing, tabular-nums |
| **Soft Wellness** | Pill corners, soft shadows, pastel palette, Nunito font, spacious padding |

Every token value (border-radius, box-shadow, font-family, font-weight, spacing, color intensity) comes directly from devsigner's `design_identity` tool output.

## Running locally

Open `index.html` in any browser. No build step required.

```bash
open demo/index.html        # macOS
start demo/index.html       # Windows
xdg-open demo/index.html    # Linux
```

## Deployment

This directory is intended to be deployed alongside the main landing page as a `/demo` route, showing potential users what devsigner can produce before they install it.

## Tech

- Single HTML file, under 30KB
- Google Fonts: Inter, Playfair Display, Nunito
- Mobile responsive
- Smooth scroll navigation
- Dark (#0a0a0a) page background to frame each personality section
