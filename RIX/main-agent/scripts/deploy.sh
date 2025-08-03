#!/bin/bash

# RIX Main Agent - Phase 6: N8N Workflow Management Deployment Script
# Comprehensive deployment automation for enhanced workflow execution and analytics

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="${PROJECT_DIR}/logs/deployment.log"
ENV_FILE="${PROJECT_DIR}/.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Create logs directory if it doesn't exist
    mkdir -p "$(dirname "$LOG_FILE")"
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message"
            echo "[$timestamp] [INFO] $message" >> "$LOG_FILE"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            echo "[$timestamp] [WARN] $message" >> "$LOG_FILE"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            echo "[$timestamp] [ERROR] $message" >> "$LOG_FILE"
            ;;
        "DEBUG")
            echo -e "${BLUE}[DEBUG]${NC} $message"
            echo "[$timestamp] [DEBUG] $message" >> "$LOG_FILE"
            ;;
    esac
}

# Function to check prerequisites
check_prerequisites() {
    log "INFO" "Checking deployment prerequisites..."
    
    # Check for required commands
    local required_commands=("docker" "docker-compose" "curl" "jq")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log "ERROR" "Required command '$cmd' not found. Please install it first."
            exit 1
        fi
    done
    
    # Check Docker version
    local docker_version=$(docker --version | grep -oE '[0-9]+\.[0-9]+')
    local required_version="20.10"
    if ! printf '%s\n%s\n' "$required_version" "$docker_version" | sort -V -C; then
        log "WARN" "Docker version $docker_version may not be compatible. Recommended: $required_version+"
    fi
    
    # Check Docker Compose version
    local compose_version=$(docker-compose --version | grep -oE '[0-9]+\.[0-9]+')
    local required_compose_version="2.0"
    if ! printf '%s\n%s\n' "$required_compose_version" "$compose_version" | sort -V -C; then
        log "WARN" "Docker Compose version $compose_version may not be compatible. Recommended: $required_compose_version+"
    fi
    
    log "INFO" "Prerequisites check completed successfully"
}

# Function to setup environment
setup_environment() {
    log "INFO" "Setting up deployment environment..."
    
    # Create necessary directories
    local directories=(
        "logs"
        "data/postgres"
        "data/redis"
        "data/prometheus"
        "data/grafana"
        "monitoring/grafana/dashboards"
        "monitoring/grafana/datasources"
        "nginx"
        "scripts"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "${PROJECT_DIR}/${dir}"
        log "DEBUG" "Created directory: $dir"
    done
    
    # Check if .env file exists
    if [[ ! -f "$ENV_FILE" ]]; then
        log "WARN" "Environment file not found. Copying from .env.example..."
        if [[ -f "${PROJECT_DIR}/.env.example" ]]; then
            cp "${PROJECT_DIR}/.env.example" "$ENV_FILE"
            log "INFO" "Please edit .env file with your configuration before continuing"
            log "INFO" "Required: N8N_API_KEY, N8N_JWT_TOKEN, N8N_WEBHOOK_SECRET, JWT_SECRET"
            exit 1
        else
            log "ERROR" "Neither .env nor .env.example found"
            exit 1
        fi
    fi
    
    # Validate required environment variables
    local required_vars=(
        "N8N_BASE_URL"
        "N8N_API_KEY"
        "N8N_JWT_TOKEN"
        "JWT_SECRET"
        "DB_USER"
        "DB_PASSWORD"
        "DB_NAME"
    )
    
    source "$ENV_FILE"
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log "ERROR" "Required environment variable $var is not set in .env file"
            exit 1
        fi
    done
    
    log "INFO" "Environment setup completed successfully"
}

# Function to build application
build_application() {
    log "INFO" "Building RIX Main Agent application..."
    
    cd "$PROJECT_DIR"
    
    # Build Docker image
    docker build -t rix-main-agent:latest . || {
        log "ERROR" "Docker build failed"
        exit 1
    }
    
    # Verify build
    if docker images | grep -q "rix-main-agent"; then
        log "INFO" "Docker image built successfully"
    else
        log "ERROR" "Docker image build verification failed"
        exit 1
    fi
}

# Function to setup monitoring
setup_monitoring() {
    log "INFO" "Setting up monitoring configuration..."
    
    # Create Grafana datasource configuration
    cat > "${PROJECT_DIR}/monitoring/grafana/datasources/prometheus.yml" << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

    # Create basic dashboard configuration
    cat > "${PROJECT_DIR}/monitoring/grafana/dashboards/dashboard.yml" << EOF
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
EOF

    log "INFO" "Monitoring configuration setup completed"
}

# Function to setup nginx configuration
setup_nginx() {
    log "INFO" "Setting up Nginx load balancer configuration..."
    
    cat > "${PROJECT_DIR}/nginx/nginx.conf" << EOF
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;
    
    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=ws:10m rate=5r/s;
    
    upstream rix_main_agent {
        least_conn;
        server main-agent:8001 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }
    
    server {
        listen 80;
        server_name _;
        
        # Health check endpoint
        location /health {
            proxy_pass http://rix_main_agent/health;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        # API endpoints with rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://rix_main_agent;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_read_timeout 300s;
            proxy_connect_timeout 30s;
            proxy_send_timeout 300s;
        }
        
        # WebSocket endpoints
        location /ws/ {
            limit_req zone=ws burst=10 nodelay;
            proxy_pass http://rix_main_agent;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_read_timeout 86400;
        }
        
        # Webhook endpoints
        location /webhooks/ {
            proxy_pass http://rix_main_agent;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
            proxy_read_timeout 60s;
        }
        
        # Prometheus metrics (internal access only)
        location /metrics {
            allow 172.20.0.0/16;
            deny all;
            proxy_pass http://rix_main_agent:8002/metrics;
        }
    }
}
EOF

    log "INFO" "Nginx configuration setup completed"
}

# Function to setup Redis configuration
setup_redis() {
    log "INFO" "Setting up Redis configuration..."
    
    cat > "${PROJECT_DIR}/scripts/redis.conf" << EOF
# RIX Main Agent - Redis Configuration for Phase 6
bind 0.0.0.0
port 6379
tcp-backlog 511
timeout 300
tcp-keepalive 300

# Memory management
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /data

# Append only file
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Slow log
slowlog-log-slower-than 10000
slowlog-max-len 128

# Client output buffer limits
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60

# Security
protected-mode yes
EOF

    log "INFO" "Redis configuration setup completed"
}

# Function to setup PostgreSQL configuration
setup_postgresql() {
    log "INFO" "Setting up PostgreSQL configuration..."
    
    cat > "${PROJECT_DIR}/scripts/postgresql.conf" << EOF
# RIX Main Agent - PostgreSQL Configuration for Phase 6

# Connection settings
listen_addresses = '*'
port = 5432
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# WAL settings
wal_level = replica
max_wal_size = 1GB
min_wal_size = 80MB
checkpoint_completion_target = 0.9

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on

# Performance monitoring
shared_preload_libraries = 'pg_stat_statements'
track_activities = on
track_counts = on
track_io_timing = on
track_functions = all

# Autovacuum
autovacuum = on
autovacuum_max_workers = 3
autovacuum_naptime = 1min
autovacuum_vacuum_threshold = 50
autovacuum_analyze_threshold = 50
EOF

    log "INFO" "PostgreSQL configuration setup completed"
}

# Function to deploy services
deploy_services() {
    local environment=${1:-"development"}
    
    log "INFO" "Deploying RIX Main Agent Phase 6 services in $environment mode..."
    
    cd "$PROJECT_DIR"
    
    # Select appropriate compose file
    local compose_file="docker-compose.yml"
    if [[ "$environment" == "production" ]]; then
        compose_file="docker-compose.prod.yml"
    fi
    
    # Stop existing services
    log "INFO" "Stopping existing services..."
    docker-compose -f "$compose_file" down --remove-orphans || true
    
    # Pull latest images
    log "INFO" "Pulling latest images..."
    docker-compose -f "$compose_file" pull
    
    # Start services
    log "INFO" "Starting services..."
    docker-compose -f "$compose_file" up -d
    
    # Wait for services to be healthy
    log "INFO" "Waiting for services to be healthy..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if docker-compose -f "$compose_file" ps --services --filter status=running | wc -l | grep -q "$(docker-compose -f "$compose_file" ps --services | wc -l)"; then
            log "INFO" "All services are running"
            break
        fi
        
        log "DEBUG" "Attempt $attempt/$max_attempts: Waiting for services..."
        sleep 10
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        log "ERROR" "Services failed to start within expected time"
        docker-compose -f "$compose_file" ps
        docker-compose -f "$compose_file" logs --tail=50
        exit 1
    fi
    
    log "INFO" "Service deployment completed successfully"
}

# Function to verify deployment
verify_deployment() {
    log "INFO" "Verifying deployment..."
    
    local services=("main-agent" "postgres" "redis")
    local endpoints=(
        "http://localhost:8001/health"
        "http://localhost:8001/health/ready"
        "http://localhost:8001/n8n/status"
    )
    
    # Check service status
    for service in "${services[@]}"; do
        if docker-compose ps "$service" | grep -q "Up"; then
            log "INFO" "Service $service is running"
        else
            log "ERROR" "Service $service is not running"
            return 1
        fi
    done
    
    # Check endpoints
    for endpoint in "${endpoints[@]}"; do
        log "DEBUG" "Testing endpoint: $endpoint"
        if curl -f -s "$endpoint" > /dev/null; then
            log "INFO" "Endpoint $endpoint is responding"
        else
            log "WARN" "Endpoint $endpoint is not responding (may take a few more seconds)"
        fi
    done
    
    # Display service URLs
    log "INFO" "Deployment verification completed"
    log "INFO" "Service URLs:"
    log "INFO" "  - Main Agent API: http://localhost:8001"
    log "INFO" "  - Health Check: http://localhost:8001/health"
    log "INFO" "  - API Documentation: http://localhost:8001/docs"
    log "INFO" "  - Prometheus: http://localhost:9090"
    log "INFO" "  - Grafana: http://localhost:3001 (admin/admin)"
}

# Function to show usage
show_usage() {
    cat << EOF
RIX Main Agent - Phase 6: N8N Workflow Management Deployment Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    check           Check deployment prerequisites
    setup          Setup deployment environment
    build          Build application Docker image
    deploy         Deploy services (default: development)
    deploy:prod    Deploy services in production mode
    verify         Verify deployment status
    logs           Show service logs
    stop           Stop all services
    clean          Clean up containers and volumes
    restart        Restart all services
    help           Show this help message

Options:
    --verbose      Enable verbose logging
    --no-build     Skip Docker build step
    --clean        Clean existing containers before deployment

Examples:
    $0 check                    # Check prerequisites
    $0 setup                    # Setup environment
    $0 deploy                   # Deploy in development mode
    $0 deploy:prod             # Deploy in production mode
    $0 verify                   # Verify deployment
    $0 logs main-agent         # Show main-agent logs
    $0 restart                  # Restart all services

EOF
}

# Function to show logs
show_logs() {
    local service=${1:-}
    local compose_file="docker-compose.yml"
    
    if [[ -f "${PROJECT_DIR}/docker-compose.prod.yml" ]] && docker-compose -f "${PROJECT_DIR}/docker-compose.prod.yml" ps | grep -q "Up"; then
        compose_file="docker-compose.prod.yml"
    fi
    
    cd "$PROJECT_DIR"
    
    if [[ -n "$service" ]]; then
        docker-compose -f "$compose_file" logs -f --tail=100 "$service"
    else
        docker-compose -f "$compose_file" logs -f --tail=50
    fi
}

# Function to stop services
stop_services() {
    log "INFO" "Stopping all services..."
    
    cd "$PROJECT_DIR"
    
    # Try both compose files
    docker-compose -f docker-compose.yml down --remove-orphans 2>/dev/null || true
    docker-compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
    
    log "INFO" "All services stopped"
}

# Function to clean up
cleanup() {
    log "INFO" "Cleaning up containers and volumes..."
    
    cd "$PROJECT_DIR"
    
    # Stop and remove containers
    docker-compose -f docker-compose.yml down --volumes --remove-orphans 2>/dev/null || true
    docker-compose -f docker-compose.prod.yml down --volumes --remove-orphans 2>/dev/null || true
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused volumes
    docker volume prune -f
    
    log "INFO" "Cleanup completed"
}

# Function to restart services
restart_services() {
    log "INFO" "Restarting all services..."
    
    stop_services
    sleep 5
    deploy_services
    verify_deployment
    
    log "INFO" "All services restarted"
}

# Main script logic
main() {
    local command=${1:-"help"}
    local verbose=${VERBOSE:-false}
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --verbose)
                verbose=true
                shift
                ;;
            --no-build)
                NO_BUILD=true
                shift
                ;;
            --clean)
                CLEAN=true
                shift
                ;;
            -h|--help|help)
                show_usage
                exit 0
                ;;
            *)
                command=$1
                shift
                ;;
        esac
    done
    
    # Set verbose logging
    if [[ "$verbose" == "true" ]]; then
        set -x
    fi
    
    # Execute command
    case $command in
        "check")
            check_prerequisites
            ;;
        "setup")
            check_prerequisites
            setup_environment
            setup_monitoring
            setup_nginx
            setup_redis
            setup_postgresql
            ;;
        "build")
            check_prerequisites
            build_application
            ;;
        "deploy")
            check_prerequisites
            setup_environment
            setup_monitoring
            setup_nginx
            setup_redis
            setup_postgresql
            if [[ "${NO_BUILD:-false}" != "true" ]]; then
                build_application
            fi
            if [[ "${CLEAN:-false}" == "true" ]]; then
                cleanup
            fi
            deploy_services "development"
            verify_deployment
            ;;
        "deploy:prod")
            check_prerequisites
            setup_environment
            setup_monitoring
            setup_nginx
            setup_redis
            setup_postgresql
            if [[ "${NO_BUILD:-false}" != "true" ]]; then
                build_application
            fi
            if [[ "${CLEAN:-false}" == "true" ]]; then
                cleanup
            fi
            deploy_services "production"
            verify_deployment
            ;;
        "verify")
            verify_deployment
            ;;
        "logs")
            show_logs "$2"
            ;;
        "stop")
            stop_services
            ;;
        "clean")
            cleanup
            ;;
        "restart")
            restart_services
            ;;
        *)
            log "ERROR" "Unknown command: $command"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"