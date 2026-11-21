import { createArticle } from "@/app/actions";
import { requireStaff } from "@/lib/auth";
export const metadata = { title: "नई खबर" };
export default async function NewArticlePage() {
  const { profile } = await requireStaff();
  return <main className="container max-w-3xl py-10"><section className="panel"><h1 className="text-2xl font-bold">नई खबर / शोध लेख</h1><p className="muted">प्रारंभिक ड्राफ्ट बनेगा। प्रकाशन स्वतः नहीं होगा। लेखक: {profile.full_name}</p>
    <form action={createArticle} className="mt-5"><div className="field"><label htmlFor="headline">शीर्षक</label><input id="headline" name="headline" required maxLength={240}/></div><div className="field"><label htmlFor="summary">संक्षिप्त परिचय</label><textarea id="summary" name="summary" rows={3}/></div>
    <h2 className="font-bold mt-5">10-ब्लॉक संपादकीय ढाँचा</h2>
    {["subject","background","facts","claims","evidence","primary_sources","contested","perspectives","fact_check","editorial_comment"].map((b,i)=><div className="field" key={b}><label htmlFor={b}>{i+1}. {b.replaceAll("_"," ")}</label><textarea id={b} name={b} rows={2}/></div>)}
    <button className="btn btn-primary" type="submit">ड्राफ्ट सुरक्षित करें</button></form>
  </section></main>;
}