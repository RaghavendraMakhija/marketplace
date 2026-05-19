const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');

// Public product listing
router.get('/', async (req, res) => {
  try {
    const { search, category, minPrice, maxPrice, sort = 'createdAt', page = 1, limit = 20 } = req.query;
    let query = { isActive: true, isApproved: true, stock: { $gt: 0 } };
    if (category) query.categoryId = category;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    let products = await db.products.find(query);

    if (search) {
      const s = search.toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(s) || (p.description || '').toLowerCase().includes(s));
    }

    // Sort
    if (sort === 'price_asc') products.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') products.sort((a, b) => b.price - a.price);
    else products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = products.length;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    products = products.slice(offset, offset + parseInt(limit));

    // Enrich with seller info
    for (const p of products) {
      const seller = await db.sellers.findOne({ _id: p.sellerId });
      const cat = await db.categories.findOne({ _id: p.categoryId });
      const reviews = await db.reviews.find({ productId: p._id });
      p.shopName = seller?.shopName || '';
      p.categoryName = cat?.name || '';
      p.avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
      p.reviewCount = reviews.length;
      p.id = p._id;
    }

    res.json({ success: true, products, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Failed to load products.' }); }
});

// Seller's own products — MUST be before /:id
router.get('/seller/mine', authenticate, requireRole('seller'), async (req, res) => {
  const seller = await db.sellers.findOne({ userId: req.user.id });
  if (!seller) return res.status(404).json({ success: false, message: 'Seller profile not found.' });
  const products = await db.products.find({ sellerId: seller._id, isActive: true });
  for (const p of products) {
    const cat = await db.categories.findOne({ _id: p.categoryId });
    const reviews = await db.reviews.find({ productId: p._id });
    p.categoryName = cat?.name || '';
    p.avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    p.reviewCount = reviews.length;
    p.id = p._id;
  }
  res.json({ success: true, products });
});

// Single product
router.get('/:id', async (req, res) => {
  try {
    const product = await db.products.findOne({ _id: req.params.id, isActive: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    const seller = await db.sellers.findOne({ _id: product.sellerId });
    const sellerUser = seller ? await db.users.findOne({ _id: seller.userId }, { password: 0 }) : null;
    const cat = await db.categories.findOne({ _id: product.categoryId });
    const reviews = await db.reviews.find({ productId: product._id });
    for (const r of reviews) {
      const u = await db.users.findOne({ _id: r.userId }, { password: 0 });
      r.reviewerName = u?.name || 'Anonymous';
    }
    product.shopName = seller?.shopName || '';
    product.sellerName = sellerUser?.name || '';
    product.sellerRating = seller?.rating || 0;
    product.categoryName = cat?.name || '';
    product.avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    product.reviewCount = reviews.length;
    product.reviews = reviews;
    product.id = product._id;
    res.json({ success: true, product });
  } catch (err) { res.status(500).json({ success: false, message: 'Error loading product.' }); }
});

// Create product
router.post('/', authenticate, requireRole('seller'), [
  body('name').trim().isLength({ min: 3, max: 150 }),
  body('price').isFloat({ min: 0 }),
  body('stock').isInt({ min: 0 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

  const seller = await db.sellers.findOne({ userId: req.user.id });
  if (!seller) return res.status(403).json({ success: false, message: 'Seller profile not found.' });
  if (!seller.isApproved) return res.status(403).json({ success: false, message: 'Your account is pending approval.' });

  const { name, description, price, mrp, stock, unit, categoryId, tags } = req.body;
  const id = uuidv4();
  await db.products.insert({
    _id: id, sellerId: seller._id, categoryId: categoryId || null,
    name, description: description || '', price: parseFloat(price),
    mrp: mrp ? parseFloat(mrp) : null, stock: parseInt(stock),
    unit: unit || 'piece', tags: tags || [], isActive: true, isApproved: false,
    views: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  const boss = await db.users.findOne({ role: 'boss' });
  if (boss) await db.notifications.insert({ _id: uuidv4(), userId: boss._id, title: 'New Product Pending', message: `"${name}" by ${seller.shopName} needs approval`, type: 'action', isRead: false, createdAt: new Date().toISOString() });

  res.status(201).json({ success: true, message: 'Product submitted for approval.', productId: id });
});

// Update product
router.put('/:id', authenticate, requireRole('seller'), async (req, res) => {
  const seller = await db.sellers.findOne({ userId: req.user.id });
  const product = await db.products.findOne({ _id: req.params.id, sellerId: seller?._id });
  if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

  const { name, description, price, mrp, stock, unit, categoryId } = req.body;
  const updates = { isApproved: false, updatedAt: new Date().toISOString() };
  if (name) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (price) updates.price = parseFloat(price);
  if (mrp) updates.mrp = parseFloat(mrp);
  if (stock !== undefined) updates.stock = parseInt(stock);
  if (unit) updates.unit = unit;
  if (categoryId) updates.categoryId = categoryId;
  await db.products.update({ _id: req.params.id }, { $set: updates });
  res.json({ success: true, message: 'Product updated. Awaiting re-approval.' });
});

// Delete product
router.delete('/:id', authenticate, requireRole('seller', 'boss'), async (req, res) => {
  if (req.user.role === 'seller') {
    const seller = await db.sellers.findOne({ userId: req.user.id });
    await db.products.update({ _id: req.params.id, sellerId: seller?._id }, { $set: { isActive: false } });
  } else {
    await db.products.update({ _id: req.params.id }, { $set: { isActive: false } });
  }
  res.json({ success: true, message: 'Product removed.' });
});

// Add review
router.post('/:id/reviews', authenticate, requireRole('consumer'), [
  body('rating').isInt({ min: 1, max: 5 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Rating 1-5 required.' });
  const existing = await db.reviews.findOne({ productId: req.params.id, userId: req.user.id });
  if (existing) return res.status(409).json({ success: false, message: 'Already reviewed.' });

  const { rating, comment } = req.body;
  const purchase = await db.orderItems.findOne({ productId: req.params.id, consumerId: req.user.id });
  await db.reviews.insert({ _id: uuidv4(), productId: req.params.id, userId: req.user.id, rating: parseInt(rating), comment: comment || null, isVerifiedPurchase: !!purchase, createdAt: new Date().toISOString() });
  res.status(201).json({ success: true, message: 'Review added.' });
});

module.exports = router;
