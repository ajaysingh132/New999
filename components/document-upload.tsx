"use client";
import {useState} from "react";
import {createClient} from "@/lib/supabase/client";
export default function DocumentUpload(){
 const [path,setPath]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function upload(file?:File){
  if(!file)return;
  if(file.size>25*1024*1024){setMessage("फ़ाइल 25 MB से छोटी होनी चाहिए।");return;}
  setBusy(true);setMessage("दस्तावेज़ सुरक्षित रूप से अपलोड हो रहा है…");
  try{
   const supabase=createClient();
   const {data:{user},error:userError}=await supabase.auth.getUser();
   if(userError||!user)throw new Error("पहले न्यूज़रूम में लॉगिन करें।");
   const safeName=file.name.normalize("NFKD").replace(/[^\w.-]+/g,"_").slice(-100)||"document";
   const objectPath=user.id+"/"+crypto.randomUUID()+"-"+safeName;
   const {error}=await supabase.storage.from("newsroom-documents").upload(objectPath,file,{upsert:false,contentType:file.type||"application/octet-stream"});
   if(error)throw error;
   setPath(objectPath);setMessage("अपलोड पूरा: "+file.name);
  }catch(e){setMessage(e instanceof Error?e.message:"फ़ाइल अपलोड विफल।");}
  finally{setBusy(false);}
 }
 return <div className="field"><label htmlFor="source_file">स्रोत दस्तावेज़ (PDF, DOCX, चित्र, TXT · अधिकतम 25 MB)</label><input id="source_file" type="file" accept=".pdf,.docx,.png,.jpg,.jpeg,.webp,.txt,.md" disabled={busy} onChange={e=>upload(e.target.files?.[0])}/><input type="hidden" id="source_file_path" name="source_file_path" value={path}/><p className="muted" role="status" aria-live="polite">{message}</p></div>;
}