# SEO Studio

**An agency-grade SEO + GEO content workbench.** Audit any site, research the topic, and write
content engineered to rank on Google **and** get cited by AI answer engines (ChatGPT, Perplexity,
Gemini, Google AI Overviews).

Built with Next.js and powered by **Google Gemini** (free tier). The intelligence runs entirely on the
Gemini API — so the app genuinely works with a single free key.

> **Live demo:** _add your Vercel URL here after deploying_ → `https://seo-studio.vercel.app`

---

## What it does

SEO Studio is a seven-module workflow — **audit → research → topical authority → distribution →
write → schedule → measure**. This repo ships the flagship module fully working, with the rest
scaffolded on the roadmap.

| Module | Status | What it does |
|---|---|---|
| **Site & Technical Audit** | ✅ **Live** | Paste a URL → Claude fetches the page and returns a scored **SEO / GEO / AEO** audit with a prioritized fix list. |
| Keyword Research | 🔜 Roadmap | Seed keyword → semantic brief (intent, terms, gaps, real questions). |
| Topical Authority | 🔜 Roadmap | Pillar → cluster → support map. |
| Content Distribution | 🔜 Roadmap | Channel mix across article, Reddit, Quora, YouTube, LinkedIn. |
| Content Writing | 🔜 Roadmap | Query → outline → GEO-tuned draft + FAQ schema. |
| Editorial Calendar | 🔜 Roadmap | Full content lifecycle tracker. |
| Reports & Diagnostics | 🔜 Roadmap | Performance + AI-visibility tracking. |

The audit scores against the **5 GEO pillars** (crawlability · structured data · entity ·
corroboration · content quality) plus classic on-page SEO and answer-engine (AEO) readiness.

---

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Google Gemini API** via `fetch` (no SDK dependency, free-tier friendly)
- Plain CSS design system — warm minimal aesthetic, no UI framework
- Deploys to **Vercel** as a single project

---

## Run it locally

**Prerequisites:** Node.js 18.18+ (install from [nodejs.org](https://nodejs.org) or `brew install node`).

```bash
# 1. install dependencies
npm install

# 2. add your Gemini key (free)
cp .env.example .env.local
#   then edit .env.local and set GEMINI_API_KEY=...

# 3. start the dev server
npm run dev
```

Open <http://localhost:3000>. The landing page is at `/`; the app starts at `/audit`.

Get a **free** API key at **[aistudio.google.com/apikey](https://aistudio.google.com/apikey)** → Create API key.
Google Gemini has a generous free tier, so the demo can run at no cost.

---

## Deploy to Vercel (get a shareable link)

1. Push this folder to a **GitHub** repository.
2. Go to [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Under **Environment Variables**, add:
   - `GEMINI_API_KEY` = your free key (kept server-side, never exposed to the browser)
   - `GEMINI_MODEL` = `gemini-2.0-flash` _(optional)_
4. Click **Deploy**. Vercel builds it in the cloud — you don't need Node locally for this.

You'll get a public URL like `https://seo-studio-xyz.vercel.app`. Put it at the top of this README
and in your portfolio. Reviewers just click it — no setup, no key needed on their side.

> **Cost note:** the demo uses *your* key. Costs are small (cents per audit), but for a public link
> Gemini's free tier covers demo traffic; for a public link add a simple rate limit to be safe.
> If audits time out on Vercel's Hobby plan, the model call is the long part — `gemini-2.0-flash` is fast.

---

## Project structure

```
src/
  app/
    layout.tsx              root layout (fonts, metadata)
    globals.css             design system (tokens + components)
    (marketing)/page.tsx    landing page  →  /
    (app)/
      layout.tsx            app shell: two-tier nav + top bar
      audit/page.tsx        Site Audit UI  →  /audit   (live)
      research | authority | distribution | write | calendar | reports
    api/
      audit/route.ts        server route: fetch page + Claude audit
  components/
    Icon.tsx                line-icon set
    ComingSoon.tsx          roadmap placeholder
  lib/
    ai.ts                   Gemini API client (fetch)
    modules.ts              the 7 modules (nav + landing share this)
```

---

## Roadmap

The full product spec (7 modules, data sources, credit model, design system) lives in the parent
folder's `APP_PLAN`. Next builds: Keyword Research and Content Writing (both Claude-only, so they
work with the same single key).
