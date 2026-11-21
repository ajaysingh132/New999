# SANDARBH 2.0 Security
- Apply migrations in order on a disposable/staging Supabase project before production.
- Public clients use only the Supabase publishable key. Never expose service_role or secret keys in NEXT_PUBLIC variables.
- Authentication uses cookie sessions through @supabase/ssr.
- New articles must start as drafts. Publication requires Chief Editor approval.
- Approval must match the content fingerprint of the article and its editorial blocks; content changes invalidate approval.
- Role changes are administrative only. Do not allow users to modify their own role.
- Audit logs are append-only for application users.
- Before production, review every SECURITY DEFINER function and all RLS policies with Supabase Advisors; add storage policies, MFA for privileged roles, rate limits, and role-matrix tests.
- Never apply a migration to production without a backup and successful staging test.
\n- `SUPABASE_SERVICE_ROLE_KEY` is used only by the Super Admin invite server action. It must never be prefixed with `NEXT_PUBLIC_`, returned to clients, or committed. Configure Supabase Auth email delivery before using team invitations.\n