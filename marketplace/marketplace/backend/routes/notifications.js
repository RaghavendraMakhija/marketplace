const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  const notifications = await db.notifications.find({ userId: req.user.id });
  notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const unread = notifications.filter(n => !n.isRead).length;
  res.json({ success: true, notifications: notifications.slice(0, 50), unread });
});

router.patch('/read-all', authenticate, async (req, res) => {
  await db.notifications.update({ userId: req.user.id }, { $set: { isRead: true } }, { multi: true });
  res.json({ success: true });
});

router.patch('/:id/read', authenticate, async (req, res) => {
  await db.notifications.update({ _id: req.params.id, userId: req.user.id }, { $set: { isRead: true } });
  res.json({ success: true });
});

module.exports = router;
