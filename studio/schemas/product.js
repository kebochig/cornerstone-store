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
      name: 'sizes', title: 'Sizes available', type: 'array', of: [{ type: 'string' }],
      description: 'Tick every size you have. Leave all unticked for one-size items.',
      options: {
        layout: 'grid',
        list: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47'],
      },
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
    select: { title: 'name', price: 'price', media: 'images.0', inStock: 'inStock' },
    prepare: ({ title, price, media, inStock }) => ({
      title, media, subtitle: `${price ?? '-'}${inStock === false ? ' · Sold out' : ''}`,
    }),
  },
};
