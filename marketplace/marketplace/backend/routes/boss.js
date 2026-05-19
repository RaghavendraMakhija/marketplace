const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate, requireRole('boss'));

router.get('/dashboard', async (req, res) => {
  const [totalUsers, sellers, consumers, pendingSellers, allProducts, pendingProducts, allOrders, pendingOrders] = await Promise.all([
    db.users.count({ role: { $ne: 'boss' } }),
    db.users.count({ role: 'seller' }),
    db.users.count({ role: 'consumer' }),
    db.sellers.count({ isApproved: false }),
    db.products.count({ isActive: true }),
    db.products.count({ isApproved: false, isActive: true }),
    db.orders.count({}),
    db.orders.count({ status: 'pending' }),
  ]);
  const deliveredOrders = await db.orders.find({ status: 'delivered' });
  const totalRevenue = deliveredOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = await db.orders.count({ createdAt: { $gte: today } });
  res.json({ success: true, stats: { totalUsers, totalSellers: sellers, totalConsumers: consumers, pendingSellerApprovals: pendingSellers, totalProducts: allProducts, pendingProducts, totalOrders: allOrders, pendingOrders, totalRevenue, todayOrders } });
});

router.get('/users', async (req, res) => {
  const { role, search } = req.query;
  let users = await db.users.find({ role: { $ne: 'boss' } }, { password: 0 });
  if (role) users = users.filter(u => u.role === role);
  if (search) { const s = search.toLowerCase(); users = users.filter(u => u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s)); }
  users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  users = users.map(u => ({ ...u, id: u._id }));
  res.json({ success: true, users, total: users.length });
});

router.patch('/users/:id/toggle', async (req, res) => {
  const user = await db.users.findOne({ _id: req.params.id });
  if (!user || user.role === 'boss') return res.status(404).json({ success: false, message: 'User not found.' });
  await db.users.update({ _id: req.params.id }, { $set: { isActive: !user.isActive } });
  res.json({ success: true, message: `User ${user.isActive ? 'deactivated' : 'activated'}.` });
});

router.get('/sellers/pending', async (req, res) => {
  const sellers = await db.sellers.find({ isApproved: false });
  for (const s of sellers) {
    const u = await db.users.findOne({ _id: s.userId }, { password: 0 });
    s.userName = u?.name; s.userEmail = u?.email; s.userPhone = u?.phone; s.id = s._id;
  }
  res.json({ success: true, sellers });
});

router.post('/sellers/:id/approve', async (req, res) => {
  await db.sellers.update({ _id: req.params.id }, { $set: { isApproved: true, approvedBy: req.user.id, approvedAt: new Date().toISOString() } });
  const seller = await db.sellers.findOne({ _id: req.params.id });
  if (seller) await db.notifications.insert({ _id: uuidv4(), userId: seller.userId, title: '🎉 Shop Approved!', message: `Your shop "${seller.shopName}" is now live!`, type: 'success', isRead: false, createdAt: new Date().toISOString() });
  res.json({ success: true, message: 'Seller approved.' });
});

router.post('/sellers/:id/reject', async (req, res) => {
  const seller = await db.sellers.findOne({ _id: req.params.id });
  if (seller) {
    await db.users.update({ _id: seller.userId }, { $set: { isActive: false } });
    await db.notifications.insert({ _id: uuidv4(), userId: seller.userId, title: 'Application Rejected', message: `Your shop "${seller.shopName}" was not approved. Contact support.`, type: 'warning', isRead: false, createdAt: new Date().toISOString() });
  }
  res.json({ success: true, message: 'Seller rejected.' });
});

router.get('/products/pending', async (req, res) => {
  const products = await db.products.find({ isApproved: false, isActive: true });
  for (const p of products) {
    const s = await db.sellers.findOne({ _id: p.sellerId });
    const u = s ? await db.users.findOne({ _id: s.userId }, { password: 0 }) : null;
    const c = await db.categories.findOne({ _id: p.categoryId });
    p.shopName = s?.shopName; p.sellerName = u?.name; p.categoryName = c?.name; p.id = p._id;
  }
  res.json({ success: true, products });
});

router.post('/products/:id/approve', async (req, res) => {
  await db.products.update({ _id: req.params.id }, { $set: { isApproved: true, approvedBy: req.user.id } });
  const product = await db.products.findOne({ _id: req.params.id });
  const seller = product ? await db.sellers.findOne({ _id: product.sellerId }) : null;
  if (seller) await db.notifications.insert({ _id: uuidv4(), userId: seller.userId, title: 'Product Approved!', message: `"${product.name}" is now live on the store.`, type: 'success', isRead: false, createdAt: new Date().toISOString() });
  res.json({ success: true, message: 'Product approved.' });
});

router.post('/products/:id/reject', async (req, res) => {
  const { reason } = req.body;
  await db.products.update({ _id: req.params.id }, { $set: { isActive: false } });
  const product = await db.products.findOne({ _id: req.params.id });
  const seller = product ? await db.sellers.findOne({ _id: product.sellerId }) : null;
  if (seller) await db.notifications.insert({ _id: uuidv4(), userId: seller.userId, title: 'Product Rejected', message: `"${product?.name}" was rejected. Reason: ${reason || 'Policy violation.'}`, type: 'warning', isRead: false, createdAt: new Date().toISOString() });
  res.json({ success: true, message: 'Product rejected.' });
});

router.get('/categories', async (req, res) => {
  const categories = await db.categories.find({});
  res.json({ success: true, categories });
});

router.post('/categories', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name required.' });
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  await db.categories.insert({ _id: uuidv4(), name, slug, isActive: true });
  res.status(201).json({ success: true, message: 'Category created.' });
});

router.post('/block-ip', async (req, res) => {
  const { ip, reason, hours } = req.body;
  if (!ip) return res.status(400).json({ success: false, message: 'IP required.' });
  const expiresAt = hours ? new Date(Date.now() + hours * 3600000).toISOString() : null;
  await db.blockedIps.update({ ip }, { ip, reason: reason || 'Manual block', expiresAt, blockedAt: new Date().toISOString() }, { upsert: true });
  res.json({ success: true, message: `IP ${ip} blocked.` });
});

router.delete('/block-ip/:ip', async (req, res) => {
  await db.blockedIps.remove({ ip: req.params.ip }, {});
  res.json({ success: true, message: 'IP unblocked.' });
});

router.get('/blocked-ips', async (req, res) => {
  const ips = await db.blockedIps.find({});
  res.json({ success: true, ips });
});

module.exports = router;
