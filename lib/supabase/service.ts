import { createClient } from '@supabase/supabase-js'

// Non-null assertions: these vars are required at runtime.
// Avoid module-level throws — they fire during Next.js build-time module evaluation.
export const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
)
