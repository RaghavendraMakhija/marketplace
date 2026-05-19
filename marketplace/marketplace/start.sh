#!/bin/bash
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║        BazaarX Marketplace               ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Start backend
echo "▶ Starting backend on port 4000..."
cd "$(dirname "$0")/backend"
npm start &
BACKEND_PID=$!

sleep 2

# Start frontend
echo "▶ Starting frontend on port 3000..."
cd "$(dirname "$0")/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers running!"
echo "   Frontend → http://localhost:3000"
echo "   Backend  → http://localhost:4000"
echo ""
echo "Press Ctrl+C to stop."
wait
