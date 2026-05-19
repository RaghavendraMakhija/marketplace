const Datastore = require('nedb-promises');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = {
  users:         Datastore.create({ filename: path.join(DATA_DIR, 'users.db'),         autoload: true }),
  sellers:       Datastore.create({ filename: path.join(DATA_DIR, 'sellers.db'),       autoload: true }),
  products:      Datastore.create({ filename: path.join(DATA_DIR, 'products.db'),      autoload: true }),
  categories:    Datastore.create({ filename: path.join(DATA_DIR, 'categories.db'),    autoload: true }),
  orders:        Datastore.create({ filename: path.join(DATA_DIR, 'orders.db'),        autoload: true }),
  orderItems:    Datastore.create({ filename: path.join(DATA_DIR, 'order_items.db'),   autoload: true }),
  cart:          Datastore.create({ filename: path.join(DATA_DIR, 'cart.db'),          autoload: true }),
  reviews:       Datastore.create({ filename: path.join(DATA_DIR, 'reviews.db'),       autoload: true }),
  notifications: Datastore.create({ filename: path.join(DATA_DIR, 'notifications.db'), autoload: true }),
  auditLog:      Datastore.create({ filename: path.join(DATA_DIR, 'audit_log.db'),     autoload: true }),
  blockedIps:    Datastore.create({ filename: path.join(DATA_DIR, 'blocked_ips.db'),   autoload: true }),
};

db.users.ensureIndex({ fieldName: 'email', unique: true });
db.sellers.ensureIndex({ fieldName: 'userId', unique: true });
db.cart.ensureIndex({ fieldName: 'userId' });
db.notifications.ensureIndex({ fieldName: 'userId' });

async function seedData() {
  const catCount = await db.categories.count({});
  if (catCount === 0) {
    const cats = [
      { _id: 'cat1', name: 'Electronics',    slug: 'electronics',  isActive: true },
      { _id: 'cat2', name: 'Clothing',       slug: 'clothing',     isActive: true },
      { _id: 'cat3', name: 'Home & Kitchen', slug: 'home-kitchen', isActive: true },
      { _id: 'cat4', name: 'Books',          slug: 'books',        isActive: true },
      { _id: 'cat5', name: 'Sports',         slug: 'sports',       isActive: true },
      { _id: 'cat6', name: 'Beauty',         slug: 'beauty',       isActive: true },
      { _id: 'cat7', name: 'Toys',           slug: 'toys',         isActive: true },
      { _id: 'cat8', name: 'Grocery',        slug: 'grocery',      isActive: true },
    ];
    for (const c of cats) await db.categories.insert(c);
    console.log('✅ Categories seeded');
  }
  const boss = await db.users.findOne({ role: 'boss' });
  if (!boss) {
    const hash = await bcrypt.hash('Boss@1234', 12);
    await db.users.insert({
      _id: uuidv4(), name: 'Platform Admin', email: 'boss@marketplace.com',
      password: hash, role: 'boss', isActive: true, isVerified: true,
      loginAttempts: 0, lockedUntil: null, lastLogin: null,
      createdAt: new Date().toISOString(),
    });
    console.log('✅ Boss seeded: boss@marketplace.com / Boss@1234');
  }
}
seedData().catch(console.error);
module.exports = db;
