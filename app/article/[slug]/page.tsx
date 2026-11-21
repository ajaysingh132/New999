import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export const revalidate = 60;
type Props = {params:{slug:string}};
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const supabase=await createClient();
  const {data}=await supabase.from("articles").select("headline_hi,summary_hi").eq("slug",params.slug).eq("status","published").maybeSingle();
  if(!data)return {title:"समाचार नहीं मिला"};
  return {title:data.headline_hi,description:data.summary_hi||undefined,openGraph:{title:data.headline_hi,description:data.summary_hi||undefined,type:"article"}};
}
export default async function ArticlePage({params}:Props){
  const supabase=await createClient();
  const {data:article}=await supabase.from("articles").select("id,headline_hi,summary_hi,published_at,ai_assistance,categories(name_hi)").eq("slug",params.slug).eq("status","published").maybeSingle();
  if(!article)notFound();
  const {data:blocks}=await supabase.from("article_blocks").select("id,block_type,content,verification,sort_order").eq("article_id",article.id).order("sort_order");
  const labels:Record<string,string>={subject:"विषय",background:"पृष्ठभूमि",facts:"तथ्य",claims:"दावे",evidence:"प्रमाण",primary_sources:"प्राथमिक स्रोत",contested:"विवादित बिंदु",perspectives:"विभिन्न दृष्टिकोण",fact_check:"तथ्य-जांच",editorial_comment:"संपादकीय टिप्पणी"};
  return <main className="container"><article className="article-content"><span className="pill">{(article as any).categories?.name_hi||"समाचार"}</span><h1>{article.headline_hi}</h1><p className="muted">प्रकाशित: {article.published_at?new Date(article.published_at).toLocaleDateString("hi-IN"):"—"} · AI सहायता: {article.ai_assistance}</p>{article.summary_hi&&<p className="text-lg muted">{article.summary_hi}</p>}
    {blocks?.map(b=><section className="editorial-block" data-kind={b.block_type} key={b.id}><h2 className="font-bold text-lg">{labels[b.block_type]||b.block_type}</h2><p className="whitespace-pre-wrap">{(b.content as any)?.text||""}</p>{b.verification&&<span className="pill">{b.verification}</span>}</section>)}
  </article></main>;
}