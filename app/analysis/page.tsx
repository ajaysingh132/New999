import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
export const revalidate=60;
export const metadata={title:"विश्लेषण"};
export default async function AnalysisPage(){
 const supabase=await createClient();
 const {data:articles}=await supabase.from("articles").select("id,slug,headline_hi,summary_hi,published_at,categories(name_hi)").eq("status","published").order("published_at",{ascending:false}).limit(50);
 return <main className="container py-8"><h1 className="text-3xl font-bold">विश्लेषण</h1><p className="mut">दस्तावेज़, प्रमाण, दावे और विभिन्न दृष्टिकोणों पर आधारित प्रकाशित सामग्री।</p><div className="grid-cards mt-5">{articles?.length?articles.map(a=><article className="card" key={a.id}><span className="chip ok">{(a as any).categories?.name_hi||"विश्लेषण"}</span><h2>{a.headline_hi}</h2><p className="mut">{a.summary_hi}</p><p className="mut">{a.published_at?new Date(a.published_at).toLocaleDateString("hi-IN"):""}</p><Link className="text-royal font-bold" href={"/article/"+a.slug}>विश्लेषण पढ़ें →</Link></article>):<div className="card"><h2>अभी कोई विश्लेषण प्रकाशित नहीं</h2><p className="mut">मुख्य संपादक की स्वीकृति के बाद लेख यहाँ दिखेंगे।</p></div>}</div></main>;
}