-- Weekend 4 patch migration
-- Repairs partial state from first migration attempt:
--   - story_counts exists but is malformed (missing user_id) → drop and recreate
--   - subscriptions does not exist → create
--   - children is missing photo columns → add with IF NOT EXISTS

-- 1. Drop broken story_counts and recreate correctly
DROP TABLE IF EXISTS story_counts CASCADE;

CREATE TABLE story_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  count integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, period_start)
);

ALTER TABLE story_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own story counts" ON story_counts
  FOR SELECT USING (auth.uid() = user_id);

-- 2. Create subscriptions table
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

-- 3. Add photo columns to children (IF NOT EXISTS guards)
ALTER TABLE children
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS appearance_description text,
  ADD COLUMN IF NOT EXISTS photo_unlocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS photo_unlock_token text,
  ADD COLUMN IF NOT EXISTS photo_unlock_token_expires_at timestamptz;

-- 4. Atomic story count increment function
CREATE OR REPLACE FUNCTION increment_story_count(p_user_id uuid, p_period_start date)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO story_counts (user_id, period_start, count)
  VALUES (p_user_id, p_period_start, 1)
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET count = story_counts.count + 1;
END;
$$;
