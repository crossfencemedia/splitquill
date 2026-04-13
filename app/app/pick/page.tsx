"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PREMISES = [
  {
    id: "space-rescue",
    emoji: "🚀",
    title: "Space Rescue",
    description: "An alien creature is tangled in satellite wires. Only you can save it.",
  },
  {
    id: "neighborhood-mystery",
    emoji: "🔍",
    title: "Neighborhood Mystery",
    description: "Something strange is happening on your street. Time to investigate.",
  },
  {
    id: "unlikely-friendship",
    emoji: "🦊",
    title: "Unlikely Friendship",
    description: "A wild animal needs your help. Can you understand what it's trying to say?",
  },
  {
    id: "wild-invention",
    emoji: "⚙️",
    title: "Wild Invention",
    description: "Your amazing gadget works — but now it's out of control. Fix it!",
  },
  {
    id: "chef-catastrophe",
    emoji: "👨‍🍳",
    title: "Chef Catastrophe",
    description: "The kitchen is a disaster. Can you save the meal before the guests arrive?",
  },
];

export default function PremisePickerPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    if (!selected) return;
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/signin"); return; }

    const { data: children } = await supabase
      .from("children")
      .select("id")
      .eq("parent_id", user.id)
      .limit(1);

    if (!children?.length) { router.push("/app/profile/new"); return; }

    const { data: story, error } = await supabase
      .from("stories")
      .insert({
        child_id: children[0].id,
        premise_id: selected,
        status: "generating",
      })
      .select("id")
      .single();

    if (error || !story) {
      setLoading(false);
      return;
    }

    router.push(`/app/generating?story=${story.id}&premise=${selected}`);
  }

  return (
    <main className="flex flex-col items-center min-h-screen px-6 py-12">
      <div className="mb-2 text-3xl select-none">✦</div>
      <h1 className="text-3xl font-bold mb-1 text-center" style={{ color: "var(--sq-purple)" }}>
        Pick your adventure
      </h1>
      <p className="text-stone-500 mb-8 text-center">What kind of story do you want today?</p>

      <div className="w-full max-w-sm flex flex-col gap-3 mb-8">
        {PREMISES.map(p => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={`w-full text-left px-5 py-4 rounded-2xl border-2 transition-all ${
              selected === p.id
                ? "border-purple-500 bg-purple-50"
                : "border-stone-200 hover:border-purple-200 bg-white"
            }`}
          >
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">{p.emoji}</span>
              <span className="font-semibold text-stone-800">{p.title}</span>
            </div>
            <p className="text-stone-500 text-sm leading-snug ml-9">{p.description}</p>
          </button>
        ))}
      </div>

      <button
        onClick={handleStart}
        disabled={!selected || loading}
        className="w-full max-w-sm py-4 rounded-2xl text-white font-semibold text-lg transition-opacity hover:opacity-90 disabled:opacity-40"
        style={{ background: "var(--sq-purple)" }}
      >
        {loading ? "Starting…" : "Begin this adventure"}
      </button>
    </main>
  );
}
