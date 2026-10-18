export default {
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [{ name: 'title', title: 'Name', type: 'string', validation: (R) => R.required() }],
};
