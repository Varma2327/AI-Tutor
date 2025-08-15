"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); const [err, setErr] = useState<string|null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setErr(null);
    const res = await signIn("credentials", { email, password, redirect: true, callbackUrl: "/" });
    if ((res as any)?.error) { setErr((res as any).error); setLoading(false); }
  }

  return (
    <main className="min-h-[80vh] grid place-items-center">
      <form onSubmit={onSubmit} className="card w-full max-w-md p-6 grid gap-4">
        <div className="text-2xl font-semibold">Welcome back</div>
        <input className="input" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <button className="btn">{loading ? "Signing in…" : "Log in"}</button>
        {err && <div className="text-sm text-red-600">{err}</div>}
        <div className="text-sm text-gray-600 dark:text-gray-300">
          New here? <a href="/signup" className="text-brand-600 hover:underline">Create an account</a>
        </div>
      </form>
    </main>
  );
}
