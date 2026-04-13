import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

export const runtime = 'nodejs'

const service = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)

function tierFromPriceId(priceId: string): 'premium' | 'ultra' | 'free' {
  if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) return 'premium'
  if (priceId === process.env.STRIPE_ULTRA_PRICE_ID) return 'ultra'
  return 'free'
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated'
  ) {
    const sub = event.data.object as Stripe.Subscription
    const priceId = sub.items.data[0]?.price.id ?? ''
    const userId = sub.metadata?.userId ?? ''

    if (userId) {
      await service.from('subscriptions').upsert(
        {
          user_id: userId,
          stripe_customer_id: sub.customer as string,
          stripe_subscription_id: sub.id,
          tier: tierFromPriceId(priceId),
          status: sub.status,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'stripe_subscription_id' }
      )
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    await service
      .from('subscriptions')
      .update({
        status: 'canceled',
        tier: 'free',
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', sub.id)
  }

  return NextResponse.json({ received: true })
}
