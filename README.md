# Solace

A private space with four rooms and an optional companion.

Not therapy. Not a diagnosis. Just a place that can feel like yours.

**Status:** production-ready static SPA + one Netlify Function. No live URL in this repository yet.

**Live demo:** _add the Netlify URL here after first deploy._

Solace does not score you, label a personality, or try to fix you. A short set of questions can suggest a room for today. You can ignore the suggestion. You can return later. Persistence stays on this device unless you opt into AI.

## What makes it different

- Four need-based rooms, not a diagnosis or a fifth “catch-all”
- Local-first storage; AI is named, optional, and server-proxied
- Companion is an AI conversation that does not pretend to be human, therapy, or emergency care
- Accessibility (keyboard, reduced motion, focus traps) is treated as part of emotional safety
- Features were removed on purpose: no accounts, no streaks-as-worth, no long-term AI memory

## The four sanctuaries

| Room | When you need |
| --- | --- |
| **Studio** | to let something out — draw, sit with it, keep it or let it go |
| **Library** | somewhere quiet — private journal, a page to read, optional breathing |
| **Garden** | to slow down — return, notice, leave something small |
| **Arcade** | your mind somewhere else — three untimed activities |

Returning visitors are not auto-redirected. Home stays home.

## Solace Companion

A dedicated route at `/companion`. Session-only chat. Four modes. You can **Just hold this** on the device without sending it to AI.

It stays with you. It does not try to fix you. It is not a therapist, not a person, and not emergency care.

## Privacy-first architecture

- Journal, gallery, garden notes, and quiz memory: `localStorage` on this device
- Held Companion notes: `sessionStorage` for this visit only
- Sanctuary content is not auto-sent to Companion; Studio drawings are not auto-analyzed
- `ANTHROPIC_API_KEY` lives only in the Netlify Function environment — never in the browser bundle, never as `VITE_*`

## Tech stack

Vite · React 18 · TypeScript · Tailwind CSS · Framer Motion · React Router · Netlify Functions · Vitest

## Screenshots

Add stills to `docs/screenshots/` when you capture them. Use mock writing only — never real journal or Companion text.

| File | Scene |
| --- | --- |
| `01-landing.png` | First visit, Begin + Companion |
| `02-returning.png` | Welcome back, suggested room |
| `03-studio.png` | Empty canvas and tools |
| `04-studio-ritual.png` | Keep / let go / sit with it |
| `05-library.png` | Journal list, “kept on this device” |
| `06-garden.png` | Mid-growth plant, leave-something |
| `07-arcade.png` | Three activity choices |
| `08-companion-modes.png` | Mode selection, AI identity visible |
| `09-companion-talk.png` | One short mock exchange |
| `10-mobile.png` | Header + room at 375px |

## Architecture

```
src/pages                 Landing, quiz, companion, sanctuary router
src/components            Four rooms, Companion, shared chrome
src/utils                 Scoring, journal store, sanctuary metadata, AI clients
netlify/functions         claude.ts — allowlisted Anthropic proxy
src/utils/sanctuaries.ts  Source of truth for room ids, labels, needs, routes
```

Client AI calls `/.netlify/functions/claude`. Companion replies are JSON. Sanctuary AI falls back to local copy if the proxy is unavailable.

## Accessibility

Skip link, visible focus, dialog focus traps, Escape to close, keyboard quiz (no auto-advance), roving library tabs, `prefers-reduced-motion` via Framer `MotionConfig` and custom animation.

## Testing

```bash
npm test
```

Vitest smoke tests for sanctuary scoring, journal migration, garden progress helpers, sanctuary metadata, and Companion payload parsing.

## Local setup

```bash
npm install
npm run dev
```

The app works without an API key. Optional AI stays off until you enable it and configure the function.

```bash
npm run build
npm run preview
npm run lint
npm test
```

## Environment

For local functions (`npx netlify dev`), copy `.env.example` to `.env`:

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

Server-only. Do not prefix with `VITE_`. Do not commit `.env`.

## Netlify

`netlify.toml` already sets:

- Build: `npm run build`
- Publish: `dist`
- Functions: `netlify/functions`
- Function `claude` timeout: 26s
- SPA fallback: `/*` → `/index.html` (`force = false`)
- Security headers + CSP

**Deploy**

1. Push this repo to GitHub.
2. New Netlify site from that repo. Build settings come from `netlify.toml`.
3. Site settings → Environment variables → `ANTHROPIC_API_KEY` (production, and preview if you want AI there). Never commit the real key.
4. Deploy. Confirm `https://YOUR-SITE/quiz`, `/companion`, and `/sanctuary/garden` still work after a refresh.
5. When the URL is stable, set canonical + `og:url` and make `og:image` an absolute URL to `/og.png` (see comments in `index.html`).

Open Graph image: `public/og.png` (1200×630). Relative `/og.png` is wired now; some crawlers want the absolute URL after deploy.

## Disclaimer

Solace is not therapy, diagnosis, treatment, or emergency care. If you need urgent help, use local emergency services or the support links in the app.
