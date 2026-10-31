// store.js — storage layer for shop-cloud.
//
// Two backends, one interface:
//   * JSON file store (default, no setup): data/db.json, atomic writes.
//   * Postgres (when DATABASE_URL is set): real tables, so data survives
//     Render restarts / spin-downs. The `pg` package is required lazily,
//     only when DATABASE_URL is set, so the app still starts without it.
//
// Both backends expose the same async methods, so the API behaves
// identically in either mode.
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'db.json');

// ---------------------------------------------------------------------------
// Seed data (shared by both backends)
// ---------------------------------------------------------------------------
const SEED_PRODUCTS = [
  { id: 'p01', name: 'ဆန် (၅ ကီလို)', nameEn: 'Rice (5 kg)', price: 25000, stock: 50, category: 'စားသောက်ကုန်', categoryEn: 'Groceries' },
  { id: 'p02', name: 'စားသုံးဆီ (၁ လီတာ)', nameEn: 'Cooking oil (1 L)', price: 8500, stock: 60, category: 'စားသောက်ကုန်', categoryEn: 'Groceries' },
  { id: 'p03', name: 'ကြက်ဥ (၁၀ လုံး)', nameEn: 'Eggs (10 pcs)', price: 4500, stock: 100, category: 'စားသောက်ကုန်', categoryEn: 'Groceries' },
  { id: 'p04', name: 'နို့ (၁ လီတာ)', nameEn: 'Milk (1 L)', price: 3500, stock: 40, category: 'စားသောက်ကုန်', categoryEn: 'Groceries' },
  { id: 'p05', name: 'ပေါင်မုန့်', nameEn: 'Bread', price: 2500, stock: 30, category: 'စားသောက်ကုန်', categoryEn: 'Groceries' },
  { id: 'p06', name: 'ခေါက်ဆွဲ (၅ ထုပ်)', nameEn: 'Instant noodles (5 pk)', price: 3000, stock: 80, category: 'စားသောက်ကုန်', categoryEn: 'Groceries' },
  { id: 'p07', name: 'သကြား (၁ ကီလို)', nameEn: 'Sugar (1 kg)', price: 3000, stock: 50, category: 'စားသောက်ကုန်', categoryEn: 'Groceries' },
  { id: 'p08', name: 'ဆား (၁ ကီလို)', nameEn: 'Salt (1 kg)', price: 1200, stock: 70, category: 'စားသောက်ကုန်', categoryEn: 'Groceries' },
  { id: 'p09', name: 'လက်ဖက်ရည် (အထုပ် ၂၀)', nameEn: 'Tea mix (20 pk)', price: 4000, stock: 45, category: 'စားသောက်ကုန်', categoryEn: 'Groceries' },
  { id: 'p10', name: 'ကော်ဖီ (အထုပ် ၂၀)', nameEn: 'Coffee (20 pk)', price: 5000, stock: 45, category: 'စားသောက်ကုန်', categoryEn: 'Groceries' },
  { id: 'p11', name: 'ငှက်ပျောသီး (၁ ဖီး)', nameEn: 'Banana (1 bunch)', price: 3500, stock: 35, category: 'အသီးအနှံ', categoryEn: 'Fruits' },
  { id: 'p12', name: 'ပန်းသီး (၁ ကီလို)', nameEn: 'Apple (1 kg)', price: 8000, stock: 25, category: 'အသီးအနှံ', categoryEn: 'Fruits' },
  { id: 'p13', name: 'ခရမ်းချဉ်သီး (၁ ကီလို)', nameEn: 'Tomato (1 kg)', price: 2500, stock: 40, category: 'အသီးအနှံ', categoryEn: 'Fruits' },
  { id: 'p14', name: 'ကြက်သွန်နီ (၁ ကီလို)', nameEn: 'Onion (1 kg)', price: 3000, stock: 60, category: 'အသီးအနှံ', categoryEn: 'Fruits' },
  { id: 'p15', name: 'အာလူး (၁ ကီလို)', nameEn: 'Potato (1 kg)', price: 2800, stock: 60, category: 'အသီးအနှံ', categoryEn: 'Fruits' },
  { id: 'p16', name: 'ကြက်သား (၁ ကီလို)', nameEn: 'Chicken (1 kg)', price: 12000, stock: 20, category: 'အသား/ငါး', categoryEn: 'Meat & Fish' },
  { id: 'p17', name: 'ဝက်သား (၁ ကီလို)', nameEn: 'Pork (1 kg)', price: 15000, stock: 15, category: 'အသား/ငါး', categoryEn: 'Meat & Fish' },
  { id: 'p18', name: 'ငါး (၁ ကီလို)', nameEn: 'Fish (1 kg)', price: 9000, stock: 20, category: 'အသား/ငါး', categoryEn: 'Meat & Fish' },
  { id: 'p19', name: 'ဆပ်ပြာ', nameEn: 'Soap', price: 2000, stock: 80, category: 'အိမ်သုံးပစ္စည်း', categoryEn: 'Household' },
  { id: 'p20', name: 'သွားတိုက်ဆေး', nameEn: 'Toothpaste', price: 2500, stock: 70, category: 'အိမ်သုံးပစ္စည်း', categoryEn: 'Household' },
];

// 26 Yangon townships, fee in Ks by zone. Any other township = 4,000 Ks.
const SEED_ZONES = [
  ['Lanmadaw', 1500], ['Latha', 1500], ['Pabedan', 1500], ['Kyauktada', 1500],
  ['Botahtaung', 2000], ['Pazundaung', 2000], ['Sanchaung', 2000], ['Ahlone', 2000],
  ['Dagon', 2500], ['Bahan', 2500], ['Kamayut', 2500], ['Tamwe', 2500],
  ['Mingalar Taungnyunt', 2500], ['Hlaing', 3000], ['Mayangone', 3000],
  ['Insein', 3000], ['Yankin', 3000], ['North Okkalapa', 3500],
  ['South Okkalapa', 3500], ['Thaketa', 3500], ['Dawbon', 3500],
  ['Thingangyun', 3500], ['South Dagon', 4000], ['North Dagon', 4000],
  ['East Dagon', 4000], ['Shwepyitha', 4000],
].map(([name, fee]) => ({ name, fee }));

const SEED_SETTINGS = { recipientName: 'LinLinAung', recipientPhone: '09680237595', freeThreshold: 30000, otherTownshipFee: 4000 };

function seedDb() {
  return {
    products: SEED_PRODUCTS.map(p => ({ ...p })),
    deliveryZones: SEED_ZONES.map(z => ({ ...z })),
    settings: { ...SEED_SETTINGS },
    orders: [],
    topups: [],
    wallets: {},
    users: [],
    counters: { order: 0, topup: 0 },
  };
}

// ---------------------------------------------------------------------------
// JSON file store (default backend)
// ---------------------------------------------------------------------------
class JsonStore {
  constructor() {
    this.kind = 'json';
    this.db = this._load();
  }
  _load() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        if (!Array.isArray(db.users)) db.users = []; // migrate old db.json files
        return db;
      }
    } catch (e) { console.error('DB read failed, reseeding:', e.message); }
    const db = seedDb();
    this._save(db);
    return db;
  }
  _save(db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const tmp = DB_PATH + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
    fs.renameSync(tmp, DB_PATH); // atomic on POSIX
  }
  _persist() { this._save(this.db); }

  async getProducts() { return this.db.products; }
  async getProduct(id) { return this.db.products.find(p => p.id === id) || null; }
  async createProduct(p) { this.db.products.push(p); this._persist(); return p; }
  async updateProduct(id, fields) {
    const p = this.db.products.find(x => x.id === id);
    if (!p) return null;
    Object.assign(p, fields);
    this._persist();
    return p;
  }
  async deleteProduct(id) {
    const i = this.db.products.findIndex(x => x.id === id);
    if (i < 0) return false;
    this.db.products.splice(i, 1);
    this._persist();
    return true;
  }
  async getZones() { return this.db.deliveryZones; }
  async updateZoneFee(name, fee) {
    const z = this.db.deliveryZones.find(x => x.name === name);
    if (!z) return null;
    z.fee = fee;
    this._persist();
    return z;
  }
  async getSettings() { return this.db.settings; }
  async updateSettings(fields) { Object.assign(this.db.settings, fields); this._persist(); return this.db.settings; }
  async listOrders() { return this.db.orders; }
  async getOrder(id) { return this.db.orders.find(o => o.id === id) || null; }
  async createOrder(order) { this.db.orders.unshift(order); this._persist(); return order; }
  async updateOrder(id, fields) {
    const o = this.db.orders.find(x => x.id === id);
    if (!o) return null;
    Object.assign(o, fields);
    this._persist();
    return o;
  }
  async listTopups() { return this.db.topups; }
  async getTopup(id) { return this.db.topups.find(t => t.id === id) || null; }
  async findTopupByTransfer(method, transferId) {
    return this.db.topups.find(t => t.method === method && t.transferId === transferId) || null;
  }
  async createTopup(t) { this.db.topups.unshift(t); this._persist(); return t; }
  async updateTopup(id, fields) {
    const t = this.db.topups.find(x => x.id === id);
    if (!t) return null;
    Object.assign(t, fields);
    this._persist();
    return t;
  }
  async getWallet(phone) { return this.db.wallets[phone] || { balance: 0, ledger: [] }; }
  async saveWallet(phone, wallet) { this.db.wallets[phone] = wallet; this._persist(); return wallet; }
  async getUserByPhone(phone) { return this.db.users.find(u => u.phone === phone) || null; }
  async createUser(u) { this.db.users.push(u); this._persist(); return u; }
  async listUsers() { return this.db.users.map(u => ({ id: u.id, name: u.name, phone: u.phone, createdAt: u.createdAt })); }
  async updateUserPassword(phone, passwordHash, salt) {
    const u = this.db.users.find(x => x.phone === phone);
    if (!u) return null;
    u.passwordHash = passwordHash; u.salt = salt;
    this._persist();
    return u;
  }
  async deleteUser(phone) {
    const i = this.db.users.findIndex(x => x.phone === phone);
    if (i < 0) return false;
    this.db.users.splice(i, 1);
    this._persist();
    return true;
  }
  // Wipe all customer/user data for a fresh start. Shop setup is kept:
  // products, delivery zones and settings are NOT touched.
  async resetUserData() {
    this.db.orders = []; this.db.topups = []; this.db.wallets = {}; this.db.users = [];
    this.db.counters = { order: 0, topup: 0 };
    this._persist();
  }
  async listWallets() {
    return Object.entries(this.db.wallets).map(([phone, w]) => ({ phone, balance: w.balance, ledger: w.ledger }));
  }
  async nextCounter(name) { this.db.counters[name] = (this.db.counters[name] || 0) + 1; this._persist(); return this.db.counters[name]; }
  async upsertCustomer() { /* JSON store keeps customer info on the order itself */ }
}

// ---------------------------------------------------------------------------
// Postgres store (used when DATABASE_URL is set)
// ---------------------------------------------------------------------------
const PG_SCHEMA = `
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, name_en TEXT NOT NULL,
  price INTEGER NOT NULL, stock INTEGER NOT NULL,
  category TEXT NOT NULL, category_en TEXT NOT NULL, image TEXT
);
CREATE TABLE IF NOT EXISTS delivery_zones (
  name TEXT PRIMARY KEY, fee INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY, recipient_name TEXT NOT NULL, recipient_phone TEXT NOT NULL,
  free_threshold INTEGER NOT NULL, other_township_fee INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, customer_name TEXT NOT NULL, phone TEXT NOT NULL,
  address TEXT NOT NULL, township TEXT NOT NULL, items JSONB NOT NULL,
  subtotal INTEGER NOT NULL, delivery_fee INTEGER NOT NULL, total INTEGER NOT NULL,
  payment_method TEXT NOT NULL, status TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS topup_requests (
  id TEXT PRIMARY KEY, sender_name TEXT NOT NULL, sender_phone TEXT NOT NULL,
  method TEXT NOT NULL, amount INTEGER NOT NULL, transfer_id TEXT NOT NULL,
  status TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS wallet_entries (
  phone TEXT PRIMARY KEY, balance INTEGER NOT NULL, ledger JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS customers (
  phone TEXT PRIMARY KEY, name TEXT, address TEXT, updated_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, salt TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL
);
CREATE TABLE IF NOT EXISTS counters (
  name TEXT PRIMARY KEY, value INTEGER NOT NULL
);
`;

function productFromRow(r) {
  return { id: r.id, name: r.name, nameEn: r.name_en, price: r.price, stock: r.stock, category: r.category, categoryEn: r.category_en, image: r.image || '' };
}
function orderFromRow(r) {
  return {
    id: r.id, customerName: r.customer_name, phone: r.phone, address: r.address,
    township: r.township, items: r.items, subtotal: r.subtotal, deliveryFee: r.delivery_fee,
    total: r.total, paymentMethod: r.payment_method, status: r.status,
    date: new Date(r.created_at).toISOString(),
  };
}
function topupFromRow(r) {
  return {
    id: r.id, senderName: r.sender_name, senderPhone: r.sender_phone, method: r.method,
    amount: r.amount, transferId: r.transfer_id, status: r.status,
    date: new Date(r.created_at).toISOString(),
  };
}
function userFromRow(r) {
  return {
    id: r.id, name: r.name, phone: r.phone,
    passwordHash: r.password_hash, salt: r.salt,
    createdAt: new Date(r.created_at).toISOString(),
  };
}

class PgStore {
  constructor(pool) { this.kind = 'postgres'; this.pool = pool; }

  async init() {
    await this.pool.query(PG_SCHEMA);
    // Migration: product photos (added 2026-11-01).
    await this.pool.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS image TEXT');
    // Seed once, when tables are empty.
    const { rows } = await this.pool.query('SELECT COUNT(*)::int AS n FROM products');
    if (rows[0].n === 0) {
      for (const p of SEED_PRODUCTS) {
        await this.pool.query(
          'INSERT INTO products (id, name, name_en, price, stock, category, category_en, image) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
          [p.id, p.name, p.nameEn, p.price, p.stock, p.category, p.categoryEn, '']);
      }
      for (const z of SEED_ZONES) {
        await this.pool.query('INSERT INTO delivery_zones (name, fee) VALUES ($1,$2)', [z.name, z.fee]);
      }
      const s = SEED_SETTINGS;
      await this.pool.query(
        'INSERT INTO settings (id, recipient_name, recipient_phone, free_threshold, other_township_fee) VALUES (1,$1,$2,$3,$4)',
        [s.recipientName, s.recipientPhone, s.freeThreshold, s.otherTownshipFee]);
      await this.pool.query("INSERT INTO counters (name, value) VALUES ('order', 0), ('topup', 0) ON CONFLICT (name) DO NOTHING");
    }
    // Make sure counter rows exist even if products were already seeded.
    await this.pool.query("INSERT INTO counters (name, value) VALUES ('order', 0), ('topup', 0) ON CONFLICT (name) DO NOTHING");
  }

  async getProducts() {
    const { rows } = await this.pool.query('SELECT * FROM products ORDER BY id');
    return rows.map(productFromRow);
  }
  async getProduct(id) {
    const { rows } = await this.pool.query('SELECT * FROM products WHERE id = $1', [id]);
    return rows.length ? productFromRow(rows[0]) : null;
  }
  async createProduct(p) {
    await this.pool.query(
      'INSERT INTO products (id, name, name_en, price, stock, category, category_en, image) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [p.id, p.name, p.nameEn, p.price, p.stock, p.category, p.categoryEn, p.image || '']);
    return p;
  }
  async updateProduct(id, fields) {
    const p = await this.getProduct(id);
    if (!p) return null;
    const next = { ...p, ...fields };
    await this.pool.query(
      'UPDATE products SET name=$2, name_en=$3, price=$4, stock=$5, category=$6, category_en=$7, image=$8 WHERE id=$1',
      [id, next.name, next.nameEn, next.price, next.stock, next.category, next.categoryEn, next.image || '']);
    return next;
  }
  async deleteProduct(id) {
    const { rowCount } = await this.pool.query('DELETE FROM products WHERE id = $1', [id]);
    return rowCount > 0;
  }
  async getZones() {
    const { rows } = await this.pool.query('SELECT * FROM delivery_zones ORDER BY name');
    return rows.map(r => ({ name: r.name, fee: r.fee }));
  }
  async updateZoneFee(name, fee) {
    const { rows } = await this.pool.query('UPDATE delivery_zones SET fee=$2 WHERE name=$1 RETURNING *', [name, fee]);
    return rows.length ? { name: rows[0].name, fee: rows[0].fee } : null;
  }
  async getSettings() {
    const { rows } = await this.pool.query('SELECT * FROM settings WHERE id = 1');
    const r = rows[0];
    return { recipientName: r.recipient_name, recipientPhone: r.recipient_phone, freeThreshold: r.free_threshold, otherTownshipFee: r.other_township_fee };
  }
  async updateSettings(fields) {
    const cur = await this.getSettings();
    const next = { ...cur, ...fields };
    await this.pool.query(
      'UPDATE settings SET recipient_name=$1, recipient_phone=$2, free_threshold=$3, other_township_fee=$4 WHERE id=1',
      [next.recipientName, next.recipientPhone, next.freeThreshold, next.otherTownshipFee]);
    return next;
  }
  async listOrders() {
    const { rows } = await this.pool.query('SELECT * FROM orders ORDER BY created_at DESC, id DESC');
    return rows.map(orderFromRow);
  }
  async getOrder(id) {
    const { rows } = await this.pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    return rows.length ? orderFromRow(rows[0]) : null;
  }
  async createOrder(o) {
    await this.pool.query(
      `INSERT INTO orders (id, customer_name, phone, address, township, items, subtotal, delivery_fee, total, payment_method, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [o.id, o.customerName, o.phone, o.address, o.township, JSON.stringify(o.items), o.subtotal, o.deliveryFee, o.total, o.paymentMethod, o.status, o.date]);
    return o;
  }
  async updateOrder(id, fields) {
    const o = await this.getOrder(id);
    if (!o) return null;
    const next = { ...o, ...fields };
    await this.pool.query('UPDATE orders SET status=$2 WHERE id=$1', [id, next.status]);
    return next;
  }
  async listTopups() {
    const { rows } = await this.pool.query('SELECT * FROM topup_requests ORDER BY created_at DESC, id DESC');
    return rows.map(topupFromRow);
  }
  async getTopup(id) {
    const { rows } = await this.pool.query('SELECT * FROM topup_requests WHERE id = $1', [id]);
    return rows.length ? topupFromRow(rows[0]) : null;
  }
  async findTopupByTransfer(method, transferId) {
    const { rows } = await this.pool.query(
      'SELECT * FROM topup_requests WHERE method = $1 AND transfer_id = $2 LIMIT 1', [method, transferId]);
    return rows.length ? topupFromRow(rows[0]) : null;
  }
  async createTopup(t) {
    await this.pool.query(
      `INSERT INTO topup_requests (id, sender_name, sender_phone, method, amount, transfer_id, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [t.id, t.senderName, t.senderPhone, t.method, t.amount, t.transferId, t.status, t.date]);
    return t;
  }
  async updateTopup(id, fields) {
    const t = await this.getTopup(id);
    if (!t) return null;
    const next = { ...t, ...fields };
    await this.pool.query('UPDATE topup_requests SET status=$2 WHERE id=$1', [id, next.status]);
    return next;
  }
  async getWallet(phone) {
    const { rows } = await this.pool.query('SELECT * FROM wallet_entries WHERE phone = $1', [phone]);
    if (!rows.length) return { balance: 0, ledger: [] };
    return { balance: rows[0].balance, ledger: rows[0].ledger };
  }
  async saveWallet(phone, wallet) {
    await this.pool.query(
      `INSERT INTO wallet_entries (phone, balance, ledger) VALUES ($1,$2,$3)
       ON CONFLICT (phone) DO UPDATE SET balance=EXCLUDED.balance, ledger=EXCLUDED.ledger`,
      [phone, wallet.balance, JSON.stringify(wallet.ledger)]);
    return wallet;
  }
  async listWallets() {
    const { rows } = await this.pool.query('SELECT * FROM wallet_entries ORDER BY phone');
    return rows.map(r => ({ phone: r.phone, balance: r.balance, ledger: r.ledger }));
  }
  async getUserByPhone(phone) {
    const { rows } = await this.pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
    return rows.length ? userFromRow(rows[0]) : null;
  }
  async createUser(u) {
    await this.pool.query(
      'INSERT INTO users (id, name, phone, password_hash, salt, created_at) VALUES ($1,$2,$3,$4,$5,$6)',
      [u.id, u.name, u.phone, u.passwordHash, u.salt, u.createdAt]);
    return u;
  }
  async listUsers() {
    const { rows } = await this.pool.query('SELECT id, name, phone, created_at FROM users ORDER BY created_at DESC');
    return rows.map(r => ({ id: r.id, name: r.name, phone: r.phone, createdAt: new Date(r.created_at).toISOString() }));
  }
  async updateUserPassword(phone, passwordHash, salt) {
    const { rows } = await this.pool.query(
      'UPDATE users SET password_hash=$2, salt=$3 WHERE phone=$1 RETURNING *', [phone, passwordHash, salt]);
    return rows.length ? userFromRow(rows[0]) : null;
  }
  async deleteUser(phone) {
    const { rowCount } = await this.pool.query('DELETE FROM users WHERE phone = $1', [phone]);
    return rowCount > 0;
  }
  // Wipe all customer/user data for a fresh start. Shop setup is kept:
  // products, delivery zones and settings are NOT touched.
  async resetUserData() {
    await this.pool.query('DELETE FROM orders');
    await this.pool.query('DELETE FROM topup_requests');
    await this.pool.query('DELETE FROM wallet_entries');
    await this.pool.query('DELETE FROM customers');
    await this.pool.query('DELETE FROM users');
    await this.pool.query('UPDATE counters SET value = 0');
  }
  async nextCounter(name) {
    const { rows } = await this.pool.query(
      'UPDATE counters SET value = value + 1 WHERE name = $1 RETURNING value', [name]);
    return rows[0].value;
  }
  async upsertCustomer(phone, name, address) {
    await this.pool.query(
      `INSERT INTO customers (phone, name, address, updated_at) VALUES ($1,$2,$3,NOW())
       ON CONFLICT (phone) DO UPDATE SET name=EXCLUDED.name, address=EXCLUDED.address, updated_at=NOW()`,
      [phone, name, address]);
  }
}

// ---------------------------------------------------------------------------
// Factory: Postgres when DATABASE_URL is set (and reachable), else JSON file.
// ---------------------------------------------------------------------------
async function createStore(poolOverride) {
  const url = process.env.DATABASE_URL;
  if (url || poolOverride) {
    // Lazy require: the app must still start when `pg` is installed
    // but DATABASE_URL is unset; only load it when Postgres is used.
    let pool = poolOverride;
    if (!pool) {
      const { Pool } = require('pg');
      pool = new Pool({
        connectionString: url,
        // Neon / Supabase free tiers require TLS.
        ssl: { rejectUnauthorized: false },
      });
    }
    const store = new PgStore(pool);
    // If DATABASE_URL is set, Postgres is the source of truth: a failed
    // init must crash loudly (Render restarts the service) rather than
    // silently falling back to the JSON file, which would split the data
    // and lose writes on the next restart.
    await store.init();
    console.log('store: postgres');
    return store;
  }
  console.log('store: json file (data/db.json)');
  return new JsonStore();
}

module.exports = { createStore, PgStore, JsonStore, SEED_PRODUCTS, SEED_ZONES, SEED_SETTINGS };
