"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignupPage() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); const [err, setErr] = useState<string|null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr(null);
    const r = await fetch("/api/signup", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ email, password }) });
    if (!r.ok) { const j = await r.json().catch(()=>({error:"Signup failed"})); setErr(j.error||"Signup failed"); setLoading(false); return; }
    const res = await signIn("credentials", { email, password, redirect: true, callbackUrl: "/" });
    if ((res as any)?.error) { setErr((res as any).error); setLoading(false); }
  }

  return (
    <main className="min-h-[80vh] grid place-items-center">
      <form onSubmit={onSubmit} className="card w-full max-w-md p-6 grid gap-4">
        <div className="text-2xl font-semibold">Create your account</div>
        <input className="input" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Password (min 6 chars)" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} required />
        <button className="btn">{loading ? "Creating…" : "Sign up"}</button>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Have an account? <a href="/login" className="text-brand-600 hover:underline">Log in</a>
        </div>
      </form>
    </main>
  );
}
