import Link from "next/link";
import {notFound} from "next/navigation";
import {approveForPublication,moveArticle} from "@/app/actions";
import {requireStaff} from "@/lib/auth";
type Props={params:{id:string}};
export default async function ArticleDeskPage({params}:Props){
 const {supabase,profile}=await requireStaff();
 const {data:article}=await supabase.from("articles").select("id,headline_hi,summary_hi,status,author_id,updated_at").eq("id",params.id).maybeSingle();
 if(!article)notFound();
 const {data:blocks}=await supabase.from("article_blocks").select("block_type,content,verification,sort_order").eq("article_id",article.id).order("sort_order");
 const {data:citations}=await supabase.from("article_sources").select("note,sources(title,url,verification,storage_path)").eq("article_id",article.id);
 const sourceItems=await Promise.all((citations||[]).map(async(item:any)=>{const source=item.sources;const path=source?.storage_path;if(!path)return {...item,signedUrl:null};const {data}=await supabase.storage.from("newsroom-documents").createSignedUrl(path,300);return {...item,signedUrl:data?.signedUrl||null};}));
 const labels:Record<string,string>={subject:"विषय",background:"पृष्ठभूमि",facts:"तथ्य",claims:"दावे",evidence:"प्रमाण",primary_sources:"प्राथमिक स्रोत",contested:"विवादित बिंदु",perspectives:"दृष्टिकोण",fact_check:"तथ्य-जांच",editorial_comment:"संपादकीय टिप्पणी"};
 const next:Record<string,string>={draft:"research",research:"fact_check",fact_check:"editorial_review",editorial_review:"pending_chief",rejected:"draft"};
 const target=next[article.status];
 const stageRoles:Record<string,string[]>={draft:["reporter","researcher","managing_editor","super_admin"],research:["researcher","fact_checker","managing_editor","super_admin"],fact_check:["fact_checker","content_editor","managing_editor","super_admin"],editorial_review:["managing_editor","content_editor","super_admin"],rejected:["reporter","managing_editor","chief_editor","super_admin"]};
 const canAdvance=Boolean(target&&(stageRoles[article.status]||[]).includes(profile.role));
 return <main className="container max-w-4xl py-10"><Link href="/newsroom" className="text-royal font-bold">← डैशबोर्ड</Link><section className="panel mt-4"><div className="flex flex-wrap justify-between gap-3"><span className="pill">{article.status}</span><span className="muted">अंतिम अपडेट: {new Date(article.updated_at).toLocaleString("hi-IN")}</span></div><h1 className="text-3xl font-bold mt-4">{article.headline_hi}</h1><p className="muted">{article.summary_hi}</p>
 <div className="mt-6">{blocks?.map(b=><section className="editorial-block" key={b.block_type}><h2 className="font-bold">{labels[b.block_type]||b.block_type}</h2><p className="whitespace-pre-wrap">{(b.content as any)?.text||""}</p><span className="pill">{b.verification||"unverified"}</span></section>)}</div>
 {sourceItems.length>0&&<section className="panel mt-5"><h2 className="font-bold text-lg">शोध स्रोत एवं दस्तावेज़</h2>{sourceItems.map((item:any,i:number)=><div className="py-2 border-b" key={i}><b>{item.sources?.title||"स्रोत सामग्री"}</b><p className="muted">{item.sources?.verification||"unverified"} · {item.note}</p>{item.signedUrl&&<a className="text-royal font-bold" href={item.signedUrl} target="_blank" rel="noopener noreferrer">दस्तावेज़ देखें (5 मिनट लिंक) ↗</a>}</div>)}</section>}
 <div className="border-t pt-5 mt-5 flex flex-wrap gap-3">
 {canAdvance&&target&&<form action={async()=>{"use server";await moveArticle(article.id,target);}}><button className="btn btn-primary" type="submit">अगले चरण में भेजें: {target}</button></form>}
 {article.status==="pending_chief"&&["chief_editor","super_admin"].includes(profile.role)&&<form action={async()=>{"use server";await approveForPublication(article.id);}}><button className="btn btn-orange" type="submit">अंतिम स्वीकृति देकर प्रकाशित करें</button></form>}
 {article.status==="pending_chief"&&["chief_editor","super_admin"].includes(profile.role)&&<form action={async()=>{"use server";await moveArticle(article.id,"rejected");}}><button className="btn btn-light" type="submit">अस्वीकृत करें</button></form>}
 </div><p className="muted mt-4">प्रकाशन केवल Chief Editor / Super Admin की अंतिम स्वीकृति से संभव है।</p></section></main>;
}