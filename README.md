# Store Catalogue

Astro site + Sanity admin. Customers browse, filter by category or size, add to a cart, and send the order on WhatsApp.

```
/            → storefront (Astro, deploys to Netlify)
/studio      → admin (Sanity Studio, hosted free at <name>.sanity.studio)
```

## 1. Run locally (works immediately with sample products)
```bash
npm install
cp .env.example .env      # set PUBLIC_WHATSAPP_NUMBER, PUBLIC_STORE_NAME
npm run dev               # http://localhost:4321
```

## 2. Set up the admin (Sanity, free)
```bash
cd studio
npm install
npx sanity login
npx sanity init --env     # create a project, copy the Project ID
export SANITY_STUDIO_PROJECT_ID=<your id>
npm run dev               # admin at http://localhost:3333
npm run deploy            # pick a name → admin lives at https://<name>.sanity.studio
```
- In **sanity.io/manage → Members**, invite the store owner (Editor role). They log in at the studio URL.
- In **API → CORS origins**, add your Netlify URL.
- Set `PUBLIC_SANITY_PROJECT_ID` in `.env`; the site now reads real products instead of the sample file.

## 3. Deploy the storefront (Netlify, free)
1. Push this folder to GitHub and import it in Netlify (build settings come from `netlify.toml`).
2. Add the `PUBLIC_*` variables from `.env` under **Site settings → Environment variables**.
3. Auto-publish: in Netlify **Build hooks**, create a hook and copy its URL. In Sanity **API → Webhooks**, add it (trigger on create/update/delete, filter `_type == "product"`). Every publish rebuilds the site in about a minute.

## Editing products (for the store owner)
Open the studio → **Product** → **+** → fill in name, click *Generate* for the web address, price, category, sizes (tick the boxes), drag in photos → **Publish**.
Categories are added under **Category** first.

## Customize
- Colours: `:root` in `src/styles/global.css`
- WhatsApp message text: `src/scripts/cart.js` (checkout handler)
- Product fields: `studio/schemas/product.js` + the query in `src/lib/sanity.js`
