"use client";
import {useState} from "react";
const fields=["subject","background","facts","claims","evidence","primary_sources","contested","perspectives","fact_check","editorial_comment"];
export default function AIWriterButton(){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function generate(){
  const topic=(document.getElementById("headline") as HTMLInputElement|null)?.value||"";
  const sources=(document.getElementById("source_material") as HTMLTextAreaElement|null)?.value||"";
  if(topic.trim().length<5){setMessage("पहले विषय/शीर्षक लिखें।");return;}
  setBusy(true);setMessage("AI शोध-सहायक प्रारूप तैयार कर रहा है…");
  try{
   const response=await fetch("/api/ai/draft",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({topic,sources})});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||"AI request failed");
   const draft=result.draft||{};
   const headline=document.getElementById("headline") as HTMLInputElement|null;\n   const aiFlag=document.getElementById("ai_assistance") as HTMLInputElement|null;if(aiFlag)aiFlag.value="generated";
   const summary=document.getElementById("summary") as HTMLTextAreaElement|null;
   if(headline&&draft.headline)headline.value=draft.headline;
   if(summary&&draft.summary)summary.value=draft.summary;
   fields.forEach(key=>{const el=document.getElementById(key) as HTMLTextAreaElement|null;if(el&&draft[key])el.value=String(draft[key]);});
   setMessage("AI प्रारूप फ़ॉर्म में भर दिया गया है। सभी तथ्य और स्रोत मानव द्वारा जाँचें।");
  }catch(e){setMessage(e instanceof Error?e.message:"AI प्रारूप नहीं बन सका।");}
  finally{setBusy(false);}
 }
 return <div className="my-4"><button type="button" className="btn btn-orange" onClick={generate} disabled={busy}>{busy?"तैयार हो रहा है…":"✦ AI से प्रारूप तैयार करें"}</button><p className="muted mt-2" role="status" aria-live="polite">{message}</p></div>;
}