# BazaarX Marketplace — Setup Guide

## Project Structure
```
marketplace/
├── backend/        ← Node.js + Express API
│   ├── data/       ← Auto-created. All database files (.db) live here
│   ├── routes/     ← API route handlers
│   ├── middleware/ ← Auth, security, rate limiting
│   ├── db/         ← Database setup (NeDB)
│   └── server.js   ← Entry point (port 4000)
├── frontend/       ← React + Vite app
│   └── src/
│       ├── pages/
│       │   ├── auth/     ← Login/Register
│       │   ├── boss/     ← Admin panel pages
│       │   ├── seller/   ← Seller dashboard pages
│       │   ├── consumer/ ← Shop, cart, orders
│       │   └── shared/   ← Notifications, profile
│       └── ...
└── start.sh        ← Convenience startup script
```

## Prerequisites
- Node.js v16 or higher  →  https://nodejs.org
- npm (comes with Node)

## Step-by-Step Setup

### Step 1 — Install backend dependencies
```bash
cd marketplace/backend
npm install
```

### Step 2 — Install frontend dependencies
```bash
cd marketplace/frontend
npm install
```

### Step 3 — Start the backend
Open Terminal 1:
```bash
cd marketplace/backend
npm start
```
You should see:
  🚀 BazaarX API → http://localhost:4000
  ✅ Boss seeded: boss@marketplace.com / Boss@1234

### Step 4 — Start the frontend
Open Terminal 2:
```bash
cd marketplace/frontend
npm run dev
```
You should see:
  Local: http://localhost:3000/

### Step 5 — Open the app
Go to:  http://localhost:3000

---

## Default Login Credentials

| Role     | Email                    | Password    |
|----------|--------------------------|-------------|
| Boss     | boss@marketplace.com     | Boss@1234   |
| Seller   | Register on login page   | Your choice |
| Consumer | Register on login page   | Your choice |

---

## How Each Role Works

### 👑 BOSS (Admin)
1. Log in with boss@marketplace.com / Boss@1234
2. Dashboard shows all platform stats
3. Go to Sellers → Approve pending sellers
4. Go to Products → Approve pending products
5. Go to Orders → Confirm/cancel orders
6. Go to Users → Activate/deactivate accounts
7. Go to Security → Block malicious IPs

### 🏪 SELLER
1. Register as "Seller" on login page
2. Wait for Boss to approve your shop
3. After approval: go to "Add Product"
4. Fill product details, submit for approval
5. Wait for Boss to approve the product
6. Once live, view incoming orders
7. Update order status: Packed → Shipped → Delivered

### 🛍️ CONSUMER (Buyer)
1. Register as "Buyer" on login page
2. Browse shop, search, filter by category/price
3. Click product → Add to Cart
4. Go to Cart → Proceed to Checkout
5. Enter delivery address, choose COD or Online
6. Place Order
7. Track order in "My Orders"
8. Can cancel if pending/confirmed
9. Can request refund after delivery

---

## Environment Variables (Optional)

Create `backend/.env` to customize:
```
PORT=4000
JWT_SECRET=your_very_long_random_secret_here
ALLOWED_ORIGINS=http://localhost:3000
NODE_ENV=production
```

---

## For Production Deployment

### On a VPS/Server:
1. Install Node.js
2. Clone/copy this folder
3. Run `npm install` in both backend/ and frontend/
4. Build frontend: `cd frontend && npm run build`
5. Serve frontend/dist with nginx
6. Run backend with PM2:
   ```bash
   npm install -g pm2
   cd backend
   pm2 start server.js --name bazaarx-api
   pm2 save
   ```

### For Mobile App (React Native / Expo):
- The backend API is already REST-based
- Change all API calls to point to your server IP
- Use the same endpoints — the backend serves both web and mobile

---

## API Endpoints Summary

| Method | Endpoint                        | Who    |
|--------|---------------------------------|--------|
| POST   | /api/auth/register              | All    |
| POST   | /api/auth/login                 | All    |
| GET    | /api/products                   | Public |
| GET    | /api/products/:id               | Public |
| POST   | /api/products                   | Seller |
| GET    | /api/products/seller/mine       | Seller |
| GET    | /api/cart                       | Consumer |
| POST   | /api/cart                       | Consumer |
| POST   | /api/orders                     | Consumer |
| GET    | /api/orders/mine                | Consumer |
| GET    | /api/orders/seller              | Seller |
| GET    | /api/orders/all                 | Boss   |
| GET    | /api/boss/dashboard             | Boss   |
| GET    | /api/boss/sellers/pending       | Boss   |
| POST   | /api/boss/sellers/:id/approve   | Boss   |
| GET    | /api/boss/products/pending      | Boss   |
| POST   | /api/boss/products/:id/approve  | Boss   |
| GET    | /api/notifications              | All    |

---

## Security Features Built-in
- JWT authentication (7-day tokens)
- Account lockout after 5 failed logins
- Rate limiting (200 req/15min globally, 20 req/15min for login)
- Speed throttling after 80 requests
- IP blocking (Boss can block IPs from Security panel)
- Input sanitization (XSS + SQL injection patterns)
- Payload size limiting (2MB max)
- Helmet security headers
- CORS protection
