# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Landing page for **100% Naturizable**, a Mexican plant-based packaging brand. Single-page site built with **Astro 4**, deployed on **Netlify** with hybrid rendering. It features a product showcase, an AI chatbot (Bot855), an admin dashboard with analytics, and PDF report generation via Puppeteer.

## Commands

```bash
npm run dev        # Start Astro dev server (hot reload)
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
```

No test suite is configured.

## Environment variables

All secrets live in `.env` (gitignored). The `.env.example` shows the expected keys:

| Variable | Purpose |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary CDN cloud name |
| `OPENAI_API_KEY` | OpenAI API key for the chatbot |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Auto-created admin credentials (seeded on first login) |
| `TURSO_URL` / `TURSO_AUTH_TOKEN` | Turso (libsql) database connection |
| `CHROME_PATH` | Optional; custom path to Chrome for Puppeteer PDF export |

## Architecture

### Rendering model

`astro.config.mjs` sets `output: 'hybrid'` with the Netlify adapter (`@astrojs/netlify@5`). By default, all pages are pre-rendered at build time. Pages that need server-side logic (`/admin/*`, `/api/*`) set `export const prerender = false` to become SSR (server-rendered at request time via Netlify Functions).

### Directory map

```
src/
├── pages/
│   ├── index.astro           # Main landing page (pre-rendered)
│   ├── admin/
│   │   ├── login.astro       # Admin login (SSR)
│   │   └── index.astro       # Admin dashboard (SSR)
│   └── api/
│       ├── chat.ts           # Bot855 → OpenAI proxy (SSR endpoint)
│       ├── admin/
│       │   ├── login.ts      # Login (POST, SSR)
│       │   ├── logout.ts     # Logout (POST, SSR)
│       │   └── report.ts     # Generates report HTML (POST, SSR)
│       └── export-pdf.ts     # Puppeteer PDF from HTML (POST, SSR)
├── components/               # 20 Astro components (Hero, Nav, Chatbot, ParallaxTierra, etc.)
├── layouts/Layout.astro      # Root layout with SEO, OG tags, JSON-LD, admin gate
├── lib/
│   ├── db.ts                 # Turso client + schema (creates tables on first use)
│   ├── adminAuth.ts          # Password hashing, token-based cookie auth
│   ├── chatStorage.ts        # Saves user↔bot exchanges to Turso
│   └── cloudinary.ts         # URL builder + ASSETS dictionary (all images/video)
├── i18n/
│   ├── ui.ts                 # t() helper, defaultLang='es'
│   ├── es.ts                 # Spanish translations
│   └── en.ts                 # English translations
├── styles/global.css         # Single CSS file (Morganite typeface, design tokens, responsive)
└── scripts/chat.js           # Client-side chatbot logic (IIFE)
```

### Key architectural patterns

**All assets via Cloudinary.** The `src/lib/cloudinary.ts` `ASSETS` object generates every image and video URL at build time. There are no local image files in the repo. The `cld()` helper builds URLs as `https://res.cloudinary.com/<cloud>/<type>/upload/<transforms>/<public_id>`.

**Database: Turso (libsql).** `src/lib/db.ts` lazily creates a singleton client and initializes tables on first call (`admin_users`, `chat_messages`). The `chat_messages` table stores every user↔bot exchange, used by the admin dashboard for analytics.

**Admin auth: stateless cookie tokens.** `src/lib/adminAuth.ts` uses SHA-256 hashing. The cookie token is a hash of the stored password hash, making it invalidatable by changing the password. The admin user is auto-created from env vars on first login attempt.

**Chatbot: OpenAI gpt-4o-mini with system prompt.** `src/pages/api/chat.ts` proxies to OpenAI. The system prompt defines Bot855's personality and product knowledge. When the bot appends `[WA]` to a reply, the client JS shows a WhatsApp button. `src/scripts/chat.js` manages the chat UI as an IIFE with a persistent `sessionId` in localStorage.

**PDF reports: server-side Puppeteer.** The admin dashboard can generate a PDF report for a date range. Flow: admin panel POSTs to `/api/admin/report` → gets HTML string → POSTs to `/api/export-pdf` → Puppeteer renders the HTML → returns PDF blob. Puppeteer uses `puppeteer-core` and auto-detects Chrome (local path on macOS/Linux or `@sparticuz/chromium` on serverless).

**Lenis smooth scroll.** The main page uses Lenis for smooth scrolling. All scroll-based effects (reveal animations, header shrink, progress bar, parallax) are handled via `requestAnimationFrame` throttling.

**i18n: runtime replacement.** Translations are loaded as `window.ui` and the `updateTranslations()` function walks `[data-i18n]` elements at runtime. The server-side `t()` function in `src/i18n/ui.ts` is used in the Layout for `<title>` and `<meta>` tags.

**Mobile considerations.** The site has extensive mobile adaptations: hamburger full-screen overlay, dynamic viewport height (`100dvh`) for iOS, touch-friendly carousels with `scroll-snap-type`, and `env(safe-area-inset-*)` padding in the chatbot fullscreen mode. Content protection (no right-click, no drag, no save/view-source shortcuts) is enforced by the main page script.

### Netlify build

`netlify.toml` runs `npm install --legacy-peer-deps && npm run build`, publishes `dist/`, and uses Node 20. The `_redirects` file (if present) handles SPA routing.
