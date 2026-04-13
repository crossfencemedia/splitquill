import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'
import { Resend } from 'resend'
import { randomUUID } from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { childId } = await request.json() as { childId: string }

  const { data: child } = await serviceClient
    .from('children')
    .select('id, name, photo_unlocked')
    .eq('id', childId)
    .eq('parent_id', user.id)
    .single()

  if (!child) return NextResponse.json({ error: 'Child not found' }, { status: 404 })
  if (child.photo_unlocked) return NextResponse.json({ ok: true, alreadyUnlocked: true })

  const token = randomUUID()
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

  await serviceClient.from('children').update({
    photo_unlock_token: token,
    photo_unlock_token_expires_at: expires.toISOString(),
  }).eq('id', childId)

  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/email-gate/confirm?token=${token}&childId=${childId}`

  await resend.emails.send({
    from: 'Splitquill <onboarding@resend.dev>',
    to: [user.email!],
    subject: `Unlock photo upload for ${child.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="color:#7C3AED;">Unlock photo upload for ${child.name}</h2>
        <p>A parent confirmation is required before uploading ${child.name}'s photo to Splitquill. Click the button below to confirm.</p>
        <a href="${confirmUrl}" style="display:inline-block;background:#7C3AED;color:white;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:600;margin:16px 0;">
          Unlock Photo Upload
        </a>
        <p style="color:#6B7280;font-size:14px;">This link expires in 24 hours.</p>
      </div>
    `,
  })

  return NextResponse.json({ ok: true })
}
