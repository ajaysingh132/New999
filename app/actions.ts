"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff, canReview } from "@/lib/auth";

const blockTypes = ["subject","background","facts","claims","evidence","primary_sources","contested","perspectives","fact_check","editorial_comment"] as const;

export async function createArticle(formData: FormData) {
  const { supabase, user, profile } = await requireStaff();
  const headline = String(formData.get("headline")||"").trim();
  if (!headline) throw new Error("शीर्षक आवश्यक है।");
  const slug = headline.toLowerCase().normalize("NFKD").replace(/[^\\p{L}\\p{N}]+/gu,"-").replace(/^-|-$/g,"").slice(0,100) + "-" + crypto.randomUUID().slice(0,8);
  const { data: article, error } = await supabase.from("articles").insert({
    slug, headline_hi: headline, summary_hi: String(formData.get("summary")||"").trim(),
    author_id: user.id, status: "draft", ai_assistance: "none"
  }).select("id").single();
  if (error || !article) throw new Error(error?.message || "लेख सुरक्षित नहीं हुआ।");
  const rows = blockTypes.map((type,sort_order)=>({article_id:article.id,block_type:type,content:{text:String(formData.get(type)||"").trim()},sort_order})).filter(r=>r.content.text);
  if (rows.length) {
    const { error: blockError } = await supabase.from("article_blocks").insert(rows);
    if (blockError) throw new Error(blockError.message);
  }
  revalidatePath("/newsroom");
  redirect("/newsroom");
}

export async function moveArticle(articleId: string, nextStatus: string) {
  const { supabase, profile } = await requireStaff();
  const allowed: Record<string,string[]> = {
    draft:["research"], research:["fact_check"], fact_check:["editorial_review"],
    editorial_review:["pending_chief"], pending_chief:["rejected"]
  };
  if (nextStatus === "published") throw new Error("प्रकाशन के लिए Chief Editor approval workflow आवश्यक है।");
  if (!allowed[nextStatus] && nextStatus !== "rejected") throw new Error("अमान्य workflow transition।");
  if (nextStatus === "rejected" && !canReview(profile.role)) throw new Error("यह निर्णय आपकी भूमिका के लिए अनुमत नहीं है।");
  const { error } = await supabase.from("articles").update({status:nextStatus}).eq("id",articleId);
  if (error) throw new Error(error.message);
  revalidatePath("/newsroom");
}

export async function approveForPublication(articleId: string) {
  const { supabase, user, profile } = await requireStaff();
  if (!["chief_editor","super_admin"].includes(profile.role)) throw new Error("केवल Chief Editor अंतिम स्वीकृति दे सकता है।");
  const { error } = await supabase.from("approvals").insert({article_id:articleId,approver_id:user.id,role:profile.role,decision:"approved",reason:"Chief Editor approval"});
  if (error) throw new Error(error.message);
  const { error: updateError } = await supabase.from("articles").update({status:"published"}).eq("id",articleId);
  if (updateError) throw new Error(updateError.message);
  revalidatePath("/");
  revalidatePath("/newsroom");
}
