import {redirect} from "next/navigation";
import {requireStaff} from "@/lib/auth";
import {inviteTeamMember} from "@/app/actions";
export const metadata={title:"टीम प्रबंधन"};
const roles=["super_admin","chief_editor","managing_editor","reporter","researcher","fact_checker","content_editor","social_media_manager","reader"];
export default async function TeamAdminPage({searchParams}:{searchParams?:{invited?:string}}){
 const {supabase,profile}=await requireStaff();
 if(profile.role!=="super_admin")redirect("/newsroom");
 const {data:members}=await supabase.from("profiles").select("id,full_name,role,created_at").order("created_at",{ascending:false}).limit(100);
 return <main className="container max-w-4xl py-10"><h1 className="text-3xl font-bold">न्यूज़रूम टीम प्रबंधन</h1><p className="muted">केवल Super Admin टीम आमंत्रित और भूमिका निर्धारित कर सकता है।</p>{searchParams?.invited&&<p className="notice mt-4">आमंत्रण भेज दिया गया है। सदस्य को ईमेल लिंक से प्रवेश पूरा करना होगा।</p>}
 <section className="panel mt-6"><h2 className="text-xl font-bold">नया सदस्य आमंत्रित करें</h2><form action={inviteTeamMember} className="grid md:grid-cols-2 gap-3 mt-3"><div className="field"><label htmlFor="full_name">पूरा नाम</label><input id="full_name" name="full_name" required maxLength={120}/></div><div className="field"><label htmlFor="email">ईमेल</label><input id="email" name="email" type="email" required/></div><div className="field"><label htmlFor="role">भूमिका</label><select id="role" name="role" defaultValue="reporter">{roles.map(role=><option key={role} value={role}>{role}</option>)}</select></div><div className="md:col-span-2"><button className="btn btn-primary" type="submit">ईमेल आमंत्रण भेजें</button></div></form></section>
 <section className="panel mt-6"><h2 className="text-xl font-bold mb-3">टीम सदस्य</h2>{members?.map(m=><div className="py-3 border-b flex flex-wrap justify-between gap-2" key={m.id}><div><b>{m.full_name}</b><p className="muted">{m.id}</p></div><span className="pill">{m.role}</span></div>)}</section>
 </main>;
}