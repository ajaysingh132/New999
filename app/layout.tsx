import type {Metadata} from "next";
import Link from "next/link";
import "./globals.css";
const siteUrl=process.env.NEXT_PUBLIC_SITE_URL||"https://ajaysingh132.github.io/New999";
export const metadata:Metadata={
 metadataBase:new URL(siteUrl),
 title:{default:"संदर्भ — डिजिटल न्यूज़रूम",template:"%s — संदर्भ"},
 description:"खबर, दस्तावेज़, सत्यापन और संपादकीय — एक ही न्यूज़रूम में।",
 applicationName:"संदर्भ",
 openGraph:{type:"website",locale:"hi_IN",siteName:"संदर्भ",title:"संदर्भ — डिजिटल न्यूज़रूम",description:"स्रोत-पहले हिंदी डिजिटल न्यूज़रूम"}
};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="hi"><body>
  <header className="topbar"><div className="container topbar-inner">
   <Link className="brand" href="/">संदर्भ<span>.</span><small>आज की खबर → कल का ज्ञान</small></Link>
   <nav className="navlinks" aria-label="मुख्य नेविगेशन"><Link href="/">होम</Link><Link href="/analysis">विश्लेषण</Link><Link href="/newsroom">AI न्यूज़रूम</Link><Link href="/social">सोशल</Link></nav>
   <span className="spacer"/><span className="chip live">● LIVE</span>
  </div></header>
  {children}
  <footer className="footer"><div className="container"><strong>संदर्भ.</strong><p>संपादकीय नीति · तथ्य-जांच · सुधार · AI उपयोग नीति · विज्ञापन · संपर्क</p><p className="muted">संदर्भ. — तथ्य पहले, निष्कर्ष स्पष्ट · GBSBFORYOU</p></div></footer>
  <nav className="bottom" aria-label="मोबाइल नेविगेशन"><Link href="/">होम</Link><Link href="/newsroom">न्यूज़</Link><Link href="/social">सोशल</Link><Link href="/analysis">विश्लेषण</Link></nav>
 </body></html>;
}