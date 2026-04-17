"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
      setTimeout(() => router.push("/app"), 2000);
    }
  }

  if (done) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
        <Link href="/" className="mb-8 text-3xl select-none" aria-label="Splitquill home">✦</Link>
        <h1 className="text-3xl font-bold mb-3" style={{ color: "var(--sq-purple)" }}>
          Password updated
        </h1>
        <p className="text-stone-600">Redirecting you to your stories&hellip;</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6">
      <Link href="/" className="mb-8 text-3xl select-none" aria-label="Splitquill home">✦</Link>

      <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--sq-purple)" }}>
        Set a new password
      </h1>
      <p className="text-stone-500 mb-8">Choose a new password for your account.</p>

      <form onSubmit={handleReset} method="post" className="w-full max-w-sm flex flex-col gap-4">
        <div>
          <label htmlFor="new-password" className="sr-only">New password</label>
          <input
            id="new-password"
            type="password"
            placeholder="New password (8+ characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
        <div>
          <label htmlFor="confirm-password" className="sr-only">Confirm password</label>
          <input
            id="confirm-password"
            type="password"
            placeholder="Confirm password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
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
          {loading ? "Updating\u2026" : "Update password"}
        </button>
      </form>
    </main>
  );
}
