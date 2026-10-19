/**
 * Picks products to suggest in the cart: `similar` from the same category
 * (closest price first), then `random` from other categories. The random picks
 * are seeded by the base product, so they stay put while the cart re-renders.
 * Skips sold-out products, the base itself and anything in `exclude` (e.g.
 * already in the cart). If one group runs short, the other fills the gap.
 */
export function pickSimilar(catalog, base, exclude = [], similar = 3, random = 3) {
  const ref = catalog.find((p) => p.slug === base);
  if (!ref) return [];
  const count = similar + random;
  const pool = catalog.filter((p) => p.inStock && p.slug !== base && !exclude.includes(p.slug));
  const byPrice = (a, b) => Math.abs(a.price - ref.price) - Math.abs(b.price - ref.price);
  const same = pool.filter((p) => p.category === ref.category).sort(byPrice);
  const other = shuffle(pool.filter((p) => p.category !== ref.category), seedFrom(base));

  const sameCount = Math.min(same.length, count - Math.min(random, other.length));
  const picks = [...same.slice(0, sameCount), ...other.slice(0, count - sameCount)];
  return picks.length < count ? [...picks, ...same.slice(sameCount, sameCount + count - picks.length)] : picks;
}

function seedFrom(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

// Fisher-Yates with a small seeded generator (mulberry32).
function shuffle(list, seed) {
  const out = [...list];
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
