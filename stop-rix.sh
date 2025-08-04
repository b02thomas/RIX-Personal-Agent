#!/bin/bash
# stop-rix.sh
# Complete RIX shutdown script for local development
# Stops all services gracefully and cleans up resources
# RELEVANT FILES: start-rix.sh, docker-compose.yml

set -e

echo "🛑 Stopping RIX Personal Agent System..."
echo "======================================="

# Navigate to project directory
cd "$(dirname "$0")"

# Stop Frontend
if [ -f .frontend.pid ]; then
    FRONTEND_PID=$(cat .frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "🌐 Stopping Frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        # Wait for graceful shutdown
        timeout=10
        while [ $timeout -gt 0 ] && kill -0 $FRONTEND_PID 2>/dev/null; do
            sleep 1
            timeout=$((timeout - 1))
        done
        if kill -0 $FRONTEND_PID 2>/dev/null; then
            echo "⚠️  Force killing Frontend..."
            kill -9 $FRONTEND_PID
        fi
        echo "✅ Frontend stopped"
    else
        echo "ℹ️  Frontend was not running"
    fi
    rm -f .frontend.pid
else
    echo "ℹ️  No Frontend PID file found"
fi

# Stop Main Agent
if [ -f .main-agent.pid ]; then
    MAIN_AGENT_PID=$(cat .main-agent.pid)
    if kill -0 $MAIN_AGENT_PID 2>/dev/null; then
        echo "🤖 Stopping Main Agent (PID: $MAIN_AGENT_PID)..."
        kill $MAIN_AGENT_PID
        # Wait for graceful shutdown
        timeout=10
        while [ $timeout -gt 0 ] && kill -0 $MAIN_AGENT_PID 2>/dev/null; do
            sleep 1
            timeout=$((timeout - 1))
        done
        if kill -0 $MAIN_AGENT_PID 2>/dev/null; then
            echo "⚠️  Force killing Main Agent..."
            kill -9 $MAIN_AGENT_PID
        fi
        echo "✅ Main Agent stopped"
    else
        echo "ℹ️  Main Agent was not running"
    fi
    rm -f .main-agent.pid
else
    echo "ℹ️  No Main Agent PID file found"
fi

# Stop database
echo "📦 Stopping PostgreSQL database..."
if docker ps | grep -q rix-postgres; then
    docker-compose down
    echo "✅ Database stopped"
else
    echo "ℹ️  Database was not running"
fi

# Kill any remaining processes on ports 3000 and 8001
echo "🧹 Cleaning up any remaining processes..."
for port in 3000 8001; do
    PIDS=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
        echo "🔧 Killing processes on port $port: $PIDS"
        kill -9 $PIDS 2>/dev/null || true
    fi
done

# Clean up log files if they exist
if [ -f main-agent.log ]; then
    rm main-agent.log
    echo "🗑️  Removed main-agent.log"
fi

if [ -f frontend.log ]; then
    rm frontend.log
    echo "🗑️  Removed frontend.log"
fi

echo ""
echo "✅ All RIX services have been stopped successfully!"
echo "🔄 To start again, run: ./start-rix.sh"