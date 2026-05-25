#!/bin/bash

# 🚀 Junto Development Setup Script
# This script helps you start both backend and frontend servers

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo "🎉 Junto - Starting Development Environment"
echo "==========================================="
echo ""

# Check if PostgreSQL is running
echo "📦 Checking PostgreSQL..."
if ! pgrep -x "postgres" > /dev/null; then
    echo "⚠️  PostgreSQL is not running"
    echo "Starting PostgreSQL with: brew services start postgresql"
    brew services start postgresql
    sleep 2
fi
echo "✅ PostgreSQL is running"
echo ""

# Initialize backend database if not already done
if [ ! -f "$BACKEND_DIR/.db-initialized" ]; then
    echo "📊 Initializing database..."
    cd "$BACKEND_DIR"
    npm run migrate > /dev/null 2>&1
    npm run seed > /dev/null 2>&1
    touch .db-initialized
    echo "✅ Database initialized"
    cd "$PROJECT_ROOT"
else
    echo "✅ Database already initialized"
fi
echo ""

echo "🎯 Starting servers..."
echo "==========================================="
echo ""
echo "To stop servers, press Ctrl+C"
echo ""

# Start backend in background
echo "🔥 Starting Backend Server..."
echo "   Location: http://localhost:5000"
cd "$BACKEND_DIR"
npm run dev &
BACKEND_PID=$!

# Give backend time to start
sleep 3

# Start frontend
echo ""
echo "⚛️  Starting Frontend Server..."
echo "   Location: http://localhost:5173"
cd "$PROJECT_ROOT"
npm run dev &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo ""
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "✅ Servers stopped"
}

# Set trap to cleanup on exit
trap cleanup EXIT

# Keep script running
wait
