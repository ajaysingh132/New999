import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AppRole = "super_admin"|"chief_editor"|"managing_editor"|"reporter"|"researcher"|"fact_checker"|"content_editor"|"social_media_manager"|"reader";

export async function requireUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("id,full_name,role").eq("id", user.id).single();
  if (!profile) redirect("/login");
  return { supabase, user, profile: profile as {id:string;full_name:string;role:AppRole} };
}

export async function requireStaff() {
  const ctx = await requireUser();
  if (ctx.profile.role === "reader") redirect("/");
  return ctx;
}

export function canReview(role: AppRole) {
  return ["super_admin","chief_editor","managing_editor","content_editor"].includes(role);
}
