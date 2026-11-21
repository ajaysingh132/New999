# Local setup
1. Create a Supabase project.
2. Run SQL Editor scripts in this order: `supabase/migrations/0001_init.sql`, `supabase/migrations/0002_security_hardening.sql`, then `supabase/seed.sql`.
3. Copy `.env.example` to `.env.local`; enter the Supabase Project URL and Publishable Key.
4. Run `npm install`, `npm run dev`; open http://localhost:3000.
5. In Supabase Authentication, invite the first admin. Then, as project owner, promote the matching profile in SQL Editor:
```sql
update public.profiles set role='super_admin'
where id=(select id from auth.users where email='YOUR_ADMIN_EMAIL');
```
6. Sign in at `/login`. Public sign-up is intentionally disabled.
## Deploy
Connect this branch to Vercel as a Preview deployment first. Set the environment variables in Vercel. Promote only after the build, database, login, RLS, and publication-gate tests pass.
## Not yet active
AI provider execution, OCR, document uploads, social platform APIs, ad delivery, analytics reporting and live video embeds require credentials and separate integration tests. No secret keys belong in Git.

## Private research documents
The second migration creates a private `newsroom-documents` Storage bucket (25 MB maximum). The article editor can upload PDF, DOCX, image, TXT, and Markdown files. Uploaded documents remain unverified; OCR and text extraction from uploaded binaries are not enabled yet. Pasted source text is stored as a research document and can be used by the AI drafting endpoint.
