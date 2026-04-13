import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

export const maxDuration = 60;

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const STYLE_PREAMBLE =
  "Children's storybook illustration, Pixar-inspired digital art style. " +
  "Warm vibrant colors. Soft rounded shapes. Expressive character faces. " +
  "Ages 5-9 audience. Single illustrated panel composition. " +
  "No text, no words, no letters anywhere in the image.";

export async function POST(request: Request) {
  const { storyId, panelId, sceneDescription, childName, childAge } =
    await request.json();

  if (!storyId || !panelId || !sceneDescription) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const prompt = `${STYLE_PREAMBLE}
The hero is ${childName || "a child"}, a ${childAge || 7}-year-old child rendered in storybook illustration style.
${sceneDescription}
No text, no words, no letters, no numbers anywhere in the image.`;

  try {
    const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    const response = await genai.models.generateImages({
      model: "imagen-4.0-fast-generate-001",
      prompt,
      config: { numberOfImages: 1, aspectRatio: "1:1" },
    });

    // Extract image data from response
    let imageData: string | null = null;
    const mimeType = "image/jpeg";

    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (imageBytes) {
      imageData = typeof imageBytes === "string"
        ? imageBytes
        : Buffer.from(imageBytes).toString("base64");
    }

    if (!imageData) {
      return NextResponse.json({ error: "No image generated" }, { status: 500 });
    }

    // Upload to Supabase Storage
    const path = `${storyId}/${panelId}.jpeg`;
    const buffer = Buffer.from(imageData, "base64");

    const { error: uploadError } = await supabase.storage
      .from("story-images")
      .upload(path, buffer, { contentType: mimeType, upsert: true });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from("story-images")
      .getPublicUrl(path);

    const imageUrl = urlData.publicUrl;

    // Update the panel's image_url in the story JSON
    const { data: storyRow } = await supabase
      .from("stories")
      .select("panels")
      .eq("id", storyId)
      .single();

    if (storyRow?.panels) {
      const storyData = storyRow.panels as { panels: { id: string; image_url?: string }[] };
      const updatedPanels = storyData.panels.map((p) =>
        p.id === panelId ? { ...p, image_url: imageUrl } : p
      );
      await supabase
        .from("stories")
        .update({ panels: { ...storyData, panels: updatedPanels } })
        .eq("id", storyId);
    }

    return NextResponse.json({ imageUrl });
  } catch (err) {
    console.error("Image generation error:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
