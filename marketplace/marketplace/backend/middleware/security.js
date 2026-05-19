const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const helmet = require('helmet');
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

const helmetMiddleware = helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false });

const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many requests. Please slow down.' }, skip: (req) => req.path === '/health' });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' } });
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 120, message: { success: false, message: 'API rate limit exceeded.' } });
const speedLimiter = slowDown({ windowMs: 15 * 60 * 1000, delayAfter: 80, delayMs: (used) => (used - 80) * 100 });

async function ipBlocker(req, res, next) {
  const ip = getClientIp(req);
  try {
    const blocked = await db.blockedIps.findOne({ ip });
    if (blocked && (!blocked.expiresAt || new Date(blocked.expiresAt) > new Date())) {
      return res.status(403).json({ success: false, message: 'Your IP has been blocked.' });
    }
  } catch {}
  next();
}

function payloadGuard(req, res, next) {
  const cl = parseInt(req.headers['content-length'] || 0);
  if (cl > 10 * 1024 * 1024) return res.status(413).json({ success: false, message: 'Payload too large.' });
  next();
}

const DANGEROUS = [/<script[\s\S]*?>/gi, /javascript:/gi, /union\s+select/gi, /drop\s+table/gi];
function inputSanitizer(req, res, next) {
  const check = (val) => typeof val === 'string' && DANGEROUS.some(p => { p.lastIndex = 0; return p.test(val); });
  const scan = (obj) => obj && Object.values(obj).some(v => typeof v === 'object' ? scan(v) : check(v));
  if (scan(req.body) || scan(req.query)) return res.status(400).json({ success: false, message: 'Malicious input detected.' });
  next();
}

function corsOptions(req, callback) {
  const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173').split(',');
  const origin = req.headers.origin;
  if (!origin || allowed.includes(origin) || allowed.includes('*')) {
    callback(null, { origin: true, credentials: true, methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'] });
  } else { callback(new Error('CORS: Origin not allowed')); }
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '0.0.0.0';
}

module.exports = { helmetMiddleware, globalLimiter, authLimiter, apiLimiter, speedLimiter, ipBlocker, payloadGuard, inputSanitizer, corsOptions, getClientIp };
