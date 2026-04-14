import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const childId = request.nextUrl.searchParams.get('childId')
  if (!childId) return NextResponse.json({ error: 'Missing childId' }, { status: 400 })

  const { data: child } = await serviceClient
    .from('children')
    .select('photo_url')
    .eq('id', childId)
    .eq('parent_id', user.id)
    .single()

  if (!child?.photo_url) return NextResponse.json({ error: 'No photo' }, { status: 404 })

  const { data, error } = await serviceClient.storage
    .from('child-photos')
    .createSignedUrl(child.photo_url, 3600)

  if (error || !data) {
    return NextResponse.json({ error: 'Failed to generate URL' }, { status: 500 })
  }

  return NextResponse.json({ signedUrl: data.signedUrl })
}
