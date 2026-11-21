# संदर्भ — SANDARBH 2.0 AI Digital Newsroom

GBSBFORYOU — खबर, दस्तावेज़, सत्यापन और संपादकीय एक ही न्यूज़रूम में।

## Product direction
- Mobile-first Hindi newsroom; preserve Navy / Royal Blue / Orange visual identity.
- Next.js App Router, Supabase PostgreSQL + Auth.
- 10 editorial blocks: subject, background, facts, claims, evidence, primary_sources, contested, perspectives, fact_check, editorial_comment.
- AI is an assistant only; it cannot publish autonomously.
- Public articles use per-slug routes and metadata.

## Stack
Next.js 14 App Router · React 18 · TypeScript · Tailwind CSS · Supabase SSR/Auth/PostgreSQL.

## Local setup
See [docs/SETUP.md](docs/SETUP.md). Apply SQL migrations in order, copy `.env.example` to `.env.local`, then run `npm install && npm run dev`.

## Security
See [docs/SECURITY.md](docs/SECURITY.md). Publication gates are enforced by PostgreSQL triggers, not client-side button state. Test all migrations on staging before production.

## Current boundary
The development branch contains the Next.js foundation, cookie-based auth, protected newsroom, 10-block draft entry, article review/approval UI, SEO article routes, initial schema and hardening migration. Build and staging verification are still required. AI provider execution, OCR, uploads, automatic social publishing, analytics, and live video integration require credentials and separate tests.

Legacy static HTML/CSS/JS files remain unchanged as the MVP reference. GitHub Pages is static demo hosting only; deploy the Next.js application on Vercel or another Node.js host.
