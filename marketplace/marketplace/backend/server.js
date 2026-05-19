const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const { helmetMiddleware, globalLimiter, speedLimiter, ipBlocker, payloadGuard, inputSanitizer, corsOptions } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 4000;
app.set('trust proxy', 1);

app.use(helmetMiddleware);
app.use(cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(morgan('tiny'));
app.use(ipBlocker);
app.use(globalLimiter);
app.use(speedLimiter);
app.use(payloadGuard);
app.use(inputSanitizer);

app.get('/health', (req, res) => res.json({ status: 'OK', uptime: Math.floor(process.uptime()) }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/boss', require('./routes/boss'));
app.use('/api/notifications', require('./routes/notifications'));

app.get('/api/categories', async (req, res) => {
  const db = require('./db/database');
  const categories = await db.categories.find({ isActive: true });
  res.json({ success: true, categories });
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));
app.use((err, req, res, next) => {
  console.error(err.message);
  if (err.message?.includes('CORS')) return res.status(403).json({ success: false, message: 'Cross-origin blocked.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ success: false, message: 'Invalid JSON.' });
  res.status(500).json({ success: false, message: 'Server error. Try again.' });
});

const server = app.listen(PORT, () => {
  console.log(`\n🚀 BazaarX API → http://localhost:${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health\n`);
});

process.on('SIGTERM', () => server.close(() => process.exit(0)));
process.on('uncaughtException', (err) => console.error('Uncaught:', err.message));
process.on('unhandledRejection', (r) => console.error('Rejection:', r));
module.exports = app;
