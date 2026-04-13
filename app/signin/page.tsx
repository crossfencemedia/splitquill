"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/app");
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6">
      <Link href="/" className="mb-8 text-3xl select-none">✦</Link>

      <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--sq-purple)" }}>
        Welcome back
      </h1>
      <p className="text-stone-500 mb-8">Continue your child&apos;s adventure.</p>

      <form onSubmit={handleSignIn} className="w-full max-w-sm flex flex-col gap-4">
        <input
          type="email"
          placeholder="Parent email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl text-white font-semibold text-lg transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--sq-purple)" }}
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-stone-500 text-sm">
        New here?{" "}
        <Link href="/signup" className="font-semibold" style={{ color: "var(--sq-purple)" }}>
          Create an account
        </Link>
      </p>
    </main>
  );
}
