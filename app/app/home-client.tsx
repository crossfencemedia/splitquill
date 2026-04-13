"use client";

import { useState } from "react";
import Link from "next/link";
import UpgradeBanner from "./upgrade-banner";

type Child = { id: string; name: string };

export default function HomePageClient({
  children,
  showLimitBanner,
}: {
  children: Child[];
  showLimitBanner: boolean;
}) {
  const [activeChild, setActiveChild] = useState<Child>(children[0]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
      <div className="mb-4 text-5xl select-none">✦</div>
      <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--sq-purple)" }}>
        Hi, {activeChild.name}&apos;s family!
      </h1>
      <p className="text-stone-500 mb-6">Ready for a new adventure?</p>

      {children.length > 1 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => setActiveChild(child)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                activeChild.id === child.id
                  ? "bg-[#7C3AED] text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {child.name}
            </button>
          ))}
        </div>
      )}

      {showLimitBanner && <UpgradeBanner />}

      <Link
        href={`/app/pick?child_id=${activeChild.id}`}
        className="w-full max-w-xs py-4 rounded-2xl text-white font-semibold text-lg text-center transition-opacity hover:opacity-90"
        style={{ background: "var(--sq-purple)" }}
      >
        Start a new story
      </Link>

      <div className="flex gap-6 justify-center mt-6">
        <Link href="/app/stories" className="text-[#7C3AED] text-sm font-medium">
          My Stories →
        </Link>
        <Link href="/app/children" className="text-stone-500 text-sm">
          My Children
        </Link>
      </div>
    </main>
  );
}
