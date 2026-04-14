import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'
import { GoogleGenAI } from '@google/genai'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { childId } = await request.json() as { childId: string }

  const { data: child } = await serviceClient
    .from('children')
    .select('id, photo_url, parent_id')
    .eq('id', childId)
    .eq('parent_id', user.id)
    .single()

  if (!child?.photo_url) {
    return NextResponse.json({ error: 'No photo uploaded' }, { status: 404 })
  }

  // Download directly via service client — bucket is private, no public URL available
  const { data: fileData, error: downloadError } = await serviceClient.storage
    .from('child-photos')
    .download(child.photo_url)

  if (downloadError || !fileData) {
    return NextResponse.json({ error: 'Could not retrieve photo' }, { status: 500 })
  }

  const imageBuffer = await fileData.arrayBuffer()
  const base64Image = Buffer.from(imageBuffer).toString('base64')

  const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

  const response = await genai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        parts: [
          {
            inlineData: { mimeType: 'image/jpeg', data: base64Image },
          },
          {
            text: `Describe the physical appearance of the child in this photo for use in a children's storybook illustration. Include only: hair color and texture, skin tone, eye color, face shape, approximate age. Write 1–2 sentences. Example: "A 7-year-old child with curly dark brown hair, warm brown skin, large dark eyes, and a round face." No identifying information beyond physical appearance.`,
          },
        ],
      },
    ],
  })

  const description =
    response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''

  await serviceClient
    .from('children')
    .update({ appearance_description: description })
    .eq('id', childId)

  return NextResponse.json({ description })
}
