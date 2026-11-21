import Link from "next/link";
import {signOut} from "@/app/actions";
import { requireStaff } from "@/lib/auth";
export const metadata = { title: "न्यूज़रूम डैशबोर्ड" };
export default async function NewsroomPage() {
  const { supabase, profile } = await requireStaff();
  const { data: articles } = await supabase.from("articles").select("id,slug,headline_hi,status,updated_at").order("updated_at",{ascending:false}).limit(30);
  const counts = (articles || []).reduce((acc:any,a:any)=>(acc[a.status]=(acc[a.status]||0)+1,acc),{});
  return <main className="container dashboard"><aside className="panel side-nav"><strong>संपादकीय डेस्क</strong><span className="pill">{profile.role}</span><Link href="/newsroom">डैशबोर्ड</Link><Link href="/newsroom/new">नई खबर</Link><Link href="/social">सोशल कैलेंडर</Link></aside><section>
    <div className="flex flex-wrap justify-between items-center gap-3 mb-5"><div><h1 className="text-3xl font-bold">नमस्कार, {profile.full_name}</h1><p className="muted">आपकी भूमिका के अनुसार कार्य उपलब्ध हैं।</p></div><div className="flex gap-2"><Link className="btn btn-orange" href="/newsroom/new">+ नई खबर</Link><form action={signOut}><button className="btn btn-light" type="submit">लॉगआउट</button></form></div></div>
    <div className="stat-grid mb-5">{["draft","research","fact_check","pending_chief"].map(s=><div className="panel stat" key={s}><strong>{counts[s]||0}</strong><span className="muted">{s.replaceAll("_"," ")}</span></div>)}</div>
    <div className="panel"><h2 className="text-xl font-bold mb-3">हाल के लेख</h2>{articles?.length ? <div className="divide-y">{articles.map(a=><div className="py-3 flex flex-wrap justify-between gap-2" key={a.id}><div><b>{a.headline_hi}</b><div className="muted">{a.status} · {new Date(a.updated_at).toLocaleString("hi-IN")}</div></div><Link className="text-royal font-bold" href={"/newsroom/"+a.id}>खोलें →</Link></div>)}</div>:<p className="muted">अभी कोई लेख नहीं है। पहली खबर बनाएँ।</p>}</div>
  </section></main>;
}