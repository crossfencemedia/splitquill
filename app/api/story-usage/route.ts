import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serviceClient } from '@/lib/supabase/service'
import { TIER_LIMITS, Tier } from '@/lib/tier-limits'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: sub } = await serviceClient
    .from('subscriptions')
    .select('tier')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  const tier = ((sub?.tier) ?? 'free') as Tier
  const limit = TIER_LIMITS[tier].storiesPerMonth

  const now = new Date()
  const periodStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

  const { data: countRow } = await serviceClient
    .from('story_counts')
    .select('count')
    .eq('user_id', user.id)
    .eq('period_start', periodStart)
    .single()

  const used = countRow?.count ?? 0

  return NextResponse.json({
    tier,
    limit,
    used,
    remaining: Math.max(0, limit - used),
    canGenerate: used < limit,
  })
}
