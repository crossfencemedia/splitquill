-- Weekend 4 schema extensions
-- Run in Supabase SQL Editor (project: wpkvkeujpvdqgbtodtug)

-- Extend children table with photo upload columns
ALTER TABLE children
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS appearance_description text,
  ADD COLUMN IF NOT EXISTS photo_unlocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS photo_unlock_token text,
  ADD COLUMN IF NOT EXISTS photo_unlock_token_expires_at timestamptz;

-- Subscriptions table (one row per user)
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'ultra')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Story counts table (one row per user per billing month)
CREATE TABLE IF NOT EXISTS story_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, period_start)
);

ALTER TABLE story_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own story counts" ON story_counts
  FOR SELECT USING (auth.uid() = user_id);
