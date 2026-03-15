# Advancia PayLedger - Production Deployment Guide

## Pre-Deployment Requirements

### Infrastructure
- [ ] AWS account with appropriate permissions
- [ ] Neon PostgreSQL database provisioned
- [ ] Redis cluster configured
- [ ] Kubernetes cluster (EKS) ready
- [ ] Cloudflare account configured
- [ ] Vercel project created
- [ ] Domain registered and DNS configured

### Credentials & Secrets
- [ ] Database credentials secured in AWS Secrets Manager
- [ ] JWT secrets generated and stored
- [ ] Stripe API keys configured
- [ ] Sentry DSN obtained
- [ ] GitHub personal access token created
- [ ] Docker registry credentials set up

### Team & Access
- [ ] DevOps team access to AWS
- [ ] Database admin credentials distributed
- [ ] On-call rotation established
- [ ] Incident response procedures documented
- [ ] Runbooks created and reviewed

---

## Phase 1: Infrastructure Setup (Week 1)

### 1.1 Database Setup

#### Create Neon PostgreSQL Database
```bash
# Using Neon CLI
neon project create --name advancia-payledger-prod

# Get connection string
neon connection-string --project advancia-payledger-prod
```

#### Initialize Database Schema
```bash
# Set environment variable
export DATABASE_URL="postgresql://..."

# Run migrations
npm run prisma:migrate -- --name initial_schema

# Apply RLS policies
npm run prisma:migrate -- --name add_rls_policies

# Seed initial data
npm run prisma:seed
```

#### Verify Database
```bash
# Check tables created
psql $DATABASE_URL -c "\dt"

# Verify RLS enabled
psql $DATABASE_URL -c "SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE rowsecurity = true;"

# Test connection
npm run db:verify
```

### 1.2 Redis Setup

#### Create Redis Cluster (AWS ElastiCache)
```bash
aws elasticache create-replication-group \
  --replication-group-description "Advancia PayLedger Redis" \
  --engine redis \
  --engine-version 7.0 \
  --cache-node-type cache.r6g.xlarge \
  --num-cache-clusters 3 \
  --automatic-failover-enabled \
  --multi-az-enabled
```

#### Configure Redis Security
```bash
# Create security group
aws ec2 create-security-group \
  --group-name advancia-redis-sg \
  --description "Redis security group"

# Allow inbound on port 6379
aws ec2 authorize-security-group-ingress \
  --group-name advancia-redis-sg \
  --protocol tcp \
  --port 6379 \
  --source-security-group-id sg-xxxxx
```

#### Test Redis Connection
```bash
redis-cli -h <redis-endpoint> -p 6379 ping
# Should return: PONG
```

### 1.3 Kubernetes Cluster Setup

#### Create EKS Cluster
```bash
eksctl create cluster \
  --name advancia-payledger-prod \
  --version 1.27 \
  --region us-east-1 \
  --nodegroup-name standard-nodes \
  --node-type t3.xlarge \
  --nodes 3 \
  --nodes-min 3 \
  --nodes-max 10 \
  --managed
```

#### Configure kubectl
```bash
aws eks update-kubeconfig \
  --region us-east-1 \
  --name advancia-payledger-prod
```

#### Install Required Add-ons
```bash
# Install metrics-server
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Install ingress-nginx
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx

# Install cert-manager
helm repo add jetstack https://charts.jetstack.io
helm install cert-manager jetstack/cert-manager --set installCRDs=true
```

### 1.4 Container Registry Setup

#### Create ECR Repository
```bash
aws ecr create-repository \
  --repository-name advancia-payledger \
  --region us-east-1
```

#### Configure Docker Login
```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
```

---

## Phase 2: Application Deployment (Week 2)

### 2.1 Build Docker Images

#### Build All Services
```bash
# Backend
docker build -t advancia-backend:latest ./backend
docker tag advancia-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/advancia-payledger:backend-latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/advancia-payledger:backend-latest

# Frontend
docker build -t advancia-frontend:latest ./frontend
docker tag advancia-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/advancia-payledger:frontend-latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/advancia-payledger:frontend-latest

# Auth Service
docker build -t advancia-auth:latest ./services/auth-service
docker tag advancia-auth:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/advancia-payledger:auth-latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/advancia-payledger:auth-latest

# Billing Service
docker build -t advancia-billing:latest ./services/billing-service
docker tag advancia-billing:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/advancia-payledger:billing-latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/advancia-payledger:billing-latest

# Payment Service
docker build -t advancia-payment:latest ./services/payment-service
docker tag advancia-payment:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/advancia-payledger:payment-latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/advancia-payledger:payment-latest

# Metering Service
docker build -t advancia-metering:latest ./services/metering-service
docker tag advancia-metering:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/advancia-payledger:metering-latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/advancia-payledger:metering-latest

# Tenant Service
docker build -t advancia-tenant:latest ./services/tenant-service
docker tag advancia-tenant:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/advancia-payledger:tenant-latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/advancia-payledger:tenant-latest

# Web3 Service
docker build -t advancia-web3:latest ./services/web3-event-service
docker tag advancia-web3:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/advancia-payledger:web3-latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/advancia-payledger:web3-latest
```

### 2.2 Deploy to Kubernetes

#### Create Namespace
```bash
kubectl create namespace advancia
kubectl label namespace advancia environment=production
```

#### Create Secrets
```bash
# Database credentials
kubectl create secret generic db-credentials \
  --from-literal=DATABASE_URL=$DATABASE_URL \
  -n advancia

# JWT secrets
kubectl create secret generic jwt-secrets \
  --from-literal=JWT_SECRET=$JWT_SECRET \
  --from-literal=JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET \
  -n advancia

# Payment credentials
kubectl create secret generic payment-credentials \
  --from-literal=STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY \
  --from-literal=PLAID_CLIENT_ID=$PLAID_CLIENT_ID \
  --from-literal=PLAID_SECRET=$PLAID_SECRET \
  -n advancia

# Redis credentials
kubectl create secret generic redis-credentials \
  --from-literal=REDIS_URL=$REDIS_URL \
  -n advancia
```

#### Deploy Services
```bash
# Apply Kubernetes manifests
kubectl apply -f infra/k8s/base/ -n advancia

# Wait for deployments
kubectl rollout status deployment/backend -n advancia
kubectl rollout status deployment/auth-service -n advancia
kubectl rollout status deployment/billing-service -n advancia
kubectl rollout status deployment/payment-service -n advancia
kubectl rollout status deployment/metering-service -n advancia
kubectl rollout status deployment/tenant-service -n advancia
kubectl rollout status deployment/web3-service -n advancia
```

#### Verify Deployments
```bash
# Check pod status
kubectl get pods -n advancia

# Check service endpoints
kubectl get svc -n advancia

# Check logs
kubectl logs -f deployment/backend -n advancia
```

### 2.3 Configure Ingress

#### Create TLS Certificate
```bash
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: advancia-cert
  namespace: advancia
spec:
  secretName: advancia-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
    - api.advanciapayledger.com
    - app.advanciapayledger.com
EOF
```

#### Create Ingress
```bash
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: advancia-ingress
  namespace: advancia
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - api.advanciapayledger.com
        - app.advanciapayledger.com
      secretName: advancia-tls
  rules:
    - host: api.advanciapayledger.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 3001
    - host: app.advanciapayledger.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 3000
EOF
```

### 2.4 Deploy Frontend to Vercel

#### Connect Repository
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Configure Environment Variables
```bash
vercel env add NEXT_PUBLIC_API_URL https://api.advanciapayledger.com
vercel env add NEXT_PUBLIC_ENVIRONMENT production
```

---

## Phase 3: Verification & Testing (Week 2)

### 3.1 Health Checks

#### Check All Services
```bash
# Backend
curl https://api.advanciapayledger.com/health

# Auth Service
curl https://api.advanciapayledger.com/auth/health

# Billing Service
curl https://api.advanciapayledger.com/billing/health

# Payment Service
curl https://api.advanciapayledger.com/payment/health

# Frontend
curl https://app.advanciapayledger.com
```

### 3.2 Smoke Tests

#### Run Test Suite
```bash
npm run test:smoke

# Expected output: All tests passing
```

#### Manual Testing
- [ ] User registration
- [ ] User login
- [ ] Create invoice
- [ ] Process payment
- [ ] View dashboard

### 3.3 Load Testing

#### Run Load Tests
```bash
npm run test:load -- --duration 5m --rps 100

# Expected: P95 latency < 1s, error rate < 0.1%
```

### 3.4 Security Verification

#### Run Security Scan
```bash
npm audit
npm run security:scan
```

#### Verify HTTPS
```bash
curl -I https://api.advanciapayledger.com
# Check for Strict-Transport-Security header
```

---

## Phase 4: Monitoring Setup (Week 3)

### 4.1 Configure Prometheus

```bash
kubectl apply -f infra/monitoring/prometheus-config.yaml -n advancia
```

### 4.2 Deploy Grafana

```bash
helm install grafana grafana/grafana \
  --namespace advancia \
  --set adminPassword=$GRAFANA_PASSWORD
```

### 4.3 Configure Sentry

```bash
# Update Sentry DSN in all services
kubectl set env deployment/backend SENTRY_DSN=$SENTRY_DSN -n advancia
kubectl set env deployment/auth-service SENTRY_DSN=$SENTRY_DSN -n advancia
# ... repeat for all services
```

### 4.4 Setup Alerting

```bash
kubectl apply -f infra/monitoring/alerting-rules.yaml -n advancia
```

---

## Phase 5: Cutover & Go-Live (Week 3)

### 5.1 DNS Cutover

#### Update DNS Records
```bash
# Point to Kubernetes ingress
api.advanciapayledger.com -> <ingress-ip>
app.advanciapayledger.com -> <vercel-domain>
```

#### Verify DNS
```bash
nslookup api.advanciapayledger.com
nslookup app.advanciapayledger.com
```

### 5.2 Data Migration

#### Backup Old Data
```bash
pg_dump old_database > backup-$(date +%Y%m%d).sql
```

#### Migrate Data
```bash
psql $DATABASE_URL < migration-script.sql
```

#### Verify Data
```bash
npm run db:verify
```

### 5.3 Announce Go-Live

- [ ] Notify customers
- [ ] Update status page
- [ ] Brief support team
- [ ] Monitor closely

---

## Post-Deployment (Week 4+)

### 6.1 Monitoring & Optimization

- Monitor error rates and latency
- Optimize slow queries
- Fine-tune resource allocation
- Gather performance metrics

### 6.2 Documentation

- [ ] Update runbooks
- [ ] Document incidents
- [ ] Create post-mortems
- [ ] Update architecture diagrams

### 6.3 Team Training

- [ ] Train support team
- [ ] Conduct incident drills
- [ ] Review runbooks
- [ ] Establish on-call rotation

---

## Rollback Procedure

If critical issues occur:

```bash
# 1. Identify issue
kubectl logs -f deployment/<service> -n advancia

# 2. Rollback deployment
kubectl rollout undo deployment/<service> -n advancia

# 3. Verify rollback
kubectl rollout status deployment/<service> -n advancia

# 4. Check service health
curl https://api.advanciapayledger.com/health

# 5. Restore database if needed
psql $DATABASE_URL < backup.sql

# 6. Notify stakeholders
```

---

## Troubleshooting

### Service Won't Start
```bash
# Check pod logs
kubectl logs <pod-name> -n advancia

# Check events
kubectl describe pod <pod-name> -n advancia

# Check resource limits
kubectl top pods -n advancia
```

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check connection pool
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Restart connection pool
kubectl rollout restart deployment/backend -n advancia
```

### Payment Processing Failures
```bash
# Check Stripe connectivity
npm run test:stripe-connection

# Review payment logs
kubectl logs -f deployment/payment-service -n advancia

# Check pending transactions
npm run check:pending-payments
```

---

## Support & Escalation

- **DevOps Lead**: [Contact]
- **Database Admin**: [Contact]
- **Security Team**: [Contact]
- **On-Call Engineer**: [PagerDuty]

---

**Last Updated**: March 9, 2026  
**Status**: Ready for Deployment
