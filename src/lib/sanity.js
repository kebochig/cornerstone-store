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
  name, "slug": slug.current, price, sizes, inStock, description,
  "category": category->title, images
}`;

/** Returns products in one normalized shape, from Sanity or the sample file. */
export async function getProducts() {
  if (!client) return sample;
  const rows = await client.fetch(QUERY);
  return rows.map((p) => ({
    ...p,
    category: p.category || 'Other',
    sizes: p.sizes || [],
    inStock: p.inStock !== false,
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
