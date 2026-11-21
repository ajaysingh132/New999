import type {MetadataRoute} from "next";
import {createClient} from "@/lib/supabase/server";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const base=process.env.NEXT_PUBLIC_SITE_URL||"https://example.com";
 try{const supabase=await createClient();const {data}=await supabase.from("articles").select("slug,updated_at").eq("status","published").limit(5000);return [{url:base,lastModified:new Date()},...(data||[]).map(a=>({url:base+"/article/"+a.slug,lastModified:new Date(a.updated_at)}))];}
 catch{return [{url:base,lastModified:new Date()}];}
}