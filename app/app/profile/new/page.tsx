"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function NewProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/signin"); return; }

    const { error } = await supabase.from("children").insert({
      parent_id: user.id,
      name: name.trim(),
      birthdate,
      gender: gender || null,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/app/pick");
    }
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6">
      <div className="mb-6 text-4xl select-none">✦</div>
      <h1 className="text-3xl font-bold mb-1" style={{ color: "var(--sq-purple)" }}>
        Tell us about your child
      </h1>
      <p className="text-stone-500 mb-8 text-center max-w-xs">
        This helps us make the story feel like it was written just for them.
      </p>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">
            Child&apos;s first name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Mateo"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">
            Date of birth <span className="text-red-400">*</span>
          </label>
          <input
            type="date"
            value={birthdate}
            onChange={e => setBirthdate(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-stone-200 text-stone-800 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-600 mb-1">
            Gender <span className="text-stone-400">(optional)</span>
          </label>
          <div className="flex gap-3">
            {(["", "male", "female"] as const).map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setGender(g)}
                className={`flex-1 py-3 rounded-xl border font-medium transition-colors ${
                  gender === g
                    ? "border-purple-500 text-purple-700 bg-purple-50"
                    : "border-stone-200 text-stone-500 hover:bg-stone-50"
                }`}
              >
                {g === "" ? "Prefer not to say" : g === "male" ? "Boy" : "Girl"}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl text-white font-semibold text-lg mt-2 transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: "var(--sq-purple)" }}
        >
          {loading ? "Saving…" : "Continue"}
        </button>
      </form>
    </main>
  );
}
