import { signIn } from "./actions";
export const metadata = { title: "टीम लॉगिन" };
export default function LoginPage({ searchParams }: {searchParams?:{error?:string}}) {
  return <main className="container max-w-lg py-12"><section className="panel"><h1 className="text-2xl font-bold">न्यूज़रूम लॉगिन</h1><p className="muted">केवल अधिकृत टीम सदस्य प्रवेश कर सकते हैं। सार्वजनिक पंजीकरण बंद है।</p>
    {searchParams?.error && <p className="notice mt-4">लॉगिन नहीं हो सका। ईमेल और पासवर्ड जाँचें।</p>}
    <form action={signIn} className="mt-5"><div className="field"><label htmlFor="email">ईमेल</label><input id="email" name="email" type="email" autoComplete="username" required /></div><div className="field"><label htmlFor="password">पासवर्ड</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div><button className="btn btn-primary w-full" type="submit">सुरक्षित लॉगिन</button></form>
  </section></main>;
}