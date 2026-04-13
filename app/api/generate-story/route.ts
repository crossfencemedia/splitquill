import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import { getReadingLevelInstruction, calcAgeYears } from '@/lib/reading-level';
import { TIER_LIMITS, Tier } from '@/lib/tier-limits';

// ---------------------------------------------------------------------------
// Supabase admin client (service role — bypasses RLS for server writes)
// ---------------------------------------------------------------------------
const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// ---------------------------------------------------------------------------
// Narrative Engine (inline — mirrors pipeline/narrative_engine.py logic)
// ---------------------------------------------------------------------------

function buildSystemPrompt(childAge: number): string {
  const readingLevel = getReadingLevelInstruction(childAge)
  return `You are a children's storybook author writing for kids ages 5-9.

READING LEVEL:
${readingLevel}

STORY STRUCTURE — 17 panels, branching:
Shared: p1, p2, p3
Branch A: p4a, p5a, p6a → p7aa, p8aa (path AA) and p7ab, p8ab (path AB)
Branch B: p4b, p5b, p6b → p7ba, p8ba (path BA) and p7bb, p8bb (path BB)

FAITH REQUIREMENT:
- p4a AND p4b must each contain a quiet declaration moment.
- The child realizes they are not alone. God knows them. They are loved.
- This must feel natural, not preachy. One or two sentences only.

BANNED: violence, blood, weapons, romance, classroom/homework, scary/horror content.

OUTPUT: Valid JSON only. No markdown. No explanation. Use this exact structure:

{
  "panels": [
    {
      "id": "p1",
      "sequence": 1,
      "text": "Story text here. Short sentences. Max 12 words each.",
      "scene_description": "What to illustrate. Describe the scene visually.",
      "word_count": 42
    }
  ],
  "branch_map": {
    "p3": {
      "prompt": "What does [child] do?",
      "choices": [
        { "label": "Choice A description", "next_panel_id": "p4a" },
        { "label": "Choice B description", "next_panel_id": "p4b" }
      ]
    },
    "p6a": {
      "prompt": "What does [child] do next?",
      "choices": [
        { "label": "Choice A description", "next_panel_id": "p7aa" },
        { "label": "Choice B description", "next_panel_id": "p7ab" }
      ]
    },
    "p6b": {
      "prompt": "What does [child] do next?",
      "choices": [
        { "label": "Choice A description", "next_panel_id": "p7ba" },
        { "label": "Choice B description", "next_panel_id": "p7bb" }
      ]
    }
  },
  "metadata": {
    "premise": "premise-id",
    "child_name": "name",
    "total_panels": 17,
    "unique_paths": 4
  }
}`
}

const PREMISES: Record<string, { name: string; prompt: string }> = {
  "space-rescue": {
    name: "Space Rescue",
    prompt: `Write a Space Rescue story. The child is floating in their homemade rocket near Earth.
A small purple alien creature is tangled in old satellite wires. It needs help.
The child must choose how to help it. Both paths lead to friendship and a safe rescue.`,
  },
  "neighborhood-mystery": {
    name: "Neighborhood Mystery",
    prompt: `Write a Neighborhood Mystery story. Something strange is happening on the child's street —
a series of small, funny mysteries (missing garden gnomes, backwards bikes, etc).
The child investigates and discovers a kind explanation. Both paths lead to a fun reveal.`,
  },
  "unlikely-friendship": {
    name: "Unlikely Friendship",
    prompt: `Write an Unlikely Friendship story. The child finds a wild animal that seems scared.
The child must figure out what it needs. Both paths lead to the animal being helped
and a surprising friendship formed.`,
  },
  "wild-invention": {
    name: "Wild Invention",
    prompt: `Write a Wild Invention story. The child's amazing gadget suddenly goes out of control —
in a funny, harmless way. They must fix it before it causes more (funny) chaos.
Both paths lead to a creative solution and a lesson learned.`,
  },
  "chef-catastrophe": {
    name: "Chef Catastrophe",
    prompt: `Write a Chef Catastrophe story. The child is cooking a special meal when everything
goes hilariously wrong — ingredients everywhere, smoke, a pet in the kitchen.
They must improvise and save the meal. Both paths lead to a triumphant (if imperfect) dish
and everyone laughing together.`,
  },
};

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const { storyId, premiseId, childName, childAge, childGender, childBirthdate } = await request.json();

  if (!storyId || !premiseId || !childName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const premise = PREMISES[premiseId];
  if (!premise) {
    return NextResponse.json({ error: "Unknown premise" }, { status: 400 });
  }

  if (childAge == null && !childBirthdate) {
    return NextResponse.json(
      { error: 'childAge or childBirthdate is required' },
      { status: 400 }
    )
  }
  const ageYears: number = childAge ?? calcAgeYears(childBirthdate)

  // Resolve userId from the story's child → parent relationship
  const { data: storyRow } = await supabase
    .from('stories')
    .select('child_id, children(parent_id)')
    .eq('id', storyId)
    .single()

  const userId = (storyRow?.children as { parent_id: string } | null)?.parent_id
  if (!userId) return NextResponse.json({ error: 'Story not found' }, { status: 404 })

  // Check subscription tier + story count
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  const tier = ((sub?.tier) ?? 'free') as Tier
  const limit = TIER_LIMITS[tier].storiesPerMonth

  const now = new Date()
  const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const { data: countRow } = await supabase
    .from('story_counts')
    .select('count')
    .eq('user_id', userId)
    .eq('period_start', periodStart)
    .single()

  const used = countRow?.count ?? 0

  if (used >= limit) {
    return NextResponse.json(
      { error: 'Story limit reached', tier, limit },
      { status: 403 }
    )
  }

  const gender = childGender === "male" ? "male" : childGender === "female" ? "female" : null;
  const pronoun = gender === "male" ? "He" : gender === "female" ? "She" : "They";
  const possessive = gender === "male" ? "his" : gender === "female" ? "her" : "their";

  const readingReminder = ageYears <= 6
    ? 'FK Grade 1, 8-word sentence cap'
    : ageYears <= 8
      ? 'FK Grade 2-3, 12-word sentence cap'
      : 'FK Grade 3-4, 15-word sentence cap'

  const userPrompt = `Write a complete branching story for ${childName}, age ${ageYears}.
${pronoun} is the hero of this story. Use ${possessive} name throughout.
Pronoun: ${pronoun} / ${possessive}

${premise.prompt}

Remember: ${readingReminder}, faith beat in p4a and p4b.
Output valid JSON only.`;

  const systemPrompt = buildSystemPrompt(ageYears)

  try {
    const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const response = await genai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.9,
        topP: 0.95,
        responseMimeType: "application/json",
      },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    });

    const raw = response.text ?? "";
    const storyData = JSON.parse(raw);

    // Save to Supabase
    const { error } = await supabase
      .from("stories")
      .update({
        panels: storyData,
        status: "ready",
      })
      .eq("id", storyId);

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: "Failed to save story" }, { status: 500 });
    }

    // Increment story count (MVP: no race condition protection — fine for <100 users)
    await supabase.from('story_counts').upsert(
      { user_id: userId, period_start: periodStart, count: used + 1 },
      { onConflict: 'user_id,period_start' }
    )

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Story generation error:", err);

    await supabase
      .from("stories")
      .update({ status: "failed" })
      .eq("id", storyId);

    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
