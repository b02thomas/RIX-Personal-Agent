# RIX Main Agent - Phase 6: N8N Workflow Management Deployment Guide

## Overview

This deployment guide covers the comprehensive setup and deployment of RIX Main Agent Phase 6, featuring enhanced N8N workflow management, AI-triggered workflows, and analytics monitoring.

### Phase 6 Features

- **Workflow Discovery & Management**: Automatic discovery and categorization of N8N workflows
- **AI-Triggered Workflows**: Intelligence-driven automatic workflow execution
- **Comprehensive Analytics**: Performance metrics, success rates, and execution tracking
- **Real-time Monitoring**: Prometheus metrics with Grafana dashboards
- **Enhanced Webhooks**: Secure webhook handling with signature verification
- **Queue Management**: Workflow execution queue with priority handling
- **Performance Optimization**: Database optimization for workflow analytics

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   RIX Frontend  │────│  RIX Main Agent  │────│  N8N MCP Endpoints  │
│   (Next.js)     │    │  (FastAPI)       │    │  (LLM Processing)   │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                │                          │
                       ┌────────┴────────┐                │
                       │                 │                │
                ┌──────▼──────┐   ┌──────▼──────┐        │
                │ PostgreSQL  │   │    Redis    │        │
                │ (Workflows) │   │  (Cache)    │        │
                └─────────────┘   └─────────────┘        │
                                                         │
                ┌─────────────────────────────────────────┘
                │
        ┌───────▼───────┐    ┌─────────────┐
        │  Prometheus   │    │   Grafana   │
        │ (Metrics)     │────│ (Dashboard) │
        └───────────────┘    └─────────────┘
```

## Prerequisites

### System Requirements

- **Operating System**: Linux, macOS, or Windows with WSL2
- **Docker**: Version 20.10+ 
- **Docker Compose**: Version 2.0+
- **Memory**: Minimum 4GB RAM (8GB recommended for production)
- **Storage**: 10GB available space (20GB recommended for production)
- **Network**: Outbound HTTPS access to N8N instance

### Software Dependencies

```bash
# Install required tools
sudo apt-get update
sudo apt-get install -y curl jq wget

# Verify Docker installation
docker --version
docker-compose --version
```

### N8N Configuration Requirements

- N8N instance accessible via HTTPS
- Valid N8N API key with workflow management permissions
- N8N JWT token for authentication
- Webhook secret for secure webhook communication
- MCP endpoints configured in N8N for Phase 5 intelligence features

## Quick Start

### 1. Clone and Setup

```bash
# Navigate to main-agent directory
cd /path/to/RIX/main-agent

# Make deployment script executable
chmod +x scripts/deploy.sh

# Check prerequisites
./scripts/deploy.sh check
```

### 2. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit environment variables (REQUIRED)
nano .env
```

**Required Environment Variables:**

```bash
# N8N Integration
N8N_BASE_URL=https://your-n8n-instance.com
N8N_API_KEY=your_n8n_api_key_here
N8N_JWT_TOKEN=your_n8n_jwt_token_here
N8N_WEBHOOK_SECRET=your_webhook_secret_here

# Security
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Database
DB_USER=postgres
DB_PASSWORD=your_secure_password_here
DB_NAME=rix_personal_agent

# Production settings (if deploying to production)
ALLOWED_ORIGINS=["https://your-domain.com"]
ALLOWED_HOSTS=["your-domain.com"]
```

### 3. Deploy Services

**Development Deployment:**
```bash
# Full deployment with setup
./scripts/deploy.sh deploy

# Or step by step
./scripts/deploy.sh setup
./scripts/deploy.sh build
./scripts/deploy.sh deploy
```

**Production Deployment:**
```bash
# Production deployment
./scripts/deploy.sh deploy:prod
```

### 4. Verify Deployment

```bash
# Check service status
./scripts/deploy.sh verify

# View logs
./scripts/deploy.sh logs
./scripts/deploy.sh logs main-agent
```

## Detailed Deployment Steps

### Step 1: Environment Setup

The deployment script automatically creates the necessary directory structure and configuration files:

```bash
./scripts/deploy.sh setup
```

This creates:
- Database initialization scripts
- Monitoring configuration (Prometheus/Grafana)
- Nginx load balancer configuration
- Redis cache configuration
- PostgreSQL optimization settings

### Step 2: Build Application

```bash
./scripts/deploy.sh build
```

This builds the Docker image with:
- Python 3.11 slim base image
- All required dependencies from requirements.txt
- Health check configuration
- Non-root user setup for security

### Step 3: Service Deployment

The deployment includes these services:

#### Core Services
- **main-agent**: RIX Main Agent FastAPI application
- **postgres**: PostgreSQL database with workflow tables
- **redis**: Redis cache for sessions and performance

#### Monitoring Stack
- **prometheus**: Metrics collection and alerting
- **grafana**: Visualization dashboards
- **nginx**: Load balancer and SSL termination

#### Service Dependencies

```yaml
main-agent:
  depends_on:
    - postgres (healthy)
    - redis (healthy)

grafana:
  depends_on:
    - prometheus

nginx:
  depends_on:
    - main-agent
```

### Step 4: Database Initialization

PostgreSQL automatically initializes with:

- **Workflow Management Tables**:
  - `n8n_workflows`: Workflow metadata and performance metrics
  - `n8n_executions`: Execution tracking and results
  - `workflow_analytics`: Daily analytics aggregation
  - `workflow_execution_queue`: Execution queue management

- **Performance Indexes**: Optimized for query performance
- **Stored Functions**: Metrics calculation and cleanup
- **Initial Data**: Default workflow configurations

### Step 5: Monitoring Setup

#### Prometheus Configuration
- Scrapes metrics from main-agent on port 8002
- Collects PostgreSQL and Redis metrics
- Monitors N8N external service
- 30-day data retention

#### Grafana Dashboards
- Workflow execution performance
- AI-triggered workflow analytics
- Database performance metrics
- N8N integration status

## Configuration Reference

### Environment Variables

#### Application Settings
```bash
DEBUG=false                    # Enable debug mode
HOST=0.0.0.0                  # Bind address
PORT=8001                     # Application port
LOG_LEVEL=INFO                # Logging level
LOG_FORMAT=json               # Log format
```

#### Database Configuration
```bash
DB_HOST=postgres              # Database host
DB_USER=postgres              # Database user
DB_PASSWORD=secure_password   # Database password
DB_NAME=rix_personal_agent   # Database name
DB_POOL_SIZE=20              # Connection pool size
```

#### N8N Integration
```bash
N8N_BASE_URL=https://n8n.example.com
N8N_API_KEY=your_api_key
N8N_JWT_TOKEN=your_jwt_token
N8N_WEBHOOK_SECRET=webhook_secret
N8N_WORKFLOW_TIMEOUT=300
N8N_MAX_CONCURRENT_EXECUTIONS=50
```

#### MCP Endpoints (Phase 6)
```bash
MCP_TASK_ENDPOINT=/mcp/task-management
MCP_CALENDAR_ENDPOINT=/mcp/calendar-intelligence
MCP_BRIEFING_ENDPOINT=/mcp/briefing-generator
MCP_CHAT_ENDPOINT=/mcp/general-conversation
MCP_NEWS_ENDPOINT=/mcp/news-intelligence
MCP_VOICE_ENDPOINT=/mcp/voice-processing
MCP_ANALYTICS_ENDPOINT=/mcp/analytics-learning
MCP_NOTIFICATIONS_ENDPOINT=/mcp/notification-management
MCP_PROJECT_ENDPOINT=/mcp/project-chatbot
# Phase 5 Intelligence Features
MCP_ROUTINE_COACHING_ENDPOINT=/mcp/routine-coaching
MCP_PROJECT_INTELLIGENCE_ENDPOINT=/mcp/project-intelligence
MCP_CALENDAR_OPTIMIZATION_ENDPOINT=/mcp/calendar-optimization
```

#### Performance & Scaling
```bash
WORKER_PROCESSES=2
WORKER_CONNECTIONS=1000
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW=60
WEBSOCKET_MAX_CONNECTIONS=10000
```

#### Cache Configuration
```bash
REDIS_URL=redis://redis:6379/0
REDIS_MAX_CONNECTIONS=50
REDIS_CACHE_TTL=3600
REDIS_SESSION_TTL=86400
```

#### Monitoring
```bash
PROMETHEUS_METRICS_ENABLED=true
PROMETHEUS_METRICS_PORT=8002
WORKFLOW_ANALYTICS_ENABLED=true
WORKFLOW_PERFORMANCE_MONITORING=true
```

### Docker Compose Configurations

#### Development (`docker-compose.yml`)
- Single instance deployment
- Debug mode enabled
- Volume mounts for development
- Basic monitoring setup

#### Production (`docker-compose.prod.yml`)
- Multi-instance deployment with load balancing
- Resource limits and health checks
- Full monitoring stack with Grafana
- SSL termination with Nginx
- Log rotation and retention

## Service URLs

After successful deployment, access these services:

| Service | URL | Description |
|---------|-----|-------------|
| Main Agent API | http://localhost:8001 | RIX Main Agent API |
| Health Check | http://localhost:8001/health | Service health status |
| API Documentation | http://localhost:8001/docs | Interactive API docs |
| Workflow Status | http://localhost:8001/n8n/status | N8N integration status |
| Prometheus | http://localhost:9090 | Metrics and alerts |
| Grafana | http://localhost:3001 | Dashboards (admin/admin) |
| PostgreSQL | localhost:5432 | Database (postgres/password) |
| Redis | localhost:6379 | Cache service |

## Management Commands

### Service Management

```bash
# Check deployment status
./scripts/deploy.sh verify

# View service logs
./scripts/deploy.sh logs [service]

# Restart services
./scripts/deploy.sh restart

# Stop all services
./scripts/deploy.sh stop

# Clean up containers and volumes
./scripts/deploy.sh clean
```

### Maintenance Operations

```bash
# Database backup
docker exec -t postgres pg_dump -U postgres rix_personal_agent > backup.sql

# Database restore
docker exec -i postgres psql -U postgres rix_personal_agent < backup.sql

# View workflow analytics
docker exec -it postgres psql -U postgres -d rix_personal_agent -c "SELECT * FROM get_workflow_performance_summary(7);"

# Clean old execution data
docker exec -it postgres psql -U postgres -d rix_personal_agent -c "SELECT cleanup_old_executions(30);"
```

### Monitoring Commands

```bash
# Check workflow execution metrics
curl http://localhost:8001/n8n/analytics

# Get N8N service status
curl http://localhost:8001/n8n/status

# Check intelligence features status
curl http://localhost:8001/intelligence/features/status

# Prometheus metrics
curl http://localhost:8002/metrics
```

## Troubleshooting

### Common Issues

#### 1. N8N Connection Failures
```bash
# Check N8N connectivity
curl -H "X-N8N-API-Key: $N8N_API_KEY" $N8N_BASE_URL/api/v1/workflows

# Verify environment variables
docker exec main-agent env | grep N8N
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL status
docker exec postgres pg_isready -U postgres

# View database logs
./scripts/deploy.sh logs postgres

# Test database connection
docker exec -it postgres psql -U postgres -d rix_personal_agent -c "SELECT 1;"
```

#### 3. Workflow Execution Failures
```bash
# Check workflow analytics
curl http://localhost:8001/n8n/analytics

# View execution logs
./scripts/deploy.sh logs main-agent | grep "workflow"

# Check N8N webhook health
curl http://localhost:8001/webhooks/n8n/health
```

#### 4. Memory Issues
```bash
# Check container resource usage
docker stats

# View memory usage in logs
./scripts/deploy.sh logs main-agent | grep -i memory

# Restart with clean state
./scripts/deploy.sh restart
```

### Log Analysis

```bash
# Filter workflow execution logs
./scripts/deploy.sh logs main-agent | grep "workflow_execution"

# Monitor real-time AI-triggered workflows
./scripts/deploy.sh logs main-agent | grep "ai_triggered"

# Check database performance
./scripts/deploy.sh logs postgres | grep "slow query"

# Monitor N8N integration
./scripts/deploy.sh logs main-agent | grep "n8n_client"
```

### Performance Optimization

#### Database Optimization
```sql
-- Analyze table statistics
ANALYZE n8n_workflows;
ANALYZE n8n_executions;
ANALYZE workflow_analytics;

-- Check index usage
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename IN ('n8n_workflows', 'n8n_executions');

-- Vacuum and reindex
VACUUM ANALYZE n8n_executions;
REINDEX TABLE n8n_workflows;
```

#### Application Performance
```bash
# Monitor application metrics
curl http://localhost:8002/metrics | grep rix_

# Check WebSocket connections
curl http://localhost:8001/health | jq '.websocket_connections'

# Monitor workflow queue
curl http://localhost:8001/n8n/status | jq '.workflow_queue_size'
```

## Security Considerations

### Environment Security
- Use strong, unique passwords for all services
- Rotate JWT secrets regularly
- Configure firewall rules for port access
- Use HTTPS in production with proper SSL certificates

### Database Security
- Enable PostgreSQL connection encryption
- Configure proper user permissions
- Regular security updates
- Database backup encryption

### N8N Integration Security
- Validate webhook signatures
- Use secure API keys with limited permissions
- Monitor for suspicious webhook activity
- Implement rate limiting

## Production Deployment

### Hardware Requirements

**Minimum Production Setup:**
- 4 CPU cores
- 8GB RAM
- 50GB SSD storage
- 100Mbps network

**Recommended Production Setup:**
- 8 CPU cores
- 16GB RAM
- 100GB NVMe SSD storage
- 1Gbps network

### Production Checklist

- [ ] SSL certificates configured
- [ ] Domain names properly configured
- [ ] Database backups automated
- [ ] Log rotation configured
- [ ] Monitoring alerts set up
- [ ] Security scanning performed
- [ ] Performance testing completed
- [ ] Disaster recovery plan documented

### Scaling Considerations

- Use external PostgreSQL service for high availability
- Implement Redis clustering for cache scaling
- Configure multiple Main Agent instances behind load balancer
- Set up external monitoring with alerting
- Implement automated backup and recovery

## Integration with RIX Frontend

### Frontend Developer Handoff

The Main Agent Phase 6 deployment provides these endpoints for frontend integration:

#### Core API Endpoints
```typescript
// Health and status
GET /health
GET /health/ready
GET /health/live

// N8N Workflow Management
GET /n8n/status
GET /n8n/workflows
POST /n8n/trigger
GET /n8n/executions/{execution_id}
POST /n8n/discover
POST /n8n/activate
GET /n8n/analytics

// Intelligence Features (Phase 5)
POST /intelligence/routine-coaching
POST /intelligence/project-intelligence
POST /intelligence/calendar-optimization
GET /intelligence/features/status

// Webhook Endpoints
POST /webhooks/n8n/{workflow_type}
GET /webhooks/n8n/health
```

#### WebSocket Integration
```typescript
// Real-time communication
ws://localhost:8001/ws/chat/{user_id}

// WebSocket events
- workflow_completed
- ai_triggered_execution
- processing_status
- error_notification
```

#### Frontend Environment Variables
```bash
# Add to RIX frontend .env.local
NEXT_PUBLIC_MAIN_AGENT_URL=http://localhost:8001
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8001
NEXT_PUBLIC_N8N_INTEGRATION_ENABLED=true
NEXT_PUBLIC_INTELLIGENCE_FEATURES_ENABLED=true
```

### Testing Integration

```bash
# Test main agent connectivity from frontend
curl http://localhost:8001/health

# Test N8N integration
curl http://localhost:8001/n8n/status

# Test intelligence features
curl http://localhost:8001/intelligence/features/status
```

## Support and Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor service health and performance
- Check error logs for issues
- Verify N8N connectivity

**Weekly:**
- Review workflow analytics
- Check database performance
- Update security patches

**Monthly:**
- Backup database
- Clean old execution data
- Review and optimize performance
- Update dependencies

### Getting Help

- Check logs first: `./scripts/deploy.sh logs`
- Verify configuration: `./scripts/deploy.sh verify`
- Review this documentation
- Check GitHub issues for known problems

---

## Summary

RIX Main Agent Phase 6 provides a robust, scalable deployment for N8N workflow management with comprehensive monitoring and analytics. The deployment script automates most setup tasks, while this guide provides detailed configuration and troubleshooting information.

Key Features Deployed:
- ✅ Enhanced N8N workflow management
- ✅ AI-triggered workflow execution
- ✅ Comprehensive analytics and monitoring
- ✅ Production-ready scaling configuration
- ✅ Security best practices
- ✅ Automated deployment and management

For any issues or questions, refer to the troubleshooting section or check the service logs for detailed error information.