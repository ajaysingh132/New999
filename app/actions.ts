"use server";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireStaff,canReview} from "@/lib/auth";

const blockTypes=["subject","background","facts","claims","evidence","primary_sources","contested","perspectives","fact_check","editorial_comment"] as const;

export async function createArticle(formData:FormData){
 const {supabase,user}=await requireStaff();
 const headline=String(formData.get("headline")||"").trim();
 if(!headline)throw new Error("शीर्षक आवश्यक है।");
 const base=headline.normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu,"-").replace(/^-|-$/g,"").slice(0,90)||"article";
 const slug=base+"-"+crypto.randomUUID().slice(0,8);
 const aiAssistance=String(formData.get("ai_assistance")||"none");
 const {data:article,error}=await supabase.from("articles").insert({slug,headline_hi:headline,summary_hi:String(formData.get("summary")||"").trim(),author_id:user.id,status:"draft",ai_assistance:aiAssistance}).select("id").single();
 if(error||!article)throw new Error(error?.message||"लेख सुरक्षित नहीं हुआ।");
 const rows=blockTypes.map((type,sort_order)=>({article_id:article.id,block_type:type,content:{text:String(formData.get(type)||"").trim()},sort_order})).filter(r=>r.content.text.length>0);
 if(rows.length){const {error:blockError}=await supabase.from("article_blocks").insert(rows);if(blockError)throw new Error(blockError.message);}
 const sourceMaterial=String(formData.get("source_material")||"").trim();
 const sourceUrl=String(formData.get("source_url")||"").trim();
 const sourceFilePath=String(formData.get("source_file_path")||"").trim();
 if(sourceUrl){try{const parsed=new URL(sourceUrl);if(!["http:","https:"].includes(parsed.protocol))throw new Error();}catch{throw new Error("स्रोत URL मान्य http/https लिंक होना चाहिए।");}}
 if(sourceFilePath&&!sourceFilePath.startsWith(user.id+"/"))throw new Error("दस्तावेज़ पथ आपके लॉगिन खाते से मेल नहीं खाता।");
 if(sourceMaterial||sourceFilePath||sourceUrl){
  const {data:source,error:sourceError}=await supabase.from("sources").insert({title:"Reporter source material — "+headline.slice(0,100),source_type:"other",url:sourceUrl||null,publisher:"Submitted in newsroom editor",verification:"unverified",uploaded_by:user.id,storage_path:sourceFilePath||null}).select("id").single();
  if(sourceError||!source)throw new Error(sourceError?.message||"स्रोत रिकॉर्ड सुरक्षित नहीं हुआ।");
  const {data:session,error:sessionError}=await supabase.from("research_sessions").insert({topic:headline,created_by:user.id,status:"completed",result:{source_material_received:Boolean(sourceMaterial),file_uploaded:Boolean(sourceFilePath)}}).select("id").single();
  if(sessionError||!session)throw new Error(sessionError?.message||"शोध सत्र सुरक्षित नहीं हुआ।");
  const {error:docError}=await supabase.from("research_documents").insert({session_id:session.id,source_id:source.id,file_path:sourceFilePath||sourceUrl||"inline://article-source-material",extracted_text:sourceMaterial||null,ocr_done:false});
  if(docError)throw new Error(docError.message);
  const {error:linkError}=await supabase.from("article_sources").insert({article_id:article.id,source_id:source.id,note:"Reporter-submitted source; not independently verified"});
  if(linkError)throw new Error(linkError.message);
 }
 revalidatePath("/newsroom");redirect("/newsroom/"+article.id);
}

export async function moveArticle(articleId:string,nextStatus:string){
 const {supabase,profile}=await requireStaff();
 const {data:article,error:readError}=await supabase.from("articles").select("status").eq("id",articleId).single();
 if(readError||!article)throw new Error("लेख नहीं मिला।");
 const transitions:Record<string,string[]>={draft:["research"],research:["fact_check"],fact_check:["editorial_review"],editorial_review:["pending_chief"],pending_chief:["rejected"],rejected:["draft"]};
 if(!(transitions[article.status]||[]).includes(nextStatus))throw new Error("अमान्य workflow transition।");
 if(nextStatus==="rejected"&&!canReview(profile.role))throw new Error("आपकी भूमिका इस निर्णय की अनुमति नहीं देती।");
 const {error}=await supabase.from("articles").update({status:nextStatus}).eq("id",articleId);
 if(error)throw new Error(error.message);
 revalidatePath("/newsroom");revalidatePath("/newsroom/"+articleId);
}

export async function approveForPublication(articleId:string){
 const {supabase,user,profile}=await requireStaff();
 if(!["chief_editor","super_admin"].includes(profile.role))throw new Error("केवल Chief Editor अंतिम स्वीकृति दे सकता है।");
 const {data:article,error:readError}=await supabase.from("articles").select("status").eq("id",articleId).single();
 if(readError||article?.status!=="pending_chief")throw new Error("केवल अंतिम समीक्षा कतार का लेख प्रकाशित किया जा सकता है।");
 const {error}=await supabase.from("approvals").insert({article_id:articleId,approver_id:user.id,role:profile.role,decision:"approved",reason:"Chief Editor approval"});
 if(error)throw new Error(error.message);
 const {error:updateError}=await supabase.from("articles").update({status:"published"}).eq("id",articleId);
 if(updateError)throw new Error(updateError.message);
 revalidatePath("/");revalidatePath("/newsroom");revalidatePath("/newsroom/"+articleId);
}

export async function createSocialPost(formData:FormData){
 const {supabase,user,profile}=await requireStaff();
 if(!["social_media_manager","managing_editor","chief_editor","super_admin"].includes(profile.role))throw new Error("आपकी भूमिका सोशल ड्राफ्ट बनाने की अनुमति नहीं देती।");
 const platform=String(formData.get("platform")||"");
 const allowed=["youtube","facebook","instagram","x","threads","telegram","whatsapp","linkedin"];
 const nativeText=String(formData.get("native_text")||"").trim();
 if(!allowed.includes(platform)||nativeText.length<2||nativeText.length>5000)throw new Error("सोशल प्लेटफॉर्म और 2–5000 अक्षरों का कंटेंट आवश्यक है।");
 const articleId=String(formData.get("article_id")||"").trim()||null;
 const {error}=await supabase.from("social_posts").insert({platform,content_type:String(formData.get("content_type")||"post"),native_text:nativeText,article_id:articleId,created_by:user.id,status:"draft"});
 if(error)throw new Error(error.message);
 revalidatePath("/social");
}

export async function approveSocialPost(postId:number){
 const {supabase,user,profile}=await requireStaff();
 if(!["chief_editor","super_admin"].includes(profile.role))throw new Error("केवल Chief Editor सोशल पोस्ट को स्वीकृत कर सकता है।");
 const {error}=await supabase.from("social_posts").update({status:"approved",approved_by:user.id}).eq("id",postId);
 if(error)throw new Error(error.message);
 revalidatePath("/social");
}

export async function signOut(){
 const {supabase}=await requireStaff();
 await supabase.auth.signOut();
 redirect("/login");
}
