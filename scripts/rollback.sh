#!/bin/bash

# Rollback script for Advancia SaaS Platform
# Usage: ./scripts/rollback.sh [environment]

set -e

# Configuration
ENVIRONMENT=${1:-dev}
NAMESPACE="advancia-$ENVIRONMENT"
MAX_ROLLBACK_ATTEMPTS=3

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

# Validate environment
validate_environment() {
    case $ENVIRONMENT in
        dev|staging|prod)
            log_info "Rolling back $ENVIRONMENT environment"
            ;;
        *)
            log_error "Invalid environment: $ENVIRONMENT"
            log_error "Valid environments: dev, staging, prod"
            exit 1
            ;;
    esac
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi
    
    # Check if we can access the cluster
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot access Kubernetes cluster"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Get previous deployment revision
get_previous_revision() {
    log_info "Getting previous deployment revision..."
    
    # Get rollout history
    local history=$(kubectl rollout history deployment/advancia-backend -n $NAMESPACE)
    
    # Extract the previous revision number
    local current_revision=$(echo "$history" | grep "revision" | tail -1 | awk '{print $2}' | tr -d ',')
    local previous_revision=$((current_revision - 1))
    
    if [ $previous_revision -lt 1 ]; then
        log_error "No previous revision found for rollback"
        exit 1
    fi
    
    log_info "Previous revision: $previous_revision"
    echo $previous_revision
}

# Rollback deployment
rollback_deployment() {
    log_info "Starting deployment rollback..."
    
    local previous_revision=$(get_previous_revision)
    
    # Perform rollback
    log_info "Rolling back to revision $previous_revision..."
    kubectl rollout undo deployment/advancia-backend -n $NAMESPACE --to-revision=$previous_revision
    
    # Wait for rollback to complete
    log_info "Waiting for rollback to complete..."
    kubectl rollout status deployment/advancia-backend -n $NAMESPACE --timeout=600s
    
    log_info "Deployment rollback completed"
}

# Rollback blue-green deployment
rollback_blue_green() {
    log_info "Rolling back blue-green deployment..."
    
    # Switch traffic back to blue environment
    kubectl patch service advancia-backend-active -n $NAMESPACE \
        -p '{"spec":{"selector":{"version":"blue"}}}'
    
    # Scale down green environment
    kubectl scale deployment advancia-backend-green -n $NAMESPACE --replicas=0
    
    log_info "Blue-green rollback completed"
}

# Rollback canary deployment
rollback_canary() {
    log_info "Rolling back canary deployment..."
    
    # Set canary traffic to 0%
    kubectl patch rollout advancia-backend -n $NAMESPACE \
        -p '{"spec":{"strategy":{"canary":{"steps":[{"setWeight":0}]}}}}'
    
    # Wait for traffic to be fully routed to stable
    sleep 30
    
    log_info "Canary rollback completed"
}

# Verify rollback
verify_rollback() {
    log_info "Verifying rollback..."
    
    # Check deployment status
    local status=$(kubectl rollout status deployment/advancia-backend -n $NAMESPACE --timeout=300s)
    
    if [ $? -eq 0 ]; then
        log_info "Rollback verification passed"
        return 0
    else
        log_error "Rollback verification failed"
        return 1
    fi
}

# Post-rollback health check
post_rollback_health_check() {
    log_info "Running post-rollback health check..."
    
    # Get service URL
    local service_url
    case $ENVIRONMENT in
        dev)
            service_url="https://dev-api.advancia.com"
            ;;
        staging)
            service_url="https://staging-api.advancia.com"
            ;;
        prod)
            service_url="https://api.advancia.com"
            ;;
    esac
    
    # Health check
    for i in {1..30}; do
        if curl -f "$service_url/health" > /dev/null 2>&1; then
            log_info "Post-rollback health check passed"
            return 0
        fi
        log_warn "Health check failed, retrying... ($i/30)"
        sleep 10
    done
    
    log_error "Post-rollback health check failed"
    return 1
}

# Notify team about rollback
notify_rollback() {
    log_info "Sending rollback notification..."
    
    # Send Slack notification if webhook is configured
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local message="🚨 Rollback Alert: $ENVIRONMENT environment has been rolled back to previous version"
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL" || log_warn "Failed to send Slack notification"
    fi
    
    # Send email notification if configured
    if [ -n "$ROLLBACK_EMAIL_RECIPIENTS" ]; then
        echo "Rollback notification for $ENVIRONMENT environment" | \
            mail -s "Rollback Alert - $ENVIRONMENT" "$ROLLBACK_EMAIL_RECIPIENTS" || \
            log_warn "Failed to send email notification"
    fi
}

# Create rollback record
create_rollback_record() {
    log_info "Creating rollback record..."
    
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local previous_revision=$(get_previous_revision)
    
    # This would typically create a record in your audit log
    # For now, we'll just log it
    echo "[$timestamp] Rollback performed in $ENVIRONMENT environment to revision $previous_revision" >> \
        /var/log/advancia/rollback.log
    
    log_info "Rollback record created"
}

# Main rollback flow
main() {
    log_info "Starting rollback for $ENVIRONMENT environment..."
    
    validate_environment
    check_prerequisites
    
    # Determine deployment strategy and rollback accordingly
    local deployment_strategy=$(kubectl get deployment advancia-backend -n $NAMESPACE -o jsonpath='{.metadata.labels.deployment\.strategy}' 2>/dev/null || echo "standard")
    
    case $deployment_strategy in
        "blue-green")
            rollback_blue_green
            ;;
        "canary")
            rollback_canary
            ;;
        *)
            rollback_deployment
            ;;
    esac
    
    # Verify rollback
    if verify_rollback; then
        # Post-rollback health check
        if post_rollback_health_check; then
            notify_rollback
            create_rollback_record
            log_info "Rollback completed successfully!"
        else
            log_error "Post-rollback health check failed"
            exit 1
        fi
    else
        log_error "Rollback verification failed"
        exit 1
    fi
}

# Handle script interruption
trap 'log_error "Rollback interrupted"; exit 1' INT TERM

# Run main function
main "$@"
