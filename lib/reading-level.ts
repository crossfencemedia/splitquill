/**
 * Returns the reading level instruction string to inject into the story system prompt.
 * Based on child's age, maps to Flesch-Kincaid grade range.
 */
export function getReadingLevelInstruction(ageYears: number): string {
  if (ageYears <= 6) {
    return 'Write at a Flesch-Kincaid Grade 1 level. Use only 1–2 syllable words wherever possible. Maximum 8 words per sentence. Short, punchy sentences only.'
  }
  if (ageYears <= 8) {
    return 'Write at a Flesch-Kincaid Grade 2–3 level. Use simple vocabulary. Maximum 12 words per sentence.'
  }
  // age 9–10
  return 'Write at a Flesch-Kincaid Grade 3–4 level. Vocabulary may include occasional 3-syllable words. Maximum 15 words per sentence.'
}

/**
 * Calculates age in full years from a date string (YYYY-MM-DD or ISO).
 * Accounts for whether the birthday has occurred yet this calendar year.
 */
export function calcAgeYears(birthdate: string): number {
  const [year, month, day] = birthdate.split('-').map(Number)
  const birth = new Date(year, month - 1, day)
  const now = new Date()
  const age = now.getFullYear() - birth.getFullYear()
  const hadBirthday =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate())
  return hadBirthday ? age : age - 1
}
