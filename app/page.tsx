import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;
export default async function HomePage() {
  let articles: any[] = [];
  let configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if (configured) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.from("articles").select("id,slug,headline_hi,summary_hi,published_at,categories(name_hi)").eq("status","published").order("published_at",{ascending:false}).limit(12);
      articles = data || [];
    } catch { articles = []; }
  }
  return <main className="container">
    <section className="hero"><span className="pill">GBSBFORYOU · DIGITAL NEWSROOM 2.0</span><h1>खबर, दस्तावेज़, सत्यापन और संपादकीय — एक ही न्यूज़रूम में।</h1><p>समाचार को केवल सूचना नहीं, स्रोतों, प्रमाणों, विविध दृष्टिकोणों और जवाबदेह संपादन के साथ पाठकों तक पहुँचाना।</p><div className="flex flex-wrap gap-3 mt-5"><Link className="btn btn-orange" href="/newsroom">न्यूज़रूम खोलें</Link><Link className="btn btn-light" href="/login">टीम लॉगिन</Link></div></section>
    {!configured && <div className="notice mb-5">Supabase अभी कॉन्फ़िगर नहीं है। .env.local में Project URL और Publishable Key जोड़ने के बाद प्रकाशित समाचार यहाँ दिखाई देंगे।</div>}
    <div className="grid-main"><section><h2 className="text-2xl font-bold mb-4">प्रकाशित समाचार</h2>{articles.length ? <div className="grid-cards">{articles.map(a=><article className="panel" key={a.id}><span className="pill">{a.categories?.name_hi || "समाचार"}</span><h3 className="text-lg font-bold mt-3">{a.headline_hi}</h3><p className="muted">{a.summary_hi}</p><Link className="text-royal font-bold" href={"/article/"+a.slug}>पूरा पढ़ें →</Link></article>)}</div> : <div className="panel"><h3 className="font-bold">आपका स्रोत-आधारित न्यूज़रूम तैयार हो रहा है</h3><p className="muted">पहली खबर प्रकाशित होने पर वह यहाँ स्वतः दिखाई देगी।</p></div>}</section>
      <aside className="panel"><h2 className="text-xl font-bold">संपादकीय सिद्धांत</h2><ul className="list-disc pl-5 muted mt-3 space-y-2"><li>तथ्य और दावे अलग-अलग</li><li>प्राथमिक स्रोतों को प्राथमिकता</li><li>विवादित बिंदुओं का स्पष्ट उल्लेख</li><li>मुख्य संपादक की अंतिम स्वीकृति</li><li>AI सहायता का पारदर्शी उल्लेख</li></ul></aside></div>
  </main>;
}