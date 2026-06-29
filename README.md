# briefly

> AI summaries for the articles you save. Paste a URL, get a 3-sentence TL;DR, 5 key points, and tags — powered by Claude.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ecf8e?logo=supabase)
![Claude](https://img.shields.io/badge/Claude-Sonnet%204.6-cc785c)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

**Live demo:** [briefly-ai-six.vercel.app](https://briefly-ai-six.vercel.app) — sign in with any email, the magic link arrives in seconds.

---

## What it does

- **Paste any article URL** → server fetches the page and extracts the readable content with `@mozilla/readability`.
- **Claude Sonnet 4.6** turns the article into a 3-sentence TL;DR, 5 key points, 3–5 tags, and a reading-time estimate. Structured output via tool-use, so the JSON is always valid.
- **Realtime dashboard** — your briefs appear as cards immediately as skeletons, fill in when processing finishes (Supabase Realtime, no polling).
- **Search** by title or `#tag`, **edit tags inline** with optimistic updates, **delete** individual briefs or wipe everything from Danger Zone.
- **Magic-link auth** (no passwords), dark/light theme, owner-only RLS on every row.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Language | TypeScript strict + `noUncheckedIndexedAccess` |
| UI | Tailwind 4 + shadcn/ui + lucide-react |
| Auth + DB | Supabase (Postgres + RLS + Realtime + magic-link auth) |
| AI | `@anthropic-ai/sdk` — Claude Sonnet 4.6 with prompt caching + tool-use |
| Extraction | `@mozilla/readability` + `linkedom` |
| Validation | zod + `@t3-oss/env-nextjs` |
| Deploy | Vercel |

## Run it locally

```bash
npm install
cp .env.example .env.local
# fill in the keys below
npm run dev
```

### Required env vars

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-api03-...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- `ANTHROPIC_API_KEY` — get one at [console.anthropic.com](https://console.anthropic.com). Sonnet 4.6 costs ≈ $0.005 per brief.
- Supabase keys: create a project on [supabase.com](https://supabase.com), then run `supabase/migrations/0001_init.sql` in the SQL Editor to set up tables + RLS.

## Project layout

```
src/
├── app/
│   ├── (auth)/login + auth/callback        — magic-link flow
│   ├── (app)/dashboard + briefs/[id] + settings  — authed routes
│   ├── page.tsx                            — landing
│   └── opengraph-image.tsx                 — dynamic OG card
├── actions/                                — server actions (create / delete / tags)
├── components/                             — UI primitives + feature components
├── lib/
│   ├── supabase/{client,server,proxy}.ts   — SSR-aware Supabase clients
│   ├── anthropic.ts                        — Claude wrapper with tool-use
│   ├── extract.ts                          — Readability + linkedom
│   └── logger.ts                           — structured one-line logger
└── proxy.ts                                — Next 16 middleware (auth refresh + route gate)
```

## Notes

- **Next.js 16** renamed `middleware.ts` to `proxy.ts` — the file lives at `src/proxy.ts`.
- `params` is a `Promise` in Next 16 — every dynamic route awaits it before reading the id.
- Brief creation is **two-phase**: insert a `pending` row, return immediately, then process in `after()` so the form response isn't blocked. The dashboard auto-updates via Supabase Realtime.
- **DOM parsing on serverless** uses `linkedom`, not `jsdom`. `jsdom`'s transitive `@exodus/bytes` is ESM-only and crashes Vercel's Node runtime with `ERR_REQUIRE_ESM`; `linkedom` is a drop-in for Readability and pure-JS.

## License

MIT
