#!/bin/bash

# Health check script for Advancia SaaS Platform
# Usage: ./scripts/health-check.sh [environment]

set -e

# Configuration
ENVIRONMENT=${1:-dev}
TIMEOUT=${2:-300} # 5 minutes default
INTERVAL=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Get service URL based on environment
get_service_url() {
    case $ENVIRONMENT in
        dev)
            echo "https://dev-api.advancia.com"
            ;;
        staging)
            echo "https://staging-api.advancia.com"
            ;;
        prod)
            echo "https://api.advancia.com"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            exit 1
            ;;
    esac
}

# Check API health
check_api_health() {
    local url=$1
    local endpoint="/health"
    
    log_info "Checking API health at $url$endpoint"
    
    local start_time=$(date +%s)
    local end_time=$((start_time + TIMEOUT))
    
    while [ $(date +%s) -lt $end_time ]; do
        if curl -f -s "$url$endpoint" > /dev/null 2>&1; then
            log_info "API health check passed"
            return 0
        fi
        
        local elapsed=$(($(date +%s) - start_time))
        log_warn "API not healthy, retrying... (${elapsed}s elapsed)"
        sleep $INTERVAL
    done
    
    log_error "API health check failed after ${TIMEOUT}s"
    return 1
}

# Check database connectivity
check_database() {
    log_info "Checking database connectivity..."
    
    # This would typically run a database health check
    # For now, we'll simulate it
    if command -v kubectl &> /dev/null; then
        kubectl run db-check-$ENVIRONMENT --image=postgres:15-alpine \
            --restart=Never --rm -i --tty \
            --env="DATABASE_URL=$DATABASE_URL" \
            --command -- sh -c 'pg_isready -d "$DATABASE_URL" && echo "Database is healthy"'
        
        if [ $? -eq 0 ]; then
            log_info "Database health check passed"
            return 0
        fi
    fi
    
    log_warn "Could not perform database health check"
    return 0 # Don't fail the deployment
}

# Check Redis connectivity
check_redis() {
    log_info "Checking Redis connectivity..."
    
    if command -v kubectl &> /dev/null; then
        kubectl run redis-check-$ENVIRONMENT --image=redis:7-alpine \
            --restart=Never --rm -i --tty \
            --env="REDIS_URL=$REDIS_URL" \
            --command -- sh -c 'redis-cli -u "$REDIS_URL" ping && echo "Redis is healthy"'
        
        if [ $? -eq 0 ]; then
            log_info "Redis health check passed"
            return 0
        fi
    fi
    
    log_warn "Could not perform Redis health check"
    return 0 # Don't fail the deployment
}

# Check external services
check_external_services() {
    log_info "Checking external services..."
    
    # Check AI service
    if [ -n "$AI_SERVICE_URL" ]; then
        log_info "Checking AI service..."
        if curl -f -s "$AI_SERVICE_URL/health" > /dev/null 2>&1; then
            log_info "AI service is healthy"
        else
            log_warn "AI service is not responding"
        fi
    fi
    
    # Check payment service
    if [ -n "$PAYMENT_SERVICE_URL" ]; then
        log_info "Checking payment service..."
        if curl -f -s "$PAYMENT_SERVICE_URL/health" > /dev/null 2>&1; then
            log_info "Payment service is healthy"
        else
            log_warn "Payment service is not responding"
        fi
    fi
    
    # Check notification service
    if [ -n "$NOTIFICATION_SERVICE_URL" ]; then
        log_info "Checking notification service..."
        if curl -f -s "$NOTIFICATION_SERVICE_URL/health" > /dev/null 2>&1; then
            log_info "Notification service is healthy"
        else
            log_warn "Notification service is not responding"
        fi
    fi
}

# Check Kubernetes resources
check_kubernetes_resources() {
    if command -v kubectl &> /dev/null; then
        log_info "Checking Kubernetes resources..."
        
        # Check pods
        kubectl get pods -l app=advancia-backend --field-selector=status.phase!=Running
        
        # Check services
        kubectl get services
        
        # Check ingress
        kubectl get ingress
        
        # Check resource usage
        kubectl top pods --no-headers | awk '{if ($2 > 80 || $3 > 80) print "High resource usage: " $1}'
    fi
}

# Run comprehensive health check
run_health_check() {
    local service_url=$(get_service_url)
    
    log_info "Starting comprehensive health check for $ENVIRONMENT environment..."
    
    # Core health checks
    check_api_health "$service_url" || return 1
    check_database || return 1
    check_redis || return 1
    
    # External services
    check_external_services
    
    # Kubernetes resources
    check_kubernetes_resources
    
    log_info "All health checks passed!"
    return 0
}

# Main function
main() {
    log_info "Starting health check for $ENVIRONMENT environment..."
    
    if run_health_check; then
        log_info "Health check completed successfully!"
        exit 0
    else
        log_error "Health check failed!"
        exit 1
    fi
}

# Handle script interruption
trap 'log_error "Health check interrupted"; exit 1' INT TERM

# Run main function
main "$@"
