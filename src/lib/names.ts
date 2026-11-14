/** Religious / honorific prefixes that shouldn't be treated as a first name. */
const TITLES = new Set([
  "br", "br.", "brother", "sr", "sr.", "sister", "fr", "fr.", "father", "rev", "rev.", "reverend",
  "dcn", "dcn.", "deacon", "mr", "mr.", "mrs", "mrs.", "ms", "ms.", "miss", "dr", "dr.",
]);

/** "Br. Emeka Okonkwo" → "Emeka"; "Samuel Gift" → "Samuel". */
export function displayFirstName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const first = parts.find((p) => !TITLES.has(p.toLowerCase()));
  return first ?? parts[0] ?? "";
}
