const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');

router.get('/', authenticate, requireRole('consumer'), async (req, res) => {
  const cartItems = await db.cart.find({ userId: req.user.id });
  const enriched = [];
  for (const c of cartItems) {
    const p = await db.products.findOne({ _id: c.productId });
    if (!p || !p.isActive) continue;
    const s = await db.sellers.findOne({ _id: p.sellerId });
    enriched.push({ id: c._id, quantity: c.quantity, product_id: p._id, name: p.name, price: p.price, mrp: p.mrp, stock: p.stock, unit: p.unit, shopName: s?.shopName || '', isActive: p.isActive, isApproved: p.isApproved });
  }
  const total = enriched.reduce((s, i) => s + i.price * i.quantity, 0);
  res.json({ success: true, items: enriched, total, count: enriched.length });
});

router.post('/', authenticate, requireRole('consumer'), async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id || quantity < 1) return res.status(400).json({ success: false, message: 'Invalid product or quantity.' });
  const product = await db.products.findOne({ _id: product_id, isActive: true, isApproved: true });
  if (!product) return res.status(404).json({ success: false, message: 'Product not available.' });
  if (product.stock < quantity) return res.status(400).json({ success: false, message: `Only ${product.stock} in stock.` });
  const existing = await db.cart.findOne({ userId: req.user.id, productId: product_id });
  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > product.stock) return res.status(400).json({ success: false, message: `Only ${product.stock} available.` });
    await db.cart.update({ _id: existing._id }, { $set: { quantity: newQty } });
  } else {
    await db.cart.insert({ _id: uuidv4(), userId: req.user.id, productId: product_id, quantity, addedAt: new Date().toISOString() });
  }
  res.json({ success: true, message: `${product.name} added to cart.` });
});

router.put('/:itemId', authenticate, requireRole('consumer'), async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ success: false, message: 'Invalid quantity.' });
  const cartItem = await db.cart.findOne({ _id: req.params.itemId, userId: req.user.id });
  if (!cartItem) return res.status(404).json({ success: false, message: 'Cart item not found.' });
  const product = await db.products.findOne({ _id: cartItem.productId });
  if (quantity > product.stock) return res.status(400).json({ success: false, message: `Only ${product.stock} in stock.` });
  await db.cart.update({ _id: req.params.itemId }, { $set: { quantity } });
  res.json({ success: true, message: 'Cart updated.' });
});

router.delete('/:itemId', authenticate, requireRole('consumer'), async (req, res) => {
  await db.cart.remove({ _id: req.params.itemId, userId: req.user.id }, {});
  res.json({ success: true, message: 'Item removed.' });
});

router.delete('/', authenticate, requireRole('consumer'), async (req, res) => {
  await db.cart.remove({ userId: req.user.id }, { multi: true });
  res.json({ success: true, message: 'Cart cleared.' });
});

module.exports = router;
