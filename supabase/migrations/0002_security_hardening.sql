-- SANDARBH 2.0 hardening: apply after 0001_init.sql on staging first.
insert into roles(name,description) values
('super_admin','System administration'),('chief_editor','Final editorial approval'),('managing_editor','Editorial workflow'),('reporter','Reporting and drafts'),('researcher','Research and documents'),('fact_checker','Claim verification'),('content_editor','Copy editing'),('social_media_manager','Social publishing'),('reader','Read-only')
on conflict(name) do nothing;

-- Fingerprint only editorial content. Workflow status and timestamps must not invalidate approval.
alter table approvals add column if not exists content_hash text;
create or replace function article_content_fingerprint(p_article_id uuid)
returns text language sql stable security invoker set search_path=public,extensions as $$
 select encode(extensions.digest(convert_to(
   jsonb_build_object(
     'article',coalesce((select jsonb_build_object('slug',a.slug,'headline_hi',a.headline_hi,'headline_en',a.headline_en,'summary_hi',a.summary_hi,'category_id',a.category_id,'risk_level',a.risk_level,'ai_assistance',a.ai_assistance,'hero_image_path',a.hero_image_path) from articles a where a.id=p_article_id),'{}'::jsonb),
     'blocks',coalesce((select jsonb_agg(jsonb_build_object('block_type',b.block_type,'content',b.content,'verification',b.verification,'sort_order',b.sort_order) order by b.sort_order,b.id) from article_blocks b where b.article_id=p_article_id),'[]'::jsonb),
     'sources',coalesce((select jsonb_agg(jsonb_build_object('source_id',ar.source_id,'note',ar.note,'title',s.title,'source_type',s.source_type,'url',s.url,'verification',s.verification,'documents',coalesce((select jsonb_agg(rd.extracted_text order by rd.id) from research_documents rd where rd.source_id=s.id),'[]'::jsonb)) order by ar.source_id) from article_sources ar join sources s on s.id=ar.source_id where ar.article_id=p_article_id),'[]'::jsonb)
   )::text,'UTF8'),'sha256'),'hex');
$$;

create or replace function prevent_profile_role_change()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if new.role is distinct from old.role and auth.uid() is not null then
   raise exception 'PROFILE_ROLE_CHANGE_REQUIRES_ADMIN';
 end if;
 new.updated_at=now();
 return new;
end $$;
drop trigger if exists trg_prevent_profile_role_change on profiles;
create trigger trg_prevent_profile_role_change before update on profiles for each row execute function prevent_profile_role_change();

create or replace function protect_approval_record()
returns trigger language plpgsql security definer set search_path=public,extensions as $$
declare actual_role app_role;
begin
 actual_role:=current_app_role();
 if auth.uid() is null or new.approver_id<>auth.uid() then raise exception 'APPROVER_ID_MUST_MATCH_AUTH_USER'; end if;
 if actual_role not in ('chief_editor','super_admin') then raise exception 'CHIEF_EDITOR_APPROVAL_REQUIRED'; end if;
 new.role:=actual_role;
 new.content_hash:=article_content_fingerprint(new.article_id);
 return new;
end $$;
drop trigger if exists trg_protect_approval_record on approvals;
create trigger trg_protect_approval_record before insert on approvals for each row execute function protect_approval_record();

create or replace function enforce_article_workflow()
returns trigger language plpgsql security definer set search_path=public,extensions as $$
declare ok boolean:=false;
begin
 if tg_op='INSERT' then
   if new.status<>'draft' then raise exception 'NEW_ARTICLE_MUST_START_AS_DRAFT'; end if;
   return new;
 end if;
 if new.status is distinct from old.status then
   ok := case old.status
     when 'draft' then new.status='research' and current_app_role() in ('reporter','researcher','managing_editor','super_admin')
     when 'research' then new.status='fact_check' and current_app_role() in ('researcher','fact_checker','managing_editor','super_admin')
     when 'fact_check' then new.status='editorial_review' and current_app_role() in ('fact_checker','content_editor','managing_editor','super_admin')
     when 'editorial_review' then new.status='pending_chief' and current_app_role() in ('managing_editor','content_editor','super_admin')
     when 'pending_chief' then new.status in ('published','rejected') and current_app_role() in ('chief_editor','super_admin')
     when 'rejected' then new.status='draft' and current_app_role() in ('reporter','managing_editor','chief_editor','super_admin')
     else false end;
   if not ok then raise exception 'INVALID_OR_UNAUTHORIZED_ARTICLE_WORKFLOW_TRANSITION'; end if;
 end if;
 if new.status='published' and old.status is distinct from 'published' then
   if not exists(select 1 from approvals ap where ap.article_id=new.id and ap.role in ('chief_editor','super_admin') and ap.decision='approved' and ap.content_hash=article_content_fingerprint(new.id)) then
     raise exception 'PUBLISH_REQUIRES_CURRENT_CHIEF_APPROVAL';
   end if;
   new.published_at=now();
 end if;
 if old.status='published' and (
   new.headline_hi is distinct from old.headline_hi or new.headline_en is distinct from old.headline_en or
   new.summary_hi is distinct from old.summary_hi or new.category_id is distinct from old.category_id or new.slug is distinct from old.slug or new.risk_level is distinct from old.risk_level or new.ai_assistance is distinct from old.ai_assistance or new.hero_image_path is distinct from old.hero_image_path
 ) then raise exception 'PUBLISHED_ARTICLE_REQUIRES_CORRECTION_WORKFLOW'; end if;
 new.updated_at=now();
 return new;
end $$;
drop trigger if exists trg_enforce_article_workflow on articles;
create trigger trg_enforce_article_workflow before insert or update on articles for each row execute function enforce_article_workflow();

-- Approvals and audit events are immutable from ordinary authenticated clients.
drop policy if exists "approvals chief insert" on approvals;
create policy "approvals chief insert" on approvals for insert to authenticated
with check(approver_id=(select auth.uid()) and has_role(array['chief_editor','super_admin']::app_role[]));
drop policy if exists "approvals immutable" on approvals;
create policy "approvals immutable" on approvals for update to authenticated using(false);
drop policy if exists "approvals no delete" on approvals;
create policy "approvals no delete" on approvals for delete to authenticated using(false);
drop policy if exists "audit insert via definer" on audit_logs;
create policy "audit no client insert" on audit_logs for insert to authenticated with check(false);
create policy "audit no client update" on audit_logs for update to authenticated using(false);
create policy "audit no client delete" on audit_logs for delete to authenticated using(false);

-- Profile updates cannot alter role; no client-side function can elevate privileges.
drop policy if exists "profiles update own" on profiles;
create policy "profiles update own name only" on profiles for update to authenticated
using((select auth.uid())=id)
with check((select auth.uid())=id);

-- Restrict SECURITY DEFINER helpers. RLS uses the role helpers only for authenticated sessions.
revoke all on function prevent_profile_role_change() from public,anon,authenticated;
revoke all on function protect_approval_record() from public,anon,authenticated;
revoke all on function enforce_article_workflow() from public,anon,authenticated;
revoke all on function handle_new_user() from public,anon,authenticated;
revoke all on function log_audit(text,text,text,jsonb,jsonb) from public,anon,authenticated;
revoke all on function current_app_role() from public,anon;
revoke all on function is_staff() from public,anon;
revoke all on function has_role(app_role[]) from public,anon;
grant execute on function current_app_role() to authenticated;
grant execute on function is_staff() to authenticated;
grant execute on function has_role(app_role[]) to authenticated;
revoke all on function article_content_fingerprint(uuid) from public,anon;
grant execute on function article_content_fingerprint(uuid) to authenticated;

-- Least-privilege write access: newsroom roles only, not social-only or reader accounts.
drop policy if exists "articles staff insert" on articles;
create policy "articles editorial insert" on articles for insert to authenticated
with check (
  has_role(array['super_admin','chief_editor','managing_editor','reporter','researcher','fact_checker','content_editor']::app_role[])
  and (author_id=(select auth.uid()) or author_id is null)
);
drop policy if exists "articles staff update" on articles;
create policy "articles editorial update" on articles for update to authenticated
using (has_role(array['super_admin','chief_editor','managing_editor','reporter','researcher','fact_checker','content_editor']::app_role[]))
with check (has_role(array['super_admin','chief_editor','managing_editor','reporter','researcher','fact_checker','content_editor']::app_role[]));

drop policy if exists "blocks follow article" on article_blocks;
create policy "blocks read" on article_blocks for select
using (exists(select 1 from articles a where a.id=article_id and (a.status='published' or is_staff())));
create policy "blocks editorial insert" on article_blocks for insert to authenticated
with check (exists(select 1 from articles a where a.id=article_id and a.status<>'published') and has_role(array['super_admin','chief_editor','managing_editor','reporter','researcher','fact_checker','content_editor']::app_role[]));
create policy "blocks editorial update" on article_blocks for update to authenticated
using (exists(select 1 from articles a where a.id=article_id and a.status<>'published') and has_role(array['super_admin','chief_editor','managing_editor','reporter','researcher','fact_checker','content_editor']::app_role[]))
with check (exists(select 1 from articles a where a.id=article_id and a.status<>'published') and has_role(array['super_admin','chief_editor','managing_editor','reporter','researcher','fact_checker','content_editor']::app_role[]));
create policy "blocks editorial delete" on article_blocks for delete to authenticated
using (exists(select 1 from articles a where a.id=article_id and a.status<>'published') and has_role(array['super_admin','chief_editor','managing_editor','reporter','researcher','fact_checker','content_editor']::app_role[]));

-- Explicit Data API grants; RLS remains the row-level authorization boundary.
grant usage on schema public to anon,authenticated;
grant select on roles,permissions,categories,tags,articles,article_blocks,sources,advertisements to anon,authenticated;
grant select,insert,update,delete on profiles,articles,article_blocks,article_tags,sources,research_sessions,research_documents,article_sources,fact_checks,editorial_reviews,approvals,revisions,social_posts,publication_logs,advertisements,analytics,audit_logs to authenticated;
grant usage,select on all sequences in schema public to authenticated;

-- Narrow source/research/fact-check writes to the relevant newsroom roles.
drop policy if exists "sources staff write" on sources;
create policy "sources editorial write" on sources for all to authenticated
using(has_role(array['super_admin','chief_editor','managing_editor','reporter','researcher','fact_checker','content_editor']::app_role[]))
with check(has_role(array['super_admin','chief_editor','managing_editor','reporter','researcher','fact_checker','content_editor']::app_role[]));
drop policy if exists "research sessions staff" on research_sessions;
create policy "research roles manage sessions" on research_sessions for all to authenticated
using(has_role(array['super_admin','chief_editor','managing_editor','reporter','researcher','fact_checker']::app_role[]))
with check(has_role(array['super_admin','chief_editor','managing_editor','reporter','researcher','fact_checker']::app_role[]));
drop policy if exists "research docs staff" on research_documents;
create policy "research roles manage documents" on research_documents for all to authenticated
using(has_role(array['super_admin','chief_editor','managing_editor','reporter','researcher','fact_checker']::app_role[]))
with check(has_role(array['super_admin','chief_editor','managing_editor','reporter','researcher','fact_checker']::app_role[]));
drop policy if exists "fact_checks staff" on fact_checks;
create policy "fact checker writes" on fact_checks for all to authenticated
using(has_role(array['super_admin','chief_editor','managing_editor','fact_checker']::app_role[]))
with check(has_role(array['super_admin','chief_editor','managing_editor','fact_checker']::app_role[]));
drop policy if exists "editorial_reviews staff" on editorial_reviews;
create policy "editorial reviewers write" on editorial_reviews for all to authenticated
using(has_role(array['super_admin','chief_editor','managing_editor','content_editor']::app_role[]))
with check(has_role(array['super_admin','chief_editor','managing_editor','content_editor']::app_role[]));

-- Keep source material referenced by published stories immutable through the client API.
create or replace function prevent_published_source_mutation()
returns trigger language plpgsql security definer set search_path=public as $$
declare sid bigint;
begin
 sid:=case when tg_op='DELETE' then old.id else new.id end;
 if exists(select 1 from article_sources ar join articles a on a.id=ar.article_id where ar.source_id=sid and a.status='published') then
   raise exception 'PUBLISHED_ARTICLE_SOURCE_IS_IMMUTABLE';
 end if;
 if tg_op='DELETE' then return old; else return new; end if;
end $$;
drop trigger if exists trg_prevent_published_source_mutation on sources;
create trigger trg_prevent_published_source_mutation before update or delete on sources for each row execute function prevent_published_source_mutation();
revoke all on function prevent_published_source_mutation() from public,anon,authenticated;

-- Protect source-to-article links after publication.
create or replace function prevent_published_article_source_link_mutation()
returns trigger language plpgsql security definer set search_path=public as $$
declare aid uuid;
begin
 aid:=case when tg_op='DELETE' then old.article_id else new.article_id end;
 if exists(select 1 from articles a where a.id=aid and a.status='published') then
   raise exception 'PUBLISHED_ARTICLE_SOURCE_LINK_IS_IMMUTABLE';
 end if;
 if tg_op='DELETE' then return old; else return new; end if;
end $$;
drop trigger if exists trg_prevent_published_article_source_link_mutation on article_sources;
create trigger trg_prevent_published_article_source_link_mutation before insert or update or delete on article_sources for each row execute function prevent_published_article_source_link_mutation();
revoke all on function prevent_published_article_source_link_mutation() from public,anon,authenticated;

-- Source documents and tag links attached to a published story are immutable.
create or replace function prevent_published_research_document_mutation()
returns trigger language plpgsql security definer set search_path=public as $$
declare sid bigint;
begin
 sid:=case when tg_op='DELETE' then old.source_id else new.source_id end;
 if sid is not null and exists(select 1 from article_sources ar join articles a on a.id=ar.article_id where ar.source_id=sid and a.status='published') then
   raise exception 'PUBLISHED_ARTICLE_RESEARCH_DOCUMENT_IS_IMMUTABLE';
 end if;
 if tg_op='DELETE' then return old; else return new; end if;
end $$;
drop trigger if exists trg_prevent_published_research_document_mutation on research_documents;
create trigger trg_prevent_published_research_document_mutation before insert or update or delete on research_documents for each row execute function prevent_published_research_document_mutation();
revoke all on function prevent_published_research_document_mutation() from public,anon,authenticated;

drop policy if exists "article_tags follow article" on article_tags;
create policy "article tags read" on article_tags for select
using(exists(select 1 from articles a where a.id=article_id and (a.status='published' or is_staff())));
create policy "article tags editorial insert" on article_tags for insert to authenticated
with check(exists(select 1 from articles a where a.id=article_id and a.status<>'published') and has_role(array['super_admin','chief_editor','managing_editor','reporter','content_editor']::app_role[]));
create policy "article tags editorial update" on article_tags for update to authenticated
using(exists(select 1 from articles a where a.id=article_id and a.status<>'published') and has_role(array['super_admin','chief_editor','managing_editor','reporter','content_editor']::app_role[]))
with check(exists(select 1 from articles a where a.id=article_id and a.status<>'published') and has_role(array['super_admin','chief_editor','managing_editor','reporter','content_editor']::app_role[]));
create policy "article tags editorial delete" on article_tags for delete to authenticated
using(exists(select 1 from articles a where a.id=article_id and a.status<>'published') and has_role(array['super_admin','chief_editor','managing_editor','reporter','content_editor']::app_role[]));

drop policy if exists "article_sources staff" on article_sources;
create policy "article sources read" on article_sources for select to authenticated using(is_staff());
create policy "article sources editorial insert" on article_sources for insert to authenticated
with check(has_role(array['super_admin','chief_editor','managing_editor','reporter','researcher','fact_checker','content_editor']::app_role[]));
create policy "article sources editorial update" on article_sources for update to authenticated
using(has_role(array['super_admin','chief_editor','managing_editor','reporter','researcher','fact_checker','content_editor']::app_role[]))
with check(has_role(array['super_admin','chief_editor','managing_editor','reporter','researcher','fact_checker','content_editor']::app_role[]));
create policy "article sources editorial delete" on article_sources for delete to authenticated
using(has_role(array['super_admin','chief_editor','managing_editor','reporter','researcher','fact_checker','content_editor']::app_role[]));

-- Social publishing is also gated: only Chief Editor may approve a social post.
create or replace function enforce_social_post_gate()
returns trigger language plpgsql security definer set search_path=public as $$
declare actual_role app_role;
begin
 actual_role:=current_app_role();
 if tg_op='INSERT' then
   if new.status not in ('draft','ai_generated') then raise exception 'SOCIAL_POST_MUST_START_AS_DRAFT'; end if;
   if actual_role not in ('social_media_manager','managing_editor','chief_editor','super_admin') then raise exception 'SOCIAL_POST_CREATE_FORBIDDEN'; end if;
   new.created_by:=auth.uid();
   return new;
 end if;
 if new.status='approved' and old.status is distinct from 'approved' then
   if actual_role not in ('chief_editor','super_admin') or new.approved_by is distinct from auth.uid() then
     raise exception 'SOCIAL_POST_REQUIRES_CHIEF_APPROVAL';
   end if;
 end if;
 if old.status in ('approved','scheduled','published') and (
   new.native_text is distinct from old.native_text or new.media_paths is distinct from old.media_paths or
   new.link_url is distinct from old.link_url or new.platform is distinct from old.platform
 ) then raise exception 'APPROVED_SOCIAL_POST_CONTENT_IS_IMMUTABLE'; end if;
 if new.status='published' and old.status not in ('approved','scheduled') and auth.uid() is not null then
   raise exception 'SOCIAL_POST_MUST_BE_APPROVED_BEFORE_PUBLISHING';
 end if;
 return new;
end $$;
drop trigger if exists trg_enforce_social_post_gate on social_posts;
create trigger trg_enforce_social_post_gate before insert or update on social_posts for each row execute function enforce_social_post_gate();
revoke all on function enforce_social_post_gate() from public,anon,authenticated;

-- Readers may see only verified source citations attached to published articles.
create policy "article sources public verified" on article_sources for select to anon,authenticated
using(
 exists(select 1 from articles a where a.id=article_id and a.status='published')
 and exists(select 1 from sources s where s.id=source_id and s.verification in ('verified','official_statement'))
);
