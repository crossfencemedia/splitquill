export const TIER_LIMITS = {
  free:    { storiesPerMonth: 1 },
  premium: { storiesPerMonth: 4 },
  ultra:   { storiesPerMonth: 10 },
} as const

export type Tier = keyof typeof TIER_LIMITS
