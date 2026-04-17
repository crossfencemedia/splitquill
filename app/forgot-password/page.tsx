"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <Link href="/" className="mb-8 text-3xl select-none" aria-label="Splitquill home">✦</Link>

        <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--sq-purple)" }}>
          Check your email
        </h1>
        <p className="text-stone-600 max-w-sm mb-6">
          If an account exists for <strong>{email}</strong>, we sent a password reset link.
        </p>
        <p className="text-stone-400 text-sm max-w-xs mb-8">
          Check your spam folder if you don&apos;t see it within a few minutes.
        </p>

        <Link
          href="/signin"
          className="px-8 py-3 rounded-2xl text-white font-semibold transition-opacity hover:opacity-90"
          style={{ background: "var(--sq-purple)" }}
        >
          Back to sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6">
      <Link href="/" className="mb-8 text-3xl select-none" aria-label="Splitquill home">✦</Link>

      <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--sq-purple)" }}>
        Reset your password
      </h1>
      <p className="text-stone-500 mb-8 max-w-sm text-center">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>

      <form onSubmit={handleReset} method="post" className="w-full max-w-sm flex flex-col gap-4">
        <div>
          <label htmlFor="reset-email" className="sr-only">Parent email</label>
          <input
            id="reset-email"
            type="email"
            placeholder="Parent email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
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
          {loading ? "Sending\u2026" : "Send reset link"}
        </button>
      </form>

      <Link
        href="/signin"
        className="mt-6 text-sm text-stone-500 hover:text-stone-700"
      >
        Back to sign in
      </Link>
    </main>
  );
}
