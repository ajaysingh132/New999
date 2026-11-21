-- SANDARBH 2.0 security follow-up.
-- article_revision_trigger is attached to articles as a trigger and must not be
-- callable directly through the PostgREST RPC surface by API roles.
revoke all on function public.article_revision_trigger() from public, anon, authenticated;
