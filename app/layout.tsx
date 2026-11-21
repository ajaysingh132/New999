import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ajaysingh132.github.io/New999";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "संदर्भ — AI Digital Newsroom", template: "%s | संदर्भ" },
  description: "खबर, दस्तावेज़, सत्यापन और संपादकीय — एक ही न्यूज़रूम में।",
  applicationName: "SANDARBH 2.0",
  openGraph: { type: "website", locale: "hi_IN", siteName: "संदर्भ", title: "संदर्भ — AI Digital Newsroom", description: "स्रोत-आधारित हिंदी डिजिटल न्यूज़रूम" }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="hi"><body>
    <header className="topbar"><div className="container topbar-inner">
      <Link className="brand" href="/">संदर्भ<span>.</span><small>आज की खबर → कल का ज्ञान</small></Link>
      <nav className="navlinks" aria-label="मुख्य नेविगेशन">
        <Link href="/">होम</Link><Link href="/newsroom">न्यूज़रूम</Link><Link href="/social">सोशल</Link><Link href="/login">लॉगिन</Link>
      </nav>
    </div></header>
    {children}
    <footer className="footer"><div className="container"><strong>संदर्भ. — GBSBFORYOU</strong><p className="muted">तथ्य पहले · स्रोत स्पष्ट · संपादकीय उत्तरदायित्व मानव का</p></div></footer>
  </body></html>;
}