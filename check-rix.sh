#!/bin/bash
# check-rix.sh
# Comprehensive health check script for RIX Personal Agent
# Tests all services and provides detailed status information
# RELEVANT FILES: start-rix.sh, stop-rix.sh, docker-compose.yml

set -e

echo "🔍 RIX Personal Agent Health Check"
echo "======================================="

# Navigate to project directory
cd "$(dirname "$0")"

# Initialize status variables
OVERALL_STATUS="✅ Healthy"
SERVICES_COUNT=0
HEALTHY_COUNT=0

# Function to check service health
check_service() {
    local service_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    SERVICES_COUNT=$((SERVICES_COUNT + 1))
    
    echo -n "🔹 $service_name: "
    
    if eval "$test_command" >/dev/null 2>&1; then
        if [ -n "$expected_result" ]; then
            if eval "$test_command" | grep -q "$expected_result"; then
                echo "✅ Healthy"
                HEALTHY_COUNT=$((HEALTHY_COUNT + 1))
                return 0
            else
                echo "⚠️  Running but unhealthy"
                OVERALL_STATUS="⚠️  Degraded"
                return 1
            fi
        else
            echo "✅ Running"
            HEALTHY_COUNT=$((HEALTHY_COUNT + 1))
            return 0
        fi
    else
        echo "❌ Not running"
        OVERALL_STATUS="❌ Unhealthy"
        return 1
    fi
}

# Check Docker
echo "🐳 Docker Services:"
check_service "Docker Daemon" "docker info" ""

# Check Database
if docker ps | grep -q rix-postgres; then
    check_service "PostgreSQL Database" "docker exec rix-postgres pg_isready -U rix_user -d rix_personal_agent" "accepting connections"
    
    # Additional database checks
    echo "   📊 Database Details:"
    DB_SIZE=$(docker exec rix-postgres psql -U rix_user -d rix_personal_agent -t -c "SELECT pg_size_pretty(pg_database_size('rix_personal_agent'));" 2>/dev/null | xargs || echo "Unknown")
    echo "      Database Size: $DB_SIZE"
    
    TABLE_COUNT=$(docker exec rix-postgres psql -U rix_user -d rix_personal_agent -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs || echo "Unknown")
    echo "      Tables: $TABLE_COUNT"
    
    # Check if pgvector extension is installed
    PGVECTOR_STATUS=$(docker exec rix-postgres psql -U rix_user -d rix_personal_agent -t -c "SELECT 1 FROM pg_extension WHERE extname = 'vector';" 2>/dev/null | xargs || echo "")
    if [ "$PGVECTOR_STATUS" = "1" ]; then
        echo "      pgvector: ✅ Installed"
    else
        echo "      pgvector: ❌ Not installed"
    fi
else
    echo "🔹 PostgreSQL Database: ❌ Not running"
    SERVICES_COUNT=$((SERVICES_COUNT + 1))
    OVERALL_STATUS="❌ Unhealthy"
fi

echo ""
echo "🤖 Main Agent (FastAPI):"
if lsof -i:8001 >/dev/null 2>&1; then
    check_service "Main Agent API" "curl -s http://localhost:8001/health/" '"status":"healthy"'
    
    # Additional Main Agent checks
    echo "   📊 Main Agent Details:"
    AGENT_VERSION=$(curl -s http://localhost:8001/health/ | grep -o '"version":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "Unknown")
    echo "      Version: $AGENT_VERSION"
    
    AGENT_UPTIME=$(curl -s http://localhost:8001/health/ | grep -o '"uptime":[0-9.]*' | cut -d':' -f2 2>/dev/null || echo "Unknown")
    if [ "$AGENT_UPTIME" != "Unknown" ]; then
        UPTIME_MINS=$(echo "$AGENT_UPTIME / 60" | bc 2>/dev/null || echo "Unknown")
        echo "      Uptime: ${UPTIME_MINS} minutes"
    fi
    
    # Check API documentation
    if curl -s http://localhost:8001/docs | grep -q "swagger-ui"; then
        echo "      API Docs: ✅ Available at http://localhost:8001/docs"
    else
        echo "      API Docs: ❌ Not accessible"
    fi
else
    echo "🔹 Main Agent API: ❌ Not running (port 8001)"
    SERVICES_COUNT=$((SERVICES_COUNT + 1))
    OVERALL_STATUS="❌ Unhealthy"
fi

echo ""
echo "🌐 Frontend (Next.js):"
if lsof -i:3000 >/dev/null 2>&1; then
    check_service "Frontend Application" "curl -s -w '%{http_code}' http://localhost:3000/" "200"
    
    # Additional Frontend checks
    echo "   📊 Frontend Details:"
    
    # Check if login page is accessible
    if curl -s -w '%{http_code}' http://localhost:3000/auth/signin | tail -1 | grep -q "200"; then
        echo "      Login Page: ✅ Accessible"
    else
        echo "      Login Page: ❌ Not accessible"
    fi
    
    # Check if dashboard redirects properly (should redirect to login in mock mode)
    DASHBOARD_STATUS=$(curl -s -w '%{http_code}' http://localhost:3000/dashboard | tail -1)
    if [ "$DASHBOARD_STATUS" = "200" ] || [ "$DASHBOARD_STATUS" = "307" ]; then
        echo "      Dashboard: ✅ Accessible"
    else
        echo "      Dashboard: ❌ Not accessible"
    fi
    
    # Check health endpoint
    if curl -s http://localhost:3000/api/health | grep -q "status"; then
        echo "      Health API: ✅ Responding"
    else
        echo "      Health API: ❌ Not responding"
    fi
else
    echo "🔹 Frontend Application: ❌ Not running (port 3000)"
    SERVICES_COUNT=$((SERVICES_COUNT + 1))
    OVERALL_STATUS="❌ Unhealthy"
fi

echo ""
echo "🔗 Service Integration:"

# Test Frontend → Main Agent communication
if lsof -i:3000 >/dev/null 2>&1 && lsof -i:8001 >/dev/null 2>&1; then
    # This would require authentication, so we just check if the connection is possible
    CONNECTION_TEST=$(curl -s -w '%{http_code}' http://localhost:3000/api/health | tail -1)
    if [ "$CONNECTION_TEST" = "200" ]; then
        echo "🔹 Frontend ↔ Main Agent: ✅ Communication possible"
        HEALTHY_COUNT=$((HEALTHY_COUNT + 1))
    else
        echo "🔹 Frontend ↔ Main Agent: ❌ Communication issues"
        OVERALL_STATUS="⚠️  Degraded"
    fi
else
    echo "🔹 Frontend ↔ Main Agent: ❌ One or both services not running"
    OVERALL_STATUS="❌ Unhealthy"
fi
SERVICES_COUNT=$((SERVICES_COUNT + 1))

echo ""
echo "📋 System Summary:"
echo "======================================="
echo "🏥 Overall Status: $OVERALL_STATUS"
echo "📊 Services: $HEALTHY_COUNT/$SERVICES_COUNT healthy"

if [ "$OVERALL_STATUS" = "✅ Healthy" ]; then
    echo ""
    echo "🎉 All systems operational!"
    echo "📱 Access RIX at: http://localhost:3000"
    echo "🔐 Login with: admin@rix.com / admin123"
elif [ "$OVERALL_STATUS" = "⚠️  Degraded" ]; then
    echo ""
    echo "⚠️  Some services have issues. Check logs for details:"
    echo "   Main Agent: ./main-agent.log"
    echo "   Frontend: ./frontend.log"
else
    echo ""
    echo "❌ System is not healthy. To start services:"
    echo "   Run: ./start-rix.sh"
fi

echo ""
echo "🔧 Quick Actions:"
echo "   Start all: ./start-rix.sh"
echo "   Stop all:  ./stop-rix.sh"
echo "   Check:     ./check-rix.sh"

# Exit with appropriate code
if [ "$OVERALL_STATUS" = "✅ Healthy" ]; then
    exit 0
elif [ "$OVERALL_STATUS" = "⚠️  Degraded" ]; then
    exit 1
else
    exit 2
fi