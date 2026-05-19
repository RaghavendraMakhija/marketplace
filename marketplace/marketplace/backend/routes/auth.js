const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../db/database');
const { generateToken, authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/security');

router.post('/register', authLimiter, [
  body('name').trim().isLength({ min: 2, max: 60 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).matches(/[A-Z]/).matches(/[0-9]/),
  body('role').isIn(['seller', 'consumer']),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: errors.array()[0].msg });

  const { name, email, password, role, phone, address, shopName, shopDescription } = req.body;
  try {
    const existing = await db.users.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const hash = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    await db.users.insert({
      _id: userId, name, email, password: hash, role,
      phone: phone || null, address: address || null,
      isActive: true, isVerified: true,
      loginAttempts: 0, lockedUntil: null, lastLogin: null,
      createdAt: new Date().toISOString(),
    });

    if (role === 'seller') {
      await db.sellers.insert({
        _id: uuidv4(), userId, shopName: shopName || `${name}'s Shop`,
        shopDescription: shopDescription || '', isApproved: false,
        totalSales: 0, rating: 0, createdAt: new Date().toISOString(),
      });
    }

    const boss = await db.users.findOne({ role: 'boss' });
    if (boss) {
      await db.notifications.insert({ _id: uuidv4(), userId: boss._id, title: 'New Registration', message: `${name} joined as ${role}`, type: 'info', isRead: false, createdAt: new Date().toISOString() });
    }

    const user = await db.users.findOne({ _id: userId }, { password: 0 });
    let sellerProfile = null;
    if (role === 'seller') sellerProfile = await db.sellers.findOne({ userId });
    const token = generateToken({ id: userId, role, email });
    res.status(201).json({ success: true, message: 'Account created!', token, user: { ...user, id: user._id, sellerProfile } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Registration failed.' });
  }
});

router.post('/login', authLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Invalid email or password.' });

  const { email, password } = req.body;
  try {
    const user = await db.users.findOne({ email });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid email or password.' });

    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      const mins = Math.ceil((new Date(user.lockedUntil) - new Date()) / 60000);
      return res.status(423).json({ success: false, message: `Account locked. Try again in ${mins} minute(s).` });
    }
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Account deactivated.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      const attempts = (user.loginAttempts || 0) + 1;
      const lockedUntil = attempts >= 5 ? new Date(Date.now() + 30 * 60000).toISOString() : null;
      await db.users.update({ _id: user._id }, { $set: { loginAttempts: attempts, lockedUntil } });
      const remaining = Math.max(0, 5 - attempts);
      return res.status(401).json({ success: false, message: remaining > 0 ? `Wrong password. ${remaining} attempt(s) left.` : 'Account locked for 30 minutes.' });
    }

    await db.users.update({ _id: user._id }, { $set: { loginAttempts: 0, lockedUntil: null, lastLogin: new Date().toISOString() } });

    let sellerProfile = null;
    if (user.role === 'seller') sellerProfile = await db.sellers.findOne({ userId: user._id });

    const token = generateToken({ id: user._id, role: user.role, email: user.email });
    res.json({ success: true, message: `Welcome back, ${user.name}!`, token, user: { id: user._id, name: user.name, email: user.email, role: user.role, sellerProfile } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Login failed.' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  const user = await db.users.findOne({ _id: req.user.id }, { password: 0 });
  let sellerProfile = null;
  if (user?.role === 'seller') sellerProfile = await db.sellers.findOne({ userId: user._id });
  res.json({ success: true, user: { ...user, id: user._id, sellerProfile } });
});

router.put('/me', authenticate, async (req, res) => {
  const { name, phone, address, shopName, shopDescription } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (phone) updates.phone = phone;
  if (address) updates.address = address;
  await db.users.update({ _id: req.user.id }, { $set: updates });
  if (req.user.role === 'seller') {
    const spUpdates = {};
    if (shopName) spUpdates.shopName = shopName;
    if (shopDescription) spUpdates.shopDescription = shopDescription;
    if (Object.keys(spUpdates).length) await db.sellers.update({ userId: req.user.id }, { $set: spUpdates });
  }
  res.json({ success: true, message: 'Profile updated.' });
});

router.put('/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ success: false, message: 'New password too short.' });
  const user = await db.users.findOne({ _id: req.user.id });
  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
  const hash = await bcrypt.hash(newPassword, 12);
  await db.users.update({ _id: req.user.id }, { $set: { password: hash } });
  res.json({ success: true, message: 'Password changed.' });
});

module.exports = router;
