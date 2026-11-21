import {createArticle} from "@/app/actions";
import {requireStaff} from "@/lib/auth";
import AIWriterButton from "@/components/ai-writer-button";
export const metadata={title:"नई खबर"};
const blocks=["subject","background","facts","claims","evidence","primary_sources","contested","perspectives","fact_check","editorial_comment"];
export default async function NewArticlePage(){
 const {profile}=await requireStaff();
 return <main className="container max-w-3xl py-10"><section className="panel"><h1 className="text-2xl font-bold">नई खबर / शोध लेख</h1><p className="muted">लेखक: {profile.full_name} · AI प्रारूप हमेशा मानव समीक्षा के अधीन रहेगा।</p>
 <form action={createArticle} className="mt-5"><input type="hidden" id="ai_assistance" name="ai_assistance" value="none"/><div className="field"><label htmlFor="headline">विषय / शीर्षक</label><input id="headline" name="headline" required maxLength={240}/></div><div className="field"><label htmlFor="source_material">मूल स्रोत सामग्री / दस्तावेज़ से उद्धरण</label><textarea id="source_material" name="source_material" rows={6} placeholder="यहाँ उपलब्ध दस्तावेज़, सरकारी आदेश, रिपोर्ट या सत्यापित सामग्री दें। AI केवल इसी सामग्री पर आधारित प्रारूप बनाएगा।"/></div><AIWriterButton/><div className="field"><label htmlFor="summary">संक्षिप्त परिचय</label><textarea id="summary" name="summary" rows={3}/></div><h2 className="font-bold mt-5">10-ब्लॉक संपादकीय ढाँचा</h2>{blocks.map((b,i)=><div className="field" key={b}><label htmlFor={b}>{i+1}. {b.replaceAll("_"," ")}</label><textarea id={b} name={b} rows={3}/></div>)}<button className="btn btn-primary" type="submit">ड्राफ्ट सुरक्षित करें</button></form>
 </section></main>;
}