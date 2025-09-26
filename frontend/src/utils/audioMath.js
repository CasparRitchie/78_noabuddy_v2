// frontend/src/utils/audioMath.js
export function cosineSim(a, b) {
  const n = Math.min(a.length, b.length);
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na  += a[i] * a[i];
    nb  += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb) || 1;
  return dot / denom;
}

export function meanVectors(arr) {
  if (!arr.length) return [];
  const n = arr[0].length;
  const out = new Array(n).fill(0);
  for (const v of arr) for (let i = 0; i < n; i++) out[i] += v[i];
  for (let i = 0; i < n; i++) out[i] /= arr.length;
  return out;
}
