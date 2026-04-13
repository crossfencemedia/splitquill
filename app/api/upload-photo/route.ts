import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('photo') as File | null
  const childId = formData.get('childId') as string | null

  if (!file || !childId) {
    return NextResponse.json({ error: 'Missing photo or childId' }, { status: 400 })
  }

  const { data: child } = await serviceClient
    .from('children')
    .select('id, photo_unlocked')
    .eq('id', childId)
    .eq('parent_id', user.id)
    .single()

  if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 })
  if (!child.photo_unlocked) {
    return NextResponse.json({ error: 'Photo upload not unlocked' }, { status: 403 })
  }

  const buffer = await file.arrayBuffer()
  const path = `${childId}/photo.jpeg`

  const { error: uploadError } = await serviceClient.storage
    .from('child-photos')
    .upload(path, buffer, { contentType: 'image/jpeg', upsert: true })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = serviceClient.storage.from('child-photos').getPublicUrl(path)

  await serviceClient.from('children').update({ photo_url: publicUrl }).eq('id', childId)

  return NextResponse.json({ photoUrl: publicUrl })
}
