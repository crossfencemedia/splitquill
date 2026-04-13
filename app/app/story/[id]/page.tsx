"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

interface Panel {
  id: string;
  sequence: number;
  text: string;
  scene_description: string;
  image_url?: string;
}

interface BranchChoice {
  label: string;
  next_panel_id: string;
}

interface BranchPoint {
  prompt: string;
  choices: BranchChoice[];
}

interface StoryData {
  panels: Panel[];
  branch_map: Record<string, BranchPoint>;
  premise_id: string;
  metadata?: { child_name?: string; child_age?: number };
}

const PATH_AA = ["p1", "p2", "p3", "p4a", "p5a", "p6a", "p7aa", "p8aa"];
const PATH_AB = ["p1", "p2", "p3", "p4a", "p5a", "p6a", "p7ab", "p8ab"];
const PATH_BA = ["p1", "p2", "p3", "p4b", "p5b", "p6b", "p7ba", "p8ba"];
const PATH_BB = ["p1", "p2", "p3", "p4b", "p5b", "p6b", "p7bb", "p8bb"];
const PATHS: Record<string, string[]> = { aa: PATH_AA, ab: PATH_AB, ba: PATH_BA, bb: PATH_BB };

// Staged generation sets — queue more panels as choices are made
const INITIAL_PANELS = ["p1", "p2", "p3", "p4a", "p4b"];
const BRANCH_A_PANELS = ["p5a", "p6a", "p7aa", "p8aa", "p7ab", "p8ab"];
const BRANCH_B_PANELS = ["p5b", "p6b", "p7ba", "p8ba", "p7bb", "p8bb"];

export default function StoryViewerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [story, setStory] = useState<StoryData | null>(null);
  const [panelIndex, setPanelIndex] = useState<Record<string, Panel>>({});
  const [loading, setLoading] = useState(true);
  const [currentPanelIndex, setCurrentPanelIndex] = useState(0);
  const [chosenPath, setChosenPath] = useState<string>("aa");
  const [firstChoice, setFirstChoice] = useState<"a" | "b" | null>(null);
  const [waitingForChoice, setWaitingForChoice] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [childName, setChildName] = useState("the child");
  const [childAge, setChildAge] = useState(7);

  // Refs to avoid stale closures — generation callbacks read from these
  const storyRef = useRef<StoryData | null>(null);
  const childNameRef = useRef("the child");
  const childAgeRef = useRef(7);
  const queuedRef = useRef<Set<string>>(new Set());
  const activeGenerationsRef = useRef(0);

  useEffect(() => { if (story) storyRef.current = story; }, [story]);
  useEffect(() => { childNameRef.current = childName; }, [childName]);
  useEffect(() => { childAgeRef.current = childAge; }, [childAge]);

  // Load story and child info
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/signin"); return; }

      const [{ data: storyRow }, { data: children }] = await Promise.all([
        supabase.from("stories").select("panels, premise_id, path").eq("id", id).single(),
        supabase.from("children").select("name, birthdate").eq("parent_id", user.id).limit(1),
      ]);

      if (!storyRow?.panels) { router.push("/app"); return; }

      const data = storyRow.panels as StoryData;
      setStory(data);
      storyRef.current = data;

      const idx: Record<string, Panel> = {};
      data.panels.forEach(p => {
        idx[p.id] = p;
        if (p.image_url) {
          setImageUrls(prev => ({ ...prev, [p.id]: p.image_url! }));
          // Mark already-stored images as queued so we don't regenerate
          queuedRef.current.add(p.id);
        }
      });
      setPanelIndex(idx);

      if (storyRow.path) setChosenPath(storyRow.path);

      if (children?.[0]) {
        const name = children[0].name;
        const age = new Date().getFullYear() - new Date(children[0].birthdate).getFullYear();
        setChildName(name);
        setChildAge(age);
        childNameRef.current = name;
        childAgeRef.current = age;
      }

      setLoading(false);
    }
    load();
  }, [id, router]);

  // Core generation function — only depends on storyId, reads everything else from refs
  const generatePanelImages = useCallback(async (panelIds: string[]) => {
    const toQueue = panelIds.filter(pid => !queuedRef.current.has(pid));
    if (toQueue.length === 0) return;

    // Mark queued immediately to prevent duplicate requests
    toQueue.forEach(pid => queuedRef.current.add(pid));

    activeGenerationsRef.current += 1;
    setGeneratingImages(true);

    for (const panelId of toQueue) {
      const panel = storyRef.current?.panels.find(p => p.id === panelId);
      if (!panel) continue;
      try {
        const res = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyId: id,
            panelId,
            sceneDescription: panel.scene_description,
            childName: childNameRef.current,
            childAge: childAgeRef.current,
          }),
        });
        if (res.ok) {
          const { imageUrl } = await res.json();
          setImageUrls(prev => ({ ...prev, [panelId]: imageUrl }));
        }
      } catch (e) {
        console.error(`Image gen failed for ${panelId}:`, e);
      }
    }

    activeGenerationsRef.current -= 1;
    if (activeGenerationsRef.current === 0) {
      setGeneratingImages(false);
    }
  }, [id]);

  // Stage 1: On load — shared panels + both first-branch previews
  useEffect(() => {
    if (!story || loading) return;
    generatePanelImages(INITIAL_PANELS);
  }, [story, loading, generatePanelImages]);

  // Stage 2: After first branch choice — generate all remaining panels for that branch
  useEffect(() => {
    if (!firstChoice) return;
    generatePanelImages(firstChoice === "a" ? BRANCH_A_PANELS : BRANCH_B_PANELS);
  }, [firstChoice, generatePanelImages]);

  if (loading) {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <p className="text-stone-400">Loading story…</p>
      </main>
    );
  }

  if (!story) return null;

  const pathPanelIds = PATHS[chosenPath] || PATH_AA;
  const currentPanelId = pathPanelIds[currentPanelIndex];
  const currentPanel = panelIndex[currentPanelId];
  const isLast = currentPanelIndex === pathPanelIds.length - 1;
  const isBranchPoint = (currentPanelId === "p3" || currentPanelId === "p6a" || currentPanelId === "p6b");
  const branchPoint = story.branch_map?.[currentPanelId];
  const currentImageUrl = imageUrls[currentPanelId];

  function handleChoice(choice: "a" | "b") {
    if (currentPanelId === "p3") {
      setFirstChoice(choice);
      setChosenPath(choice + "a");
    } else {
      const path = (firstChoice || "a") + choice;
      setChosenPath(path);
    }
    setWaitingForChoice(false);
    setCurrentPanelIndex(i => i + 1);
  }

  function handleNext() {
    if (isBranchPoint && !waitingForChoice) {
      setWaitingForChoice(true);
      return;
    }
    if (!isLast) setCurrentPanelIndex(i => i + 1);
  }

  return (
    <main className="flex flex-col min-h-screen">
      {/* Progress bar */}
      <div className="w-full h-1" style={{ background: "var(--sq-purple-light, #EDE9FE)" }}>
        <div
          className="h-1 transition-all duration-500"
          style={{
            width: `${((currentPanelIndex + 1) / pathPanelIds.length) * 100}%`,
            background: "var(--sq-purple, #7C3AED)",
          }}
        />
      </div>

      {/* Image generating notice */}
      {generatingImages && (
        <div className="text-center text-xs text-stone-400 py-2 bg-stone-50 border-b border-stone-100">
          ✦ Illustrating your story…
        </div>
      )}

      <div className="flex-1 flex flex-col items-center px-4 py-6 max-w-lg mx-auto w-full">
        <p className="text-sm text-stone-400 mb-4 self-start">
          Panel {currentPanelIndex + 1} of {pathPanelIds.length}
        </p>

        {/* Illustration */}
        <div
          className="w-full aspect-square rounded-3xl mb-6 flex items-center justify-center overflow-hidden"
          style={{ background: "#EDE9FE" }}
        >
          {currentImageUrl ? (
            <Image
              src={currentImageUrl}
              alt={`Panel ${currentPanelIndex + 1}`}
              width={512}
              height={512}
              className="w-full h-full object-cover rounded-3xl"
            />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="text-5xl select-none animate-pulse">✦</span>
              <span className="text-xs text-stone-400">Illustrating…</span>
            </div>
          )}
        </div>

        {/* Story text */}
        <p className="text-xl leading-relaxed text-stone-800 text-center mb-8">
          {currentPanel?.text || ""}
        </p>

        {/* Branch choices */}
        {waitingForChoice && branchPoint && (
          <div className="w-full mb-6">
            <p className="text-center font-semibold text-stone-700 mb-4">
              {branchPoint.prompt}
            </p>
            <div className="flex flex-col gap-3">
              {branchPoint.choices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() => handleChoice(i === 0 ? "a" : "b")}
                  className="w-full py-4 px-5 rounded-2xl border-2 border-purple-300 text-stone-800 font-medium text-left hover:bg-purple-50 transition-colors"
                >
                  {choice.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Next / Done */}
        {!waitingForChoice && (
          <button
            onClick={isLast ? () => router.push("/app") : handleNext}
            className="w-full py-4 rounded-2xl text-white font-semibold text-lg transition-opacity hover:opacity-90"
            style={{ background: "var(--sq-purple, #7C3AED)" }}
          >
            {isLast ? "The end — start a new adventure" : isBranchPoint ? "Make a choice…" : "Next →"}
          </button>
        )}
      </div>
    </main>
  );
}
