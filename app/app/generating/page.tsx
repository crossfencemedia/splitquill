"use client";

import { useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Suspense } from "react";

const MESSAGES = [
  "Writing your adventure…",
  "Adding some magic…",
  "Drawing the illustrations…",
  "Making you the hero…",
  "Almost ready…",
];

function GeneratingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const storyId = searchParams.get("story");
  const premiseId = searchParams.get("premise");

  const kickoffGeneration = useCallback(async () => {
    if (!storyId || !premiseId) return;

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: children } = await supabase
      .from("children")
      .select("id, name, birthdate, gender")
      .eq("parent_id", user.id)
      .limit(1);

    if (!children?.length) return;
    const child = children[0];

    const age = new Date().getFullYear() - new Date(child.birthdate).getFullYear();

    // Call our API route to generate the story
    const res = await fetch("/api/generate-story", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storyId,
        premiseId,
        childName: child.name,
        childAge: age,
        childGender: child.gender,
      }),
    });

    if (res.ok) {
      router.push(`/app/story/${storyId}`);
    }
  }, [storyId, premiseId, router]);

  useEffect(() => {
    kickoffGeneration();
  }, [kickoffGeneration]);

  // Cycle through messages
  useEffect(() => {
    let i = 0;
    const el = document.getElementById("gen-msg");
    const interval = setInterval(() => {
      i = (i + 1) % MESSAGES.length;
      if (el) el.textContent = MESSAGES[i];
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      {/* Animated quill */}
      <div className="text-6xl mb-8 animate-bounce select-none">✦</div>

      <h1 className="text-2xl font-bold mb-3" style={{ color: "var(--sq-purple)" }}>
        Creating your story
      </h1>
      <p id="gen-msg" className="text-stone-500 text-lg mb-10 transition-all">
        {MESSAGES[0]}
      </p>

      {/* Progress dots */}
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-3 h-3 rounded-full"
            style={{
              background: "var(--sq-purple)",
              animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>

      <p className="mt-12 text-sm text-stone-400">This takes about 30–60 seconds.</p>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </main>
  );
}

export default function GeneratingPage() {
  return (
    <Suspense>
      <GeneratingContent />
    </Suspense>
  );
}
