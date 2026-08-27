# Solace

A private space with four rooms and an optional companion.

Not therapy. Not a diagnosis. Just a place that can feel like yours.

## What Solace is

Solace is a quiet web app for sitting with how you feel. A short set of questions can suggest a room. You can also choose for yourself, return later, or sit with Solace Companion.

Nothing here is medical care. Nothing here tries to score, diagnose, or fix you.

## Philosophy

- The rooms have different personalities. They are not one generic wellness product.
- Persistence stays on this device unless you choose an optional AI feature.
- AI is opt-in, named, and easy to turn off.
- Copy stays plain. It does not pretend to be a clinician.

## Core experiences

Four sanctuaries, and no fifth:

- **Studio** — draw, sit with it, keep it or let it go.
- **Library** — a private journal, a quiet page to read, optional breathing.
- **Garden** — return, notice, leave something small. The plant grows slowly. It does not die.
- **Arcade** — three untimed activities when your mind needs somewhere else to go.

You can switch rooms from the header. Home is always available. Returning visitors are not auto-redirected.

## Solace Companion

Companion is a dedicated AI conversation at `/companion`. It is session-only. You can hold something on this device without sending it. Four modes are available; the safety architecture stays on the server.

Companion is not therapy, not a diagnosis, and not emergency care.

## Privacy and safety

- Journal pages, drawings, garden notes, and quiz memory live in `localStorage` on this device.
- Companion “Just hold this” notes live in `sessionStorage` for this visit only.
- Enabling AI sends the relevant input for that feature through Solace’s Netlify function. The Anthropic key never ships in the browser bundle.
- Support links are available from the header. Solace does not provide crisis intervention.

## Tech stack

- Vite, React 18, TypeScript
- Tailwind CSS, Framer Motion, React Router
- Netlify Functions (Anthropic Messages API proxy)
- Vitest for a small unit suite

## Local setup

```bash
npm install
npm run dev
```

Open the local Vite URL. The app works without an API key. Optional AI features stay off until you enable them and a key is configured for the function.

```bash
npm run build
npm run preview
npm run lint
npm test
```

## Environment variables

Copy `.env.example` to `.env` if you want local AI through Netlify Dev:

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

This variable is **server-only**. Do not prefix it with `VITE_`. Do not commit `.env`.

## Netlify deployment

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- SPA fallback: `/*` → `/index.html` (`force = false` so `/.netlify/functions/claude` is not rewritten)
- Set `ANTHROPIC_API_KEY` in the Netlify site environment
- Security headers and CSP are defined in `netlify.toml`

For local functions: `npx netlify dev` (uses the `[dev]` block in `netlify.toml`).

## Accessibility

- Skip link, visible focus, dialog focus traps, Escape to close
- Sanctuary switcher and library tabs are keyboard reachable
- Quiz does not auto-advance; Next is explicit
- `prefers-reduced-motion` is respected in Framer Motion and custom animation
- Companion identity, consent, and privacy lines stay visible

## Architecture overview

```
src/pages              Landing, quiz, companion, sanctuary router
src/components         Four sanctuaries, Companion, shared chrome
src/utils              Scoring, journal store, sanctuary metadata, AI clients
netlify/functions      claude.ts — consent-gated Anthropic proxy
```

`src/utils/sanctuaries.ts` is the source of truth for room ids, labels, needs, and routes.

Client AI calls go to `/.netlify/functions/claude`. Companion replies are JSON. Sanctuary AI helpers fall back to local copy if the proxy is unavailable.

## Screenshots

Add stills here when they are ready:

- Landing — first visit
- Landing — returning visit
- Studio
- Library
- Garden
- Arcade
- Companion

## Roadmap / future ideas

Intentionally not in this release:

- A fifth sanctuary
- Accounts, cloud sync, or social features
- Long-term AI memory
- Product analytics beyond what the host already provides

Possible later polish:

- A dedicated Open Graph image and real screenshots
- Canonical URL after a public deploy
- A PNG home-screen icon

## Disclaimer

Solace is not therapy, diagnosis, treatment, or emergency care. If you need urgent help, use local emergency services or the support links in the app.
