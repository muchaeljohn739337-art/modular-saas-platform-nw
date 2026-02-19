#!/bin/bash

# Deployment script for Advancia SaaS Platform
# Usage: ./scripts/deploy.sh [environment]

set -e

# Configuration
ENVIRONMENT=${1:-dev}
IMAGE_TAG=${IMAGE_TAG:-latest}
REGISTRY="ghcr.io"
REPO_NAME="${GITHUB_REPOSITORY:-advancia/modular-saas-platform}"

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
            log_info "Deploying to $ENVIRONMENT environment"
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
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "docker is not installed"
        exit 1
    fi
    
    # Check if we have access to the registry
    if ! docker pull $REGISTRY/$REPO_NAME:$IMAGE_TAG &> /dev/null; then
        log_error "Cannot pull image from registry"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

# Deploy to Kubernetes
deploy_kubernetes() {
    log_info "Deploying to Kubernetes..."
    
    # Set namespace
    NAMESPACE="advancia-$ENVIRONMENT"
    kubectl config set-context --current --namespace=$NAMESPACE
    
    # Apply configurations
    log_info "Applying configurations..."
    
    # ConfigMaps
    kubectl apply -f infra/k8s/configmaps/$ENVIRONMENT.yaml
    
    # Secrets
    kubectl apply -f infra/k8s/secrets/$ENVIRONMENT.yaml
    
    # Deployments
    if [ "$ENVIRONMENT" = "prod" ]; then
        # Use blue-green for production
        kubectl apply -f infra/k8s/blue-green-deployment.yaml
        kubectl patch rollout advancia-backend -p '{"spec":{"template":{"spec":{"containers":[{"name":"backend","image":"'$REGISTRY/$REPO_NAME:$IMAGE_TAG'"}]}}}}'
    else
        # Use standard deployment for dev/staging
        kubectl apply -f infra/k8s/deployment.yaml
        kubectl set image deployment/advancia-backend backend=$REGISTRY/$REPO_NAME:$IMAGE_TAG
    fi
    
    # Services
    kubectl apply -f infra/k8s/services/
    
    # Ingress
    kubectl apply -f infra/k8s/ingress/$ENVIRONMENT.yaml
    
    log_info "Kubernetes deployment completed"
}

# Wait for deployment
wait_for_deployment() {
    log_info "Waiting for deployment to be ready..."
    
    if [ "$ENVIRONMENT" = "prod" ]; then
        kubectl wait --for=condition=Complete rollout advancia-backend --timeout=600s
    else
        kubectl rollout status deployment/advancia-backend --timeout=600s
    fi
    
    log_info "Deployment is ready"
}

# Update database
update_database() {
    log_info "Updating database..."
    
    # Run database migrations
    kubectl run migration-$ENVIRONMENT --image=$REGISTRY/$REPO_NAME:$IMAGE_TAG \
        --restart=Never --rm -i --tty \
        --env="DATABASE_URL=$DATABASE_URL" \
        --command -- npx prisma migrate deploy
    
    # Seed database if needed
    if [ "$ENVIRONMENT" = "dev" ]; then
        kubectl run seed-$ENVIRONMENT --image=$REGISTRY/$REPO_NAME:$IMAGE_TAG \
            --restart=Never --rm -i --tty \
            --env="DATABASE_URL=$DATABASE_URL" \
            --command -- npx prisma db seed
    fi
    
    log_info "Database update completed"
}

# Post-deployment checks
post_deployment_checks() {
    log_info "Running post-deployment checks..."
    
    # Get service URL
    SERVICE_URL=$(kubectl get ingress advancia-$ENVIRONMENT -o jsonpath='{.spec.rules[0].host}')
    
    # Health check
    for i in {1..30}; do
        if curl -f "https://$SERVICE_URL/health" > /dev/null 2>&1; then
            log_info "Health check passed"
            break
        fi
        log_warn "Health check failed, retrying... ($i/30)"
        sleep 10
    done
    
    # Run smoke tests
    log_info "Running smoke tests..."
    npm run test:smoke -- --baseUrl="https://$SERVICE_URL"
    
    log_info "Post-deployment checks completed"
}

# Main deployment flow
main() {
    log_info "Starting deployment to $ENVIRONMENT environment..."
    
    validate_environment
    check_prerequisites
    deploy_kubernetes
    wait_for_deployment
    update_database
    post_deployment_checks
    
    log_info "Deployment to $ENVIRONMENT completed successfully!"
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"
