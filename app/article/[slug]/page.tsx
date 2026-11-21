import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
export const revalidate=60;
type Props={params:{slug:string}};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const supabase=await createClient();
 const {data}=await supabase.from("articles").select("headline_hi,summary_hi").eq("slug",params.slug).eq("status","published").maybeSingle();
 if(!data)return {title:"समाचार नहीं मिला"};
 return {title:data.headline_hi,description:data.summary_hi||undefined,alternates:{canonical:"/article/"+params.slug},openGraph:{title:data.headline_hi,description:data.summary_hi||undefined,type:"article",url:"/article/"+params.slug}};
}
export default async function ArticlePage({params}:Props){
 const supabase=await createClient();
 const {data:article}=await supabase.from("articles").select("id,headline_hi,summary_hi,published_at,ai_assistance,hero_image_path,categories(name_hi)").eq("slug",params.slug).eq("status","published").maybeSingle();
 if(!article)notFound();
 const {data:blocks}=await supabase.from("article_blocks").select("id,block_type,content,verification,sort_order").eq("article_id",article.id).order("sort_order");
 const {data:citations}=await supabase.from("article_sources").select("note,sources(title,source_type,url,publisher,published_on,verification)").eq("article_id",article.id);
 const verifiedCitations=citations??[];
 const labels:Record<string,string>={subject:"विषय",background:"पृष्ठभूमि",facts:"तथ्य",claims:"दावा",evidence:"प्रमाण",primary_sources:"प्राथमिक स्रोत",contested:"विवादित बिंदु",perspectives:"दृष्टिकोण",fact_check:"तथ्य-जांच",editorial_comment:"संपादकीय"};
 const base=process.env.NEXT_PUBLIC_SITE_URL||"https://example.com";
 const schema={"@context":"https://schema.org","@type":"NewsArticle","headline":article.headline_hi,"description":article.summary_hi||undefined,"datePublished":article.published_at||undefined,"mainEntityOfPage":{"@type":"WebPage","@id":base+"/article/"+params.slug},"publisher":{"@type":"Organization","name":"GBSBFORYOU — संदर्भ"}};
 return <main><article className="container article"><span className="chip">{(article as any).categories?.name_hi||"विश्लेषण"}</span> <span className="chip ok">दस्तावेज़ आधारित</span><h1>{article.headline_hi}</h1><p className="mut">मुख्य संपादक डेस्क · {article.published_at?new Date(article.published_at).toLocaleDateString("hi-IN"):"प्रकाशित"} · AI सहायता: {article.ai_assistance}</p><div className="heroimg">मुख्य चित्र / वीडियो</div>{article.summary_hi&&<p>{article.summary_hi}</p>}
  {blocks?.map(b=>{const kind=b.block_type==="facts"||b.block_type==="evidence"||b.block_type==="primary_sources"?"fact":b.block_type==="claims"?"claim":b.block_type==="contested"?"dispute":"";return <section className={"block "+kind} key={b.id}><b>{labels[b.block_type]||b.block_type}</b><p className="whitespace-pre-wrap">{(b.content as any)?.text||""}</p>{b.verification&&<span className="chip">{b.verification}</span>}</section>;})}
  {verifiedCitations.length>0&&<><h2>स्रोत</h2>{verifiedCitations.map((item:any,i:number)=>{const source=item.sources;const url=typeof source?.url==="string"&&/^https?:\/\//i.test(source.url)?source.url:null;return <div className="card mb-3" key={i}><b>{source?.title||"स्रोत दस्तावेज़"}</b><p className="mut">{source?.publisher||""} · {source?.verification||""}</p>{url&&<a className="text-royal font-bold" href={url} target="_blank" rel="noopener noreferrer">मूल स्रोत खोलें ↗</a>}</div>;})}</>}
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}}/>
 </article></main>;
}