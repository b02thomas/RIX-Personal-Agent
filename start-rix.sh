#!/bin/bash
# start-rix.sh
# Complete RIX startup script for local development
# Starts all services in the correct order and provides access URLs
# RELEVANT FILES: docker-compose.yml, RIX/.env.local, main-agent/.env

set -e

echo "🚀 Starting RIX Personal Agent System..."
echo "======================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Navigate to project directory
cd "$(dirname "$0")"

echo "📦 Starting PostgreSQL with pgvector..."
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
timeout=30
while [ $timeout -gt 0 ]; do
    if docker exec rix-postgres pg_isready -U rix_user -d rix_personal_agent > /dev/null 2>&1; then
        echo "✅ Database is ready!"
        break
    fi
    sleep 1
    timeout=$((timeout - 1))
done

if [ $timeout -eq 0 ]; then
    echo "❌ Database failed to start within 30 seconds"
    exit 1
fi

# Start Main Agent in background
echo "🤖 Starting Main Agent (FastAPI)..."
cd RIX/main-agent
source venv/bin/activate
python3 main.py > ../../main-agent.log 2>&1 &
MAIN_AGENT_PID=$!
cd ../..

# Wait for Main Agent to be ready
echo "⏳ Waiting for Main Agent to be ready..."
timeout=30
while [ $timeout -gt 0 ]; do
    if curl -s http://localhost:8001/health/ > /dev/null 2>&1; then
        echo "✅ Main Agent is ready!"
        break
    fi
    sleep 1
    timeout=$((timeout - 1))
done

if [ $timeout -eq 0 ]; then
    echo "❌ Main Agent failed to start within 30 seconds"
    kill $MAIN_AGENT_PID 2>/dev/null
    exit 1
fi

# Start Frontend
echo "🌐 Starting Frontend (Next.js)..."
cd RIX
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for Frontend to be ready
echo "⏳ Waiting for Frontend to be ready..."
timeout=30
while [ $timeout -gt 0 ]; do
    if curl -s http://localhost:3000/ > /dev/null 2>&1; then
        echo "✅ Frontend is ready!"
        break
    fi
    sleep 1
    timeout=$((timeout - 1))
done

if [ $timeout -eq 0 ]; then
    echo "❌ Frontend failed to start within 30 seconds"
    kill $MAIN_AGENT_PID $FRONTEND_PID 2>/dev/null
    exit 1
fi

# Final health checks
echo ""
echo "🔍 Running health checks..."
echo "======================================="

# Check database
DB_STATUS=$(docker exec rix-postgres pg_isready -U rix_user -d rix_personal_agent 2>/dev/null && echo "✅ Healthy" || echo "❌ Unhealthy")
echo "Database: $DB_STATUS"

# Check Main Agent
AGENT_STATUS=$(curl -s http://localhost:8001/health/ | grep -q '"status":"healthy"' && echo "✅ Healthy" || echo "❌ Unhealthy")
echo "Main Agent: $AGENT_STATUS"

# Check Frontend
FRONTEND_STATUS=$(curl -s -w "%{http_code}" http://localhost:3000/ | tail -1 | grep -q "200" && echo "✅ Healthy" || echo "❌ Unhealthy")
echo "Frontend: $FRONTEND_STATUS"

echo ""
echo "🎉 RIX Personal Agent is now running!"
echo "======================================="
echo "📱 Frontend: http://localhost:3000"
echo "🤖 Main Agent API: http://localhost:8001"
echo "📋 API Documentation: http://localhost:8001/docs"
echo "🗄️  Database: localhost:5432 (rix_personal_agent)"
echo ""
echo "🔐 Login with: admin@rix.com / admin123"
echo ""
echo "📝 Process IDs:"
echo "   Main Agent: $MAIN_AGENT_PID"
echo "   Frontend: $FRONTEND_PID"
echo ""
echo "📄 Logs available at:"
echo "   Main Agent: ./main-agent.log"
echo "   Frontend: ./frontend.log"
echo ""
echo "🛑 To stop all services, run: ./stop-rix.sh"
echo ""

# Save PIDs for cleanup script
echo "$MAIN_AGENT_PID" > .main-agent.pid
echo "$FRONTEND_PID" > .frontend.pid

echo "✅ All services started successfully!"