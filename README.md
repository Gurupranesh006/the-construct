# The Construct

A security-learning platform that visualizes your mastery across web vulnerability classes. The Construct turns PortSwigger-style lab writeups into an interactive, trackable roadmap — so you can see exactly where you stand and what to tackle next.

## Features

- **Interactive roadmap** — per-category progress with expandable topic lists and completion checkboxes.
- **Progress analytics** — Recharts-powered bar chart breaking down mastery per module, plus a global completion percentage.
- **Markdown writeup viewer** — full GFM + syntax-highlighted rendering (`react-markdown` + `remark-gfm` + `rehype-highlight`).
- **Local + cloud sync** — progress persists in `localStorage` and optionally syncs to Supabase (email/password + Google OAuth).
- **Immersive UI** — canvas particle background, custom cursor, and spotlight effects built with a neon-violet glassmorphism theme.
- **21 vulnerability categories** — Access Control, Authentication, SQLi, XSS, SSRF, SSTI, CSRF, XXE, and more (see Content).

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 19 |
| Build tool | Vite 8 |
| Routing | react-router-dom 7 |
| Charts | Recharts 3 |
| Markdown | react-markdown 10 + remark-gfm + rehype-highlight |
| Auth / Sync | Supabase JS 2 |
| Lint | Oxlint 1 |

## Getting Started

```bash
# Clone
git clone https://github.com/Gurupranesh006/the-construct.git
cd the-construct

# Install dependencies
npm install

# Configure Supabase (optional — app runs without it)
cp .env.local.example .env.local   # then fill in:
#   VITE_SUPABASE_URL=...
#   VITE_SUPABASE_ANON_KEY=...

# Run dev server
npm run dev

# Production build
npm run build
npm run preview
```

The app works fully offline with `localStorage` progress even without Supabase configured.

## Content

Writeups live as Markdown under `public/content/<category>/`. Each category maps to a vulnerability class and contains a `README.md` plus optional exploit artifacts and cheatsheets.

**Categories (21):** access-control · authentication · business-logic · clickjacking · cors · csrf · directory-traversal · dom-based · file-upload-vulnerabilities · http-host-header · http-request-smuggling · information-disclosure · oauth-authentication · os-command-injection · server-side-template-injection · sql-injection · ssrf · web-cache-poisoning · websockets · xss · xxe

## Project Structure

```
the-construct/
├── src/
│   ├── App.jsx              # App shell, routing, roadmap, auth, charts
│   ├── supabaseClient.js    # Supabase init (reads VITE_* env)
│   └── assets/              # Static assets
├── public/
│   ├── content/             # Markdown writeups by category
│   └── logo.jpg             # The Construct logo
├── build-data.js            # Ingests ../portswigger-labs → writeupsData.json
├── build-index.js           # Builds content index
└── package.json
```

## Scripts

| Script | Action |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run Oxlint |

## Data Pipeline

`build-data.js` parses the Markdown in `../portswigger-labs` into `src/writeupsData.json`, which drives the roadmap and viewer. Re-run it after adding or editing writeups.

## Notes

- `.env.local` is gitignored — Supabase keys are never committed.
- The anon key is a public client key by design; no service-role secret is used client-side.

---

*Built as a personal mastery tracker for web security learning.*
