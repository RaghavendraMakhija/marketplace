const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../db/database');
const { authenticate, requireRole } = require('../middleware/auth');

// Place order (consumer)
router.post('/', authenticate, requireRole('consumer'), [
  body('items').isArray({ min: 1 }),
  body('shipping_address').trim().isLength({ min: 10 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });
  const { items, shipping_address, payment_method = 'cod', notes } = req.body;
  try {
    const enriched = [];
    let total = 0;
    for (const item of items) {
      const product = await db.products.findOne({ _id: item.product_id, isActive: true, isApproved: true });
      if (!product) return res.status(400).json({ success: false, message: `Product not found.` });
      if (product.stock < item.quantity) return res.status(400).json({ success: false, message: `Not enough stock for: ${product.name}` });
      total += product.price * item.quantity;
      enriched.push({ product, quantity: item.quantity });
    }
    const orderId = uuidv4();
    await db.orders.insert({ _id: orderId, consumerId: req.user.id, status: 'pending', totalAmount: total, shippingAddress: shipping_address, paymentMethod: payment_method, paymentStatus: 'pending', notes: notes || null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    for (const { product, quantity } of enriched) {
      await db.orderItems.insert({ _id: uuidv4(), orderId, productId: product._id, sellerId: product.sellerId, consumerId: req.user.id, quantity, price: product.price, status: 'pending', createdAt: new Date().toISOString() });
      await db.products.update({ _id: product._id }, { $set: { stock: product.stock - quantity } });
      const seller = await db.sellers.findOne({ _id: product.sellerId });
      const sellerUser = seller ? await db.users.findOne({ _id: seller.userId }) : null;
      if (sellerUser) await db.notifications.insert({ _id: uuidv4(), userId: sellerUser._id, title: 'New Order!', message: `New order for "${product.name}" x${quantity}`, type: 'success', isRead: false, createdAt: new Date().toISOString() });
    }
    await db.cart.remove({ userId: req.user.id }, { multi: true });
    res.status(201).json({ success: true, message: 'Order placed!', orderId });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Order failed.' }); }
});

// Consumer: my orders
router.get('/mine', authenticate, requireRole('consumer'), async (req, res) => {
  const orders = await db.orders.find({ consumerId: req.user.id }).catch(() => []);
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  for (const o of orders) {
    const items = await db.orderItems.find({ orderId: o._id });
    for (const i of items) {
      const p = await db.products.findOne({ _id: i.productId });
      const s = await db.sellers.findOne({ _id: i.sellerId });
      i.productName = p?.name || 'Product'; i.shopName = s?.shopName || '';
    }
    o.items = items; o.id = o._id;
  }
  res.json({ success: true, orders });
});

// Seller: orders for my products
router.get('/seller', authenticate, requireRole('seller'), async (req, res) => {
  const seller = await db.sellers.findOne({ userId: req.user.id });
  if (!seller) return res.status(404).json({ success: false, message: 'Seller profile not found.' });
  const items = await db.orderItems.find({ sellerId: seller._id });
  items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  for (const i of items) {
    const o = await db.orders.findOne({ _id: i.orderId });
    const p = await db.products.findOne({ _id: i.productId });
    const u = await db.users.findOne({ _id: o?.consumerId }, { password: 0 });
    i.orderDate = o?.createdAt; i.shippingAddress = o?.shippingAddress;
    i.paymentMethod = o?.paymentMethod; i.orderStatus = o?.status;
    i.consumerName = u?.name; i.consumerPhone = u?.phone;
    i.productName = p?.name; i.id = i._id;
  }
  res.json({ success: true, orderItems: items });
});

// Boss: all orders
router.get('/all', authenticate, requireRole('boss'), async (req, res) => {
  const { status } = req.query;
  let query = {};
  if (status) query.status = status;
  const orders = await db.orders.find(query);
  orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  for (const o of orders) {
    const u = await db.users.findOne({ _id: o.consumerId }, { password: 0 });
    const items = await db.orderItems.find({ orderId: o._id });
    o.consumerName = u?.name; o.consumerEmail = u?.email;
    o.itemCount = items.length; o.id = o._id;
  }
  res.json({ success: true, orders });
});

// Single order
router.get('/:id', authenticate, async (req, res) => {
  const order = await db.orders.findOne({ _id: req.params.id });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
  if (req.user.role === 'consumer' && order.consumerId !== req.user.id) return res.status(403).json({ success: false, message: 'Not your order.' });
  const items = await db.orderItems.find({ orderId: order._id });
  for (const i of items) {
    const p = await db.products.findOne({ _id: i.productId });
    const s = await db.sellers.findOne({ _id: i.sellerId });
    i.productName = p?.name; i.shopName = s?.shopName;
  }
  res.json({ success: true, order: { ...order, id: order._id, items } });
});

// Update order status
router.patch('/:id/status', authenticate, [
  body('status').isIn(['confirmed','packed','shipped','delivered','cancelled','refund_requested','refunded'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid status.' });
  const { status } = req.body;
  const order = await db.orders.findOne({ _id: req.params.id });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
  const allowed = { boss: ['confirmed','cancelled','refunded'], seller: ['packed','shipped','delivered'], consumer: ['cancelled','refund_requested'] };
  if (!allowed[req.user.role]?.includes(status)) return res.status(403).json({ success: false, message: 'You cannot set this status.' });
  await db.orders.update({ _id: req.params.id }, { $set: { status, updatedAt: new Date().toISOString() } });
  const msgs = { confirmed: 'Your order is confirmed!', packed: 'Order is packed.', shipped: 'Order is on the way!', delivered: 'Order delivered!', cancelled: 'Order cancelled.', refunded: 'Refund processed.' };
  if (msgs[status]) await db.notifications.insert({ _id: uuidv4(), userId: order.consumerId, title: 'Order Update', message: `Order #${order._id.slice(0,8)}: ${msgs[status]}`, type: 'info', isRead: false, createdAt: new Date().toISOString() });
  res.json({ success: true, message: 'Status updated.' });
});

module.exports = router;
