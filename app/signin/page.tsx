"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

function friendlyAuthError(message: string): string {
  if (message.toLowerCase().includes("email not confirmed")) {
    return "Please check your email for a confirmation link before signing in.";
  }
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Incorrect email or password. Please try again.";
  }
  return message;
}

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
      setError(friendlyAuthError(error.message));
      setLoading(false);
    } else {
      router.push("/app");
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6">
      <Link href="/" className="mb-8 text-3xl select-none" aria-label="Splitquill home">✦</Link>

      <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--sq-purple)" }}>
        Welcome back
      </h1>
      <p className="text-stone-500 mb-8">Continue your child&apos;s adventure.</p>

      <form onSubmit={handleSignIn} method="post" className="w-full max-w-sm flex flex-col gap-4">
        <div>
          <label htmlFor="signin-email" className="sr-only">Parent email</label>
          <input
            id="signin-email"
            type="email"
            placeholder="Parent email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
        <div>
          <label htmlFor="signin-password" className="sr-only">Password</label>
          <input
            id="signin-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        {error && <p className="text-red-500 text-sm" role="alert">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl text-white font-semibold text-lg transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--sq-purple)" }}
        >
          {loading ? "Signing in\u2026" : "Sign in"}
        </button>
      </form>

      <Link
        href="/forgot-password"
        className="mt-4 text-sm font-medium"
        style={{ color: "var(--sq-purple)" }}
      >
        Forgot your password?
      </Link>

      <p className="mt-4 text-stone-500 text-sm">
        New here?{" "}
        <Link href="/signup" className="font-semibold" style={{ color: "var(--sq-purple)" }}>
          Create an account
        </Link>
      </p>
    </main>
  );
}
