const SIZES = ['3XS', '2XS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47'];

export default {
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    { name: 'name', title: 'Product name', type: 'string', validation: (R) => R.required() },
    {
      name: 'slug', title: 'Web address', type: 'slug',
      description: 'Click "Generate" after typing the name.',
      options: { source: 'name', maxLength: 80 },
      validation: (R) => R.required(),
    },
    { name: 'price', title: 'Price', type: 'number', validation: (R) => R.required().min(0) },
    { name: 'category', title: 'Category', type: 'reference', to: [{ type: 'category' }] },
    {
      name: 'stock', title: 'Stock', type: 'array',
      description: 'One row per size with how many you have left. For one-size items, add one row and leave the size empty. Update after each sale.',
      of: [{
        type: 'object', name: 'sizeStock',
        options: { columns: 2 },
        fields: [
          { name: 'size', title: 'Size', type: 'string', options: { list: SIZES } },
          { name: 'qty', title: 'Quantity', type: 'number', initialValue: 1, validation: (R) => R.required().integer().min(0) },
        ],
        preview: {
          select: { size: 'size', qty: 'qty' },
          prepare: ({ size, qty }) => ({ title: `${size || 'One size'}: ${qty ?? 0}${qty === 0 ? ' (sold out)' : ''}` }),
        },
      }],
      validation: (R) => R.custom((rows) => {
        const sizes = (rows || []).map((r) => r.size || '');
        return new Set(sizes).size === sizes.length || 'Each size should only appear once.';
      }),
    },
    {
      name: 'images', title: 'Photos', type: 'array',
      description: 'Drag photos here. The first one is the main photo.',
      of: [{ type: 'image', options: { hotspot: true } }],
      validation: (R) => R.min(1),
    },
    { name: 'description', title: 'Description', type: 'text', rows: 3 },
    { name: 'inStock', title: 'In stock', type: 'boolean', initialValue: true },
  ],
  preview: {
    select: { title: 'name', price: 'price', media: 'images.0', inStock: 'inStock', stock: 'stock' },
    prepare: ({ title, price, media, inStock, stock }) => {
      const left = Array.isArray(stock) ? stock.reduce((s, r) => s + (r.qty || 0), 0) : null;
      const status = inStock === false || left === 0 ? ' · Sold out' : left !== null ? ` · ${left} left` : '';
      return { title, media, subtitle: `${price ?? '-'}${status}` };
    },
  },
};
