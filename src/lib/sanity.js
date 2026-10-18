import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import sample from '../data/sample.json';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET || 'production';

const client = projectId
  ? createClient({ projectId, dataset, apiVersion: '2024-10-01', useCdn: false })
  : null;

const builder = client ? imageUrlBuilder(client) : null;
const img = (src, w = 600) => builder.image(src).width(w).auto('format').url();

const QUERY = `*[_type == "product"] | order(_createdAt desc) {
  name, "slug": slug.current, price, sizes, stock[]{ size, qty }, inStock, description,
  "category": category->title, images
}`;

/** Stock at or below this shows "only N left". */
export const LOW_STOCK = 3;

/**
 * Turns stock rows into what the pages need. Products saved before stock
 * tracking only have `sizes`; those are treated as available with no count.
 */
function withStock(p) {
  const rows = p.stock?.length
    ? p.stock.map((r) => ({ size: r.size || '-', qty: Math.max(0, r.qty ?? 0) }))
    : (p.sizes?.length ? p.sizes : ['-']).map((size) => ({ size, qty: null }));
  const available = rows.filter((r) => r.qty === null || r.qty > 0);
  const tracked = rows.every((r) => r.qty !== null);
  return {
    ...p,
    sizes: available.map((r) => r.size).filter((s) => s !== '-'),
    stock: Object.fromEntries(available.map((r) => [r.size, r.qty])), // size -> qty, null = not tracked
    left: tracked ? available.reduce((s, r) => s + r.qty, 0) : null,
    inStock: p.inStock !== false && available.length > 0,
  };
}

/** Size dropdown label, e.g. "M (only 2 left)". */
export const sizeLabel = (p, size) => {
  const qty = p.stock[size];
  return qty != null && qty <= LOW_STOCK ? `${size} (only ${qty} left)` : size;
};

/** Returns products in one normalized shape, from Sanity or the sample file. */
export async function getProducts() {
  if (!client) return sample.map(withStock);
  const rows = await client.fetch(QUERY);
  return rows.map((p) => withStock({
    ...p,
    category: p.category || 'Other',
    images: (p.images || []).map((i) => img(i, 800)),
  }));
}

export const store = {
  name: import.meta.env.PUBLIC_STORE_NAME || 'Cornerstone Wears',
  whatsapp: import.meta.env.PUBLIC_WHATSAPP_NUMBER || '',
  currency: import.meta.env.PUBLIC_CURRENCY || 'NGN',
};

export const formatPrice = (n) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: store.currency, maximumFractionDigits: 0 }).format(n);
