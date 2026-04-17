import { NextRequest, NextResponse } from 'next/server'
import { serviceClient } from '@/lib/supabase/service'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const childId = searchParams.get('childId')

  if (!token || !childId) {
    return NextResponse.redirect(new URL('/app?gate_error=missing', process.env.NEXT_PUBLIC_APP_URL!))
  }

  if (!rateLimit(`confirm:${childId}`, 5)) {
    return NextResponse.redirect(new URL('/app?gate_error=toomany', process.env.NEXT_PUBLIC_APP_URL!))
  }

  const { data: child } = await serviceClient
    .from('children')
    .select('id, parent_id, photo_unlock_token, photo_unlock_token_expires_at, photo_unlocked')
    .eq('id', childId)
    .single()

  if (!child) {
    return NextResponse.redirect(new URL('/app?gate_error=notfound', process.env.NEXT_PUBLIC_APP_URL!))
  }

  if (child.photo_unlocked) {
    return NextResponse.redirect(
      new URL(`/app/children/${childId}/edit?photo_unlocked=1`, process.env.NEXT_PUBLIC_APP_URL!)
    )
  }

  if (child.photo_unlock_token !== token) {
    return NextResponse.redirect(new URL('/app?gate_error=invalid', process.env.NEXT_PUBLIC_APP_URL!))
  }

  if (new Date(child.photo_unlock_token_expires_at) < new Date()) {
    return NextResponse.redirect(new URL('/app?gate_error=expired', process.env.NEXT_PUBLIC_APP_URL!))
  }

  await serviceClient.from('children').update({
    photo_unlocked: true,
    photo_unlock_token: null,
    photo_unlock_token_expires_at: null,
  }).eq('id', childId)

  return NextResponse.redirect(
    new URL(`/app/children/${childId}/edit?photo_unlocked=1`, process.env.NEXT_PUBLIC_APP_URL!)
  )
}
