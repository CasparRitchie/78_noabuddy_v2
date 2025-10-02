// frontend/src/utils/coach.js

// Very lightweight heuristics to decide when to ask the coach
export function negativityScore(text) {
  const bad = [
    "always", "never", "stupid", "hate", "annoying",
    "lazy", "useless", "ridiculous", "whatever", "shut up"
  ];
  const t = (text || "").toLowerCase();
  return bad.reduce((acc, w) => acc + (t.includes(w) ? 1 : 0), 0);
}

export function youStatementScore(text) {
  const t = (text || "").toLowerCase();
  const absolutes = ["always", "never", "every time", "again"];
  let score = t.split(/\byou\b/).length - 1; // how often "you" appears
  for (const a of absolutes) if (t.includes(a)) score += 1;
  return score;
}

// Simple dominance proxy = ratio of who spoke most in the window
export function computeFlags(turns, windowSec = 120) {
  const now = Date.now() / 1000;
  const recent = turns.filter(t => now - t.ts <= windowSec);
  if (recent.length === 0) return [];

  const s1Count = recent.filter(t => t.speaker === "s1").length;
  const s2Count = recent.filter(t => t.speaker === "s2").length;
  const total = Math.max(1, s1Count + s2Count);
  const dominance = Math.max(s1Count, s2Count) / total;

  const lastTexts = recent.slice(-10).map(t => t.text || "");
  const negHits = lastTexts.reduce((a, txt) => a + negativityScore(txt), 0);
  const youHits = lastTexts.reduce((a, txt) => a + youStatementScore(txt), 0);

  const flags = [];
  if (dominance >= 0.75) flags.push("dominance");
  if (negHits >= 2) flags.push("negativity");
  if (youHits >= 2) flags.push("you_statements");

  return flags;
}
