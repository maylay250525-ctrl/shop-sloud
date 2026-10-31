// shop-cloud server: one Express app, one shared database.
// Shop and Admin both read/write the same store, so a shop top-up/order
// appears in Admin immediately and admin edits update the shop immediately.
//
// Storage:
//   * Default: JSON file store (data/db.json) — zero setup, local testing.
//   * If DATABASE_URL is set: Postgres (Neon / Supabase free tier) —
//     data survives Render restarts / spin-downs. See store.js.
// No native dependencies besides `pg` (only loaded when DATABASE_URL is set).
const express = require('express');
const path = require('path');
const { createStore } = require('./store');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'admin123';

let store; // set in start() before listening

// Async-handler wrapper: forward errors to Express instead of hanging.
const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function requireAdmin(req, res, next) {
  if (req.headers['x-admin-passcode'] !== ADMIN_PASSCODE) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

// ---------------------------------------------------------------------------
// Health check — lightweight, no DB write, no auth.
// External monitors (e.g. UptimeRobot) ping this every 5 minutes to keep a
// Render free service awake so it does not spin down after 15 min idle.
// ---------------------------------------------------------------------------
app.get('/health', (req, res) => res.json({ status: 'ok' }));

async function deliveryFeeFor(township, subtotal) {
  const settings = await store.getSettings();
  if (subtotal >= settings.freeThreshold) return 0;
  const zones = await store.getZones();
  const z = zones.find(x => x.name === township);
  return z ? z.fee : settings.otherTownshipFee;
}

// ---------------------------------------------------------------------------
// Public API — shop
// ---------------------------------------------------------------------------
app.get('/api/products', ah(async (req, res) => res.json(await store.getProducts())));
app.get('/api/delivery-zones', ah(async (req, res) => {
  const [zones, settings] = [await store.getZones(), await store.getSettings()];
  res.json({ zones, otherTownshipFee: settings.otherTownshipFee, freeThreshold: settings.freeThreshold });
}));
app.get('/api/settings', ah(async (req, res) => {
  const s = await store.getSettings();
  res.json({ recipientName: s.recipientName, recipientPhone: s.recipientPhone, freeThreshold: s.freeThreshold });
}));

// Place an order (cash on delivery, or wallet if paymentMethod === 'wallet')
app.post('/api/orders', ah(async (req, res) => {
  const { customerName, phone, address, township, items, paymentMethod } = req.body || {};
  if (!customerName || !phone || !address || !township || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'missing fields' });
  }
  let subtotal = 0;
  const lines = [];
  for (const it of items) {
    const p = await store.getProduct(it.productId);
    if (!p) return res.status(400).json({ error: 'unknown product: ' + it.productId });
    const qty = Math.max(1, parseInt(it.qty, 10) || 1);
    if (p.stock < qty) return res.status(400).json({ error: 'out of stock: ' + p.name });
    subtotal += p.price * qty;
    lines.push({ productId: p.id, name: p.name, price: p.price, qty });
  }
  const fee = await deliveryFeeFor(township, subtotal);
  const total = subtotal + fee;
  if (paymentMethod === 'wallet') {
    const w = await store.getWallet(phone);
    if (!w || w.balance < total) return res.status(402).json({ error: 'insufficient wallet balance' });
    w.balance -= total;
    w.ledger.push({ type: 'debit', amount: total, transferId: null, date: new Date().toISOString(), note: 'order payment' });
    await store.saveWallet(phone, w);
  }
  for (const l of lines) {
    const p = await store.getProduct(l.productId);
    await store.updateProduct(l.productId, { stock: p.stock - l.qty });
  }
  await store.upsertCustomer(phone, customerName, address);
  const n = await store.nextCounter('order');
  const order = {
    id: 'ORD-' + String(n).padStart(4, '0'),
    customerName, phone, address, township,
    items: lines, subtotal, deliveryFee: fee, total,
    paymentMethod: paymentMethod === 'wallet' ? 'wallet' : 'cash',
    status: 'pending', date: new Date().toISOString(),
  };
  await store.createOrder(order);
  res.status(201).json(order);
}));

// Order history for one phone number
app.get('/api/orders', ah(async (req, res) => {
  const phone = req.query.phone || '';
  const orders = await store.listOrders();
  res.json(orders.filter(o => o.phone === phone));
}));

// Wallet balance + ledger for one phone number
app.get('/api/wallet', ah(async (req, res) => {
  const phone = req.query.phone || '';
  const w = await store.getWallet(phone);
  res.json({ phone, balance: w.balance, ledger: w.ledger });
}));

// Top-up requests for one phone number
app.get('/api/topups', ah(async (req, res) => {
  const phone = req.query.phone || '';
  const topups = await store.listTopups();
  res.json(topups.filter(t => t.senderPhone === phone));
}));

// Submit a wallet top-up. Balance does NOT change here — admin approval only.
app.post('/api/topups', ah(async (req, res) => {
  const { senderName, senderPhone, method, amount, transferId } = req.body || {};
  if (!senderName || !senderPhone || !['kpay', 'wavepay'].includes(method) ||
      !Number.isFinite(Number(amount)) || Number(amount) <= 0 || !transferId) {
    return res.status(400).json({ error: 'missing or invalid fields' });
  }
  const dup = await store.findTopupByTransfer(method, String(transferId).trim());
  if (dup) return res.status(409).json({ error: 'duplicate transfer ID for this method' });
  const n = await store.nextCounter('topup');
  const topup = {
    id: 'TOP-' + String(n).padStart(4, '0'),
    senderName, senderPhone, method, amount: Number(amount),
    transferId: String(transferId).trim(),
    status: 'pending', date: new Date().toISOString(),
  };
  await store.createTopup(topup);
  res.status(201).json(topup);
}));

// ---------------------------------------------------------------------------
// Admin API (passcode in x-admin-passcode header)
// ---------------------------------------------------------------------------
app.post('/api/admin/login', (req, res) => {
  const { passcode } = req.body || {};
  if (passcode === ADMIN_PASSCODE) return res.json({ ok: true });
  res.status(401).json({ error: 'wrong passcode' });
});

app.get('/api/admin/overview', requireAdmin, ah(async (req, res) => {
  const [products, orders, topups] = [await store.getProducts(), await store.listOrders(), await store.listTopups()];
  const revenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  res.json({
    products: products.length,
    orders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    pendingTopups: topups.filter(t => t.status === 'pending').length,
    revenue,
    lowStock: products.filter(p => p.stock <= 5),
  });
}));

app.get('/api/admin/orders', requireAdmin, ah(async (req, res) => res.json(await store.listOrders())));
app.patch('/api/admin/orders/:id', requireAdmin, ah(async (req, res) => {
  if (!req.body.status) return res.status(400).json({ error: 'missing status' });
  const o = await store.updateOrder(req.params.id, { status: req.body.status });
  if (!o) return res.status(404).json({ error: 'not found' });
  res.json(o);
}));

app.get('/api/admin/topups', requireAdmin, ah(async (req, res) => res.json(await store.listTopups())));

app.post('/api/admin/topups/:id/approve', requireAdmin, ah(async (req, res) => {
  const t = await store.getTopup(req.params.id);
  if (!t) return res.status(404).json({ error: 'not found' });
  if (t.status !== 'pending') return res.status(409).json({ error: 'already ' + t.status });
  await store.updateTopup(t.id, { status: 'approved' });
  const w = await store.getWallet(t.senderPhone);
  w.balance += t.amount; // credit exactly once — status is now approved
  w.ledger.push({ type: 'credit', amount: t.amount, transferId: t.transferId, date: new Date().toISOString(), note: 'top-up approved' });
  await store.saveWallet(t.senderPhone, w);
  res.json({ topup: { ...t, status: 'approved' }, balance: w.balance });
}));

app.post('/api/admin/topups/:id/reject', requireAdmin, ah(async (req, res) => {
  const t = await store.getTopup(req.params.id);
  if (!t) return res.status(404).json({ error: 'not found' });
  if (t.status !== 'pending') return res.status(409).json({ error: 'already ' + t.status });
  await store.updateTopup(t.id, { status: 'rejected' });
  res.json({ ...t, status: 'rejected' });
}));

app.post('/api/admin/products', requireAdmin, ah(async (req, res) => {
  const { name, nameEn, price, stock, category, categoryEn } = req.body || {};
  if (!name || !Number.isFinite(Number(price))) return res.status(400).json({ error: 'missing fields' });
  const p = {
    id: 'p' + Date.now().toString(36),
    name, nameEn: nameEn || name, price: Number(price),
    stock: Number(stock) || 0, category: category || 'စားသောက်ကုန်', categoryEn: categoryEn || 'Groceries',
  };
  await store.createProduct(p);
  res.status(201).json(p);
}));

app.patch('/api/admin/products/:id', requireAdmin, ah(async (req, res) => {
  const fields = {};
  for (const k of ['name', 'nameEn', 'price', 'stock', 'category', 'categoryEn']) {
    if (req.body[k] !== undefined) fields[k] = (k === 'price' || k === 'stock') ? Number(req.body[k]) : req.body[k];
  }
  const p = await store.updateProduct(req.params.id, fields);
  if (!p) return res.status(404).json({ error: 'not found' });
  res.json(p);
}));

app.delete('/api/admin/products/:id', requireAdmin, ah(async (req, res) => {
  const ok = await store.deleteProduct(req.params.id);
  if (!ok) return res.status(404).json({ error: 'not found' });
  res.json({ ok: true });
}));

app.patch('/api/admin/delivery/:name', requireAdmin, ah(async (req, res) => {
  if (req.body.fee === undefined || !Number.isFinite(Number(req.body.fee))) return res.status(400).json({ error: 'missing fee' });
  const z = await store.updateZoneFee(decodeURIComponent(req.params.name), Number(req.body.fee));
  if (!z) return res.status(404).json({ error: 'not found' });
  res.json(z);
}));

app.get('/api/admin/settings', requireAdmin, ah(async (req, res) => res.json(await store.getSettings())));
app.patch('/api/admin/settings', requireAdmin, ah(async (req, res) => {
  const fields = {};
  for (const k of ['recipientName', 'recipientPhone', 'freeThreshold', 'otherTownshipFee']) {
    if (req.body[k] !== undefined) fields[k] = req.body[k];
  }
  res.json(await store.updateSettings(fields));
}));

app.get('/api/admin/wallets', requireAdmin, ah(async (req, res) => res.json(await store.listWallets())));

// Separate public pages, one shared database:
//   /      -> shop (anyone can open, no admin access from here)
//   /admin -> admin only (passcode gate, server-checked on every call)
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));

// SPA fallback (after API + static)
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

// JSON error handler (async-handler rejections land here)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'server error' });
});

async function start() {
  store = await createStore();
  app.listen(PORT, () => console.log(`shop-cloud listening on port ${PORT} (store: ${store.kind})`));
}
start().catch(err => { console.error('failed to start:', err); process.exit(1); });
