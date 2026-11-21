import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
export const revalidate=60;
export default async function HomePage(){
 let articles:any[]=[];
 const configured=Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL&&process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
 if(configured){try{const supabase=await createClient();const {data}=await supabase.from("articles").select("id,slug,headline_hi,summary_hi,published_at,categories(name_hi)").eq("status","published").order("published_at",{ascending:false}).limit(3);articles=data||[];}catch{articles=[];}}
 return <main><div className="container">
  <section className="hero"><span className="chip">डिजिटल न्यूज़ प्लेटफॉर्म</span><h1>खबर, दस्तावेज़, सत्यापन और संपादकीय — एक ही न्यूज़रूम में।</h1><p>AI सहायता से समाचार ड्राफ्ट, मुख्य संपादक की समीक्षा, प्रकाशन workflow, Adsterra विज्ञापन और Live प्रसारण के लिए तैयार संरचना।</p><div className="row"><Link className="btn orange" href="/newsroom">न्यूज़ पोस्ट करें</Link><Link className="btn line" href="/analysis">विश्लेषण देखें</Link></div></section>
  {!configured&&<p className="notice mb-4">Supabase अभी कॉन्फ़िगर नहीं है। Project URL और Publishable Key जोड़ने के बाद वास्तविक प्रकाशित समाचार यहाँ दिखाई देंगे।</p>}
  <div className="legacy-grid"><section><h2>आज की प्रमुख खबरें</h2><div className="grid3">
   {articles.length?articles.map((a)=><Link className="card" href={"/article/"+a.slug} key={a.id}><span className="chip ok">{a.categories?.name_hi||"समाचार"}</span><h3>{a.headline_hi}</h3><p className="mut">{a.summary_hi||"दस्तावेज़ और संपादकीय विश्लेषण पढ़ें।"}</p><span className="text-royal font-bold">पूरा पढ़ें →</span></Link>):<div className="card"><span className="chip">न्यूज़रूम</span><h3>अभी कोई प्रकाशित समाचार नहीं</h3><p className="mut">स्वीकृत और प्रकाशित खबरें यहाँ अपने आप दिखाई देंगी।</p></div>}
  </div><h2>दस्तावेज़ एवं तथ्य</h2><div className="card"><h3>स्रोत-पहले संपादन नीति</h3><p>हर समाचार में तथ्य, दावा, प्रमाण, विवादित बिंदु और संपादकीय टिप्पणी अलग रखी जाएगी। प्राथमिक स्रोतों और प्रत्यक्ष बयानों को स्पष्ट संदर्भ के साथ रखा जाएगा।</p></div></section>
  <aside><h2>विज्ञापन</h2><div className="adbox">Adsterra Ad Unit<br/>यहाँ आपका approved Adsterra code लगेगा।</div><h2>LIVE</h2><div className="video">▶ LIVE PLAYER</div><p className="mut">YouTube Live stream URL/config यहाँ जोड़ा जाएगा।</p></aside></div>
 </div></main>;
}