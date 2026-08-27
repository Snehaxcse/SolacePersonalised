# Solace

A private space with four rooms and an optional companion.

Not therapy. Not a diagnosis. Just a place that can feel like yours.

**Live Demo:** [https://solacepersonalised.netlify.app/](https://solacepersonalised.netlify.app/)

The core local-first sanctuary experience works without AI. The public demo currently runs without live AI responses. All local sanctuary features remain available.

**Status:** Solace v1 — deployed. Core sanctuary experience: available. Live AI: not enabled on the public demo yet.

Solace is a privacy-first digital space for reflection and emotional decompression. It is organized around four need-based sanctuaries rather than diagnoses or personality labels. The rooms work on their own. An optional AI Companion can sit with you when a server-side provider is configured.

## The four sanctuaries

**Studio** — “I need to let something out.”  
Expression through drawing and a create → sit with it → keep / release ritual.

**Library** — “I need somewhere quiet.”  
Local dated journaling, a quiet page to read, optional reflection, and breathing.

**Garden** — “I need to slow down.”  
A plant that grows through returning, without streaks or punishment, plus “leave something here.”

**Arcade** — “I need my mind somewhere else.”  
Gentle distraction through memory, word association, and color sorting.

A short set of questions can suggest a room for today. You can ignore the suggestion. Returning visitors are not auto-redirected. Home stays home.

## Solace Companion

Companion is an **optional** AI layer at `/companion`, not the product itself.

- Four conversation modes
- Explicit AI identity: it does not pretend to be a person or a therapist
- Consent before any request leaves the device
- Session-only conversation (gone on refresh)
- **Just Hold This** never sends the text to AI
- Anti-dependency and non-diagnostic boundaries on the server
- Provider calls go through a Netlify Function; the key never ships in the browser

The current public demo does not have an AI provider key configured, so live Companion responses are disabled. Holding a note, choosing a mode, and using every sanctuary still work.

## Privacy-first architecture

- Journal pages stay in this browser’s storage by default
- Garden notes stay local
- Studio gallery stays local
- Quiz suggestion and weather stay local
- Companion conversation is session-only (in-memory for that visit)
- Just Hold This stays on this device for the browser session (`sessionStorage`)
- Sanctuary content is never automatically passed into Companion
- Studio drawings are not automatically analyzed
- AI runs only after explicit consent
- Provider keys are server-side only (`ANTHROPIC_API_KEY`, never `VITE_*`)
- No accounts
- No analytics or social tracking

Browser storage is local to the device and the origin. It is not encrypted.

## Safety

Solace is not therapy, a diagnosis, medical advice, or emergency care.

Companion was designed not to impersonate a therapist or a human relationship. It does not claim to replace people. A support surface in the header points to external crisis directories; Solace does not provide emergency intervention.

## Tech stack

React · TypeScript · Vite · Tailwind CSS · Framer Motion · React Router · Netlify Functions · Vitest

AI provider integration is optional and server-side.

## Engineering highlights

- Local-first persistence, with safe migrations for journal and related storage
- Server-side AI proxy instead of exposing provider keys
- Explicit AI consent
- Structured Companion safety boundaries (identity, crisis handoff, anti-dependency)
- Accessibility: keyboard navigation, focus traps, reduced motion, contrast
- Responsive sanctuary layouts down to 320px
- SPA fallback, security headers, and CSP on Netlify
- Unit tests for scoring, storage/migrations, Garden progress, sanctuary metadata, and Companion parsing

## Testing

26 tests across 5 test files. No automated browser / E2E suite.

```bash
npm test
npm run lint
npm run build
```

## Local setup

```bash
git clone <this-repository>
cd Solacepersonalised
npm install
npm run dev
```

AI is optional. Sanctuaries work without a key.

For live AI locally (`npx netlify dev`) or on Netlify, set **server-side** `ANTHROPIC_API_KEY` only. Do not create `VITE_ANTHROPIC_API_KEY`. Do not commit `.env`.

## Deployment

Live: [https://solacepersonalised.netlify.app/](https://solacepersonalised.netlify.app/)

Netlify:

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

`ANTHROPIC_API_KEY` is an optional Netlify environment variable. The public site currently omits it, so local rooms stay available and live AI replies stay off.

SPA routes (`/quiz`, `/companion`, `/sanctuary/*`) refresh via `/*` → `/index.html`. Security headers and CSP are in `netlify.toml`.

## Screenshots

Stills to add (mock copy only — never real journal or Companion text):

- Landing
- Studio
- Library
- Garden
- Arcade
- Companion

## Roadmap

- Evaluate a sustainable, privacy-appropriate AI provider for the public demo
- Production QA against the live site
- Absolute social-preview URLs once sharing is in use
- Continued accessibility testing

Not planned: accounts, a social layer, gamification, diagnoses, or a fifth sanctuary.

## Disclaimer

Solace is not therapy, diagnosis, treatment, or emergency care. If you need urgent help, use local emergency services or the support links in the app.
