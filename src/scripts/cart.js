// Cart stored in localStorage; checkout opens WhatsApp with a prefilled order.
import { pickSimilar } from './similar.js';
import { track } from './track.js';

const KEY = 'cart.v1';
const LAST_KEY = 'cart.last'; // slug of the most recently added product, drives suggestions
const catalog = (() => { try { return JSON.parse(document.getElementById('catalog').textContent); } catch { return []; } })();
const { whatsapp, currency, store } = document.body.dataset;
const fmt = (n) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const sizeLabel = (size) => (size && size !== '-' ? `Size ${size}` : '');

const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const save = (c) => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch {} render(); };

export function addToCart(item) {
  const cart = load();
  const hit = cart.find((i) => i.slug === item.slug && i.size === item.size);
  if (hit) hit.qty = Math.min(hit.qty + 1, hit.max ?? Infinity);
  else cart.push({ ...item, qty: 1 });
  try { localStorage.setItem(LAST_KEY, item.slug); } catch {}
  save(cart);
  open();
}

function render() {
  const cart = load();
  const list = document.getElementById('cart-items');
  document.getElementById('cart-count').textContent = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById('cart-total').textContent = fmt(cart.reduce((s, i) => s + i.qty * i.price, 0));
  list.innerHTML = cart.length
    ? cart.map((i, idx) => `
      <li>
        <div><strong>${esc(i.name)}</strong><small>${[sizeLabel(i.size), fmt(i.price)].filter(Boolean).map(esc).join(' · ')}</small></div>
        <div class="qty">
          <button data-act="dec" data-idx="${idx}" aria-label="Decrease">−</button>
          <span>${i.qty}</span>
          <button data-act="inc" data-idx="${idx}" aria-label="Increase"${i.qty >= (i.max ?? Infinity) ? ' disabled' : ''}>+</button>
        </div>
      </li>`).join('')
    : '<li class="empty">Your cart is empty.</li>';
  renderSimilar(cart);
}

function renderSimilar(cart) {
  const box = document.getElementById('cart-similar');
  const inCart = cart.map((i) => i.slug);
  let last = null;
  try { last = localStorage.getItem(LAST_KEY); } catch {}
  const base = inCart.includes(last) ? last : inCart[inCart.length - 1];
  const picks = base ? pickSimilar(catalog, base, inCart, 3, 3) : [];
  box.hidden = picks.length === 0;
  document.getElementById('similar-list').innerHTML = picks.map((p) => `
    <a class="sim" href="/product/${encodeURIComponent(p.slug)}/" data-sim="${esc(p.slug)}" data-from="${esc(base)}" data-where="cart">
      ${p.image ? `<img src="${esc(p.image)}" alt="" loading="lazy" />` : '<span class="ph"></span>'}
      <span class="n">${esc(p.name)}</span>
      <span class="p">${esc(fmt(p.price))}</span>
    </a>`).join('');
}

// Suggestion taps in the cart drawer or the product page's "You may also like".
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-sim]');
  if (a) track('suggestion-click', { product: a.dataset.sim, from: a.dataset.from, where: a.dataset.where });
});

function open() { document.body.classList.add('cart-open'); }
function close() { document.body.classList.remove('cart-open'); }

document.getElementById('cart-open').onclick = open;
document.getElementById('cart-close').onclick = close;
document.getElementById('cart-backdrop').onclick = close;

document.getElementById('cart-items').onclick = (e) => {
  const b = e.target.closest('button[data-act]');
  if (!b) return;
  const cart = load();
  const i = cart[+b.dataset.idx];
  i.qty = Math.min(i.qty + (b.dataset.act === 'inc' ? 1 : -1), i.max ?? Infinity);
  save(cart.filter((x) => x.qty > 0));
};

document.getElementById('cart-checkout').onclick = () => {
  const cart = load();
  if (!cart.length) return;
  const name = document.getElementById('cart-name').value.trim();
  const lines = cart.map((i) => `• ${i.qty} x ${i.name}${sizeLabel(i.size) ? ` (${sizeLabel(i.size)})` : ''} – ${fmt(i.price * i.qty)}`);
  const total = fmt(cart.reduce((s, i) => s + i.qty * i.price, 0));
  const msg = [`Hello ${store}, I'd like to order:`, '', ...lines, '', `Total: ${total}`, name ? `Name: ${name}` : null]
    .filter((l) => l !== null).join('\n');
  track('whatsapp-order', {
    items: cart.reduce((s, i) => s + i.qty, 0),
    total: cart.reduce((s, i) => s + i.qty * i.price, 0),
    products: cart.map((i) => i.name).join(', ').slice(0, 450),
  });
  window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
};

// "Add to cart" buttons anywhere on the page
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-add]');
  if (!b) return;
  const root = b.closest('[data-product]');
  const sel = root.querySelector('select[name=size]');
  if (sel && !sel.value) { sel.focus(); sel.classList.add('shake'); setTimeout(() => sel.classList.remove('shake'), 400); return; }
  const p = JSON.parse(root.dataset.product);
  const size = sel ? sel.value : '-';
  track('add-to-cart', { product: p.name, size, price: p.price });
  addToCart({ slug: p.slug, name: p.name, price: p.price, size, max: p.stock?.[size] ?? undefined });
});

render();
