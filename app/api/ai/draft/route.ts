import {NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
export const runtime="nodejs";
const allowed=["super_admin","chief_editor","managing_editor","reporter","researcher","content_editor"];
export async function POST(request:Request){
 try{
  const supabase=await createClient();
  const {data:{user},error}=await supabase.auth.getUser();
  if(error||!user)return NextResponse.json({error:"लॉगिन आवश्यक है।"},{status:401});
  const {data:profile}=await supabase.from("profiles").select("role").eq("id",user.id).single();
  if(!profile||!allowed.includes(profile.role))return NextResponse.json({error:"आपकी भूमिका AI ड्राफ्ट की अनुमति नहीं देती।"},{status:403});
  const declaredSize=Number(request.headers.get("content-length")||0);
  if(declaredSize>40000)return NextResponse.json({error:"अनुरोध बहुत बड़ा है। स्रोत सामग्री सीमित करें।"},{status:413});
  const {topic,sources}=await request.json();
  if(typeof topic!=="string"||topic.trim().length<5||topic.length>500)return NextResponse.json({error:"विषय 5 से 500 अक्षरों के बीच दें।"},{status:400});
  if(typeof sources!=="string"||sources.length>30000)return NextResponse.json({error:"स्रोत सामग्री 30,000 अक्षरों से कम रखें।"},{status:400});
  const base=process.env.AI_API_BASE_URL,key=process.env.AI_API_KEY,model=process.env.AI_MODEL;
  if(!base||!key||!model)return NextResponse.json({error:"AI provider configured नहीं है। Server environment में AI_API_BASE_URL, AI_API_KEY और AI_MODEL जोड़ें।"},{status:503});
  const response=await fetch(base.replace(/\/$/,"")+"/chat/completions",{method:"POST",headers:{"content-type":"application/json",authorization:"Bearer "+key},signal:AbortSignal.timeout(45000),body:JSON.stringify({model,temperature:0.2,messages:[
   {role:"system",content:"You are a cautious newsroom research assistant. Return ONLY valid JSON with keys headline, summary, subject, background, facts, claims, evidence, primary_sources, contested, perspectives, fact_check, editorial_comment. Never invent names, dates, statistics, quotes, documents or citations. Use only supplied source material. If sources are missing, state that verification is pending and leave facts/evidence unresolved. Attribute every claim. Mark all generated material as an unverified draft requiring human fact-check and Chief Editor approval. Write in clear Hindi."},
   {role:"user",content:"विषय: "+topic+"\n\nप्रदान की गई स्रोत सामग्री:\n"+(sources||"कोई स्रोत सामग्री नहीं दी गई।")+"\n\nकेवल उपलब्ध सामग्री पर आधारित संरचित प्रारूप तैयार करें।"}
  ]})});
  if(!response.ok)return NextResponse.json({error:"AI provider error: "+response.status},{status:502});
  const payload=await response.json();
  const raw=payload?.choices?.[0]?.message?.content;
  if(typeof raw!=="string")return NextResponse.json({error:"AI provider ने अपेक्षित उत्तर नहीं दिया।"},{status:502});
  const parsed=JSON.parse(raw.replace(/^\s*```(?:json)?/,"").replace(/```\s*$/,""));
  return NextResponse.json({draft:parsed,ai_assistance:"generated",verification:"unverified"});
 }catch(e){return NextResponse.json({error:e instanceof Error?e.message:"AI draft request failed."},{status:500});}
}