import Stripe from 'stripe'

// Non-null assertion: STRIPE_SECRET_KEY is required at runtime.
// Avoid module-level throws — they fire during Next.js build-time module evaluation.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
