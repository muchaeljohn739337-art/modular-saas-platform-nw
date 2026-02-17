# Sprint 8: DevOps Release Pipeline v1

## Issue 38: Implement deployment service skeleton

**Labels:** `sprint-8`, `devops`, `infrastructure`, `priority-high`

**Description:**  
Create service to orchestrate deployments with proper tracking and event emission.

**Tasks:**
- [ ] Create `deployments` table with deployment tracking
- [ ] Implement `POST /deploy` endpoint
- [ ] Implement `POST /deploy/rollback` endpoint
- [ ] Emit deploy events to event bus
- [ ] Add deployment status tracking

**Acceptance criteria:**
- [ ] Deploy requests stored with full metadata
- [ ] Deployment events emitted for monitoring
- [ ] Rollback functionality works correctly
- [ ] Deployment status updates in real-time

**Technical implementation:**
```typescript
// services/deployment/deploymentService.ts
class DeploymentService {
  async createDeployment(config: DeploymentConfig): Promise<Deployment>;
  async executeDeployment(deploymentId: string): Promise<void>;
  async rollbackDeployment(deploymentId: string): Promise<void>;
  async updateDeploymentStatus(id: string, status: DeploymentStatus): Promise<void>;
}
```

**Database schema:**
```sql
-- Add to schema.prisma
model Deployment {
  id          String           @id @default(cuid())
  tenantId    String
  version     String
  status      DeploymentStatus @default(PENDING)
  strategy    DeploymentStrategy @default(BLUE_GREEN)
  createdAt   DateTime         @default(now())
  startedAt   DateTime?
  completedAt DateTime?
  metadata    Json?
  
  @@index([tenantId, status])
}
```

**Files to modify:**
- `backend/src/services/deployment/deploymentService.ts` (new)
- `backend/src/controllers/deployment.controller.ts` (new)
- `backend/prisma/schema.prisma` (add deployment table)
- `backend/src/routes/deployment.ts` (new)

---

## Issue 39: Implement blue/green deployment strategy

**Labels:** `sprint-8`, `devops`, `infrastructure`, `priority-high`

**Description:**  
Enable safe zero-downtime deployments using blue/green strategy.

**Tasks:**
- [ ] Deploy new version to "green" environment
- [ ] Implement health checks for green environment
- [ ] Switch traffic from blue to green
- [ ] Keep "blue" environment for rollback capability
- [ ] Add traffic routing configuration

**Acceptance criteria:**
- [ ] Blue/green deploy works in dev environment
- [ ] Zero downtime during deployment
- [ ] Rollback possible within 30 seconds
- [ ] Health checks prevent bad deployments

**Technical implementation:**
```typescript
// services/deployment/blueGreenStrategy.ts
class BlueGreenStrategy {
  async deployToGreen(config: DeploymentConfig): Promise<void>;
  async healthCheckGreen(): Promise<boolean>;
  async switchTraffic(): Promise<void>;
  async rollbackToBlue(): Promise<void>;
}
```

**Infrastructure changes:**
```yaml
# k8s/blue-green-deployment.yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: advancia-backend
spec:
  strategy:
    blueGreen:
      activeService: advancia-backend-active
      previewService: advancia-backend-preview
```

**Files to modify:**
- `backend/src/services/deployment/blueGreenStrategy.ts` (new)
- `infra/k8s/blue-green-deployment.yaml` (new)
- `backend/src/services/deployment/deploymentService.ts` (update)

---

## Issue 40: Implement canary deployment strategy

**Description:**  
Roll out to small percentage of traffic first with gradual promotion.

**Labels:** `sprint-8`, `devops`, `infrastructure`, `priority-medium`

**Tasks:**
- [ ] Implement canary routing rules
- [ ] Add canary health checks
- [ ] Implement gradual traffic shifting
- [ ] Add automatic promotion or rollback
- [ ] Create canary metrics dashboard

**Acceptance criteria:**
- [ ] Canary deploy works in dev environment
- [ ] Traffic gradually shifts from 5% to 100%
- [ ] Automatic rollback on health check failure
- [ ] Canary metrics visible in dashboard

**Technical implementation:**
```typescript
// services/deployment/canaryStrategy.ts
class CanaryStrategy {
  async deployCanary(config: DeploymentConfig): Promise<void>;
  async setCanaryTrafficWeight(weight: number): Promise<void>;
  async healthCheckCanary(): Promise<boolean>;
  async promoteCanary(): Promise<void>;
  async rollbackCanary(): Promise<void>;
}
```

**Infrastructure changes:**
```yaml
# k8s/canary-deployment.yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: advancia-backend
spec:
  strategy:
    canary:
      steps:
      - setWeight: 5
      - pause: {duration: 10m}
      - setWeight: 20
      - pause: {duration: 10m}
      - setWeight: 50
      - pause: {duration: 10m}
```

**Files to modify:**
- `backend/src/services/deployment/canaryStrategy.ts` (new)
- `infra/k8s/canary-deployment.yaml` (new)
- `backend/src/services/deployment/deploymentService.ts` (update)

---

## Issue 41: Add CI/CD pipelines

**Labels:** `sprint-8`, `devops`, `automation`, `priority-high`

**Description:**  
Automate build, test, and deployment processes with proper environment promotion.

**Tasks:**
- [ ] Create build pipeline (Docker image creation)
- [ ] Create test pipeline (unit, integration, security)
- [ ] Create deploy pipeline (environment promotion)
- [ ] Add automated rollback on failure
- [ ] Implement environment promotion gates

**Acceptance criteria:**
- [ ] Code pushed → CI pipeline runs automatically
- [ ] Deploy triggered via pipeline with approval
- [ ] All tests pass before deployment
- [ ] Automatic rollback on deployment failure

**CI/CD Pipeline:**
```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t advancia-backend:${{ github.sha }} .
  
  test:
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Run tests
        run: npm test
      - name: Run security scan
        run: npm audit
  
  deploy-dev:
    runs-on: ubuntu-latest
    needs: [build, test]
    if: github.ref == 'refs/heads/develop'
    steps:
      - name: Deploy to dev
        run: ./scripts/deploy.sh dev
  
  deploy-prod:
    runs-on: ubuntu-latest
    needs: [build, test]
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: ./scripts/deploy.sh prod
```

**Files to modify:**
- `.github/workflows/ci-cd.yml` (new)
- `scripts/deploy.sh` (new)
- `scripts/health-check.sh` (new)

---

## Issue 42: Frontend — Deployment dashboard

**Labels:** `sprint-8`, `frontend`, `devops`, `priority-medium`

**Description:**  
Add UI for deployment history, status, and manual deployment triggers.

**Tasks:**
- [ ] Create deployment timeline view
- [ ] Add deployment status indicators
- [ ] Implement manual deploy trigger (Admin/Owner only)
- [ ] Add rollback button with confirmation
- [ ] Show deployment metrics and logs

**Acceptance criteria:**
- [ ] Admin can view deployment history
- [ ] Owner can trigger manual deployments
- [ ] Rollback functionality available in UI
- [ ] Real-time deployment status updates

**Technical implementation:**
```typescript
// components/DeploymentDashboard.tsx
interface DeploymentDashboardProps {
  tenantId: string;
  userRole: UserRole;
}

const DeploymentDashboard: React.FC<DeploymentDashboardProps> = ({ tenantId, userRole }) => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  
  const handleDeploy = async (environment: string) => {
    // Deploy implementation
  };
  
  const handleRollback = async (deploymentId: string) => {
    // Rollback implementation
  };
};
```

**Files to modify:**
- `frontend/components/DeploymentDashboard.tsx` (new)
- `frontend/app/admin/deployments/page.tsx` (new)
- `frontend/lib/api/deployments.ts` (new API client)
- `frontend/hooks/useDeployments.ts` (new hook)

---

## Sprint 8 Summary

**Focus:** DevOps Release Pipeline v1
**Duration:** 2 weeks
**Priority:** High - Critical for reliable deployments

**Key Deliverables:**
- Deployment orchestration service
- Blue/green and canary deployment strategies
- Automated CI/CD pipelines
- Deployment management dashboard

**Dependencies:**
- Sprint 7 (Web3 Reliability) must be complete
- Kubernetes infrastructure ready
- Container registry access configured

**Success Metrics:**
- Zero-downtime deployments
- Automated rollback within 30 seconds
- 100% automated testing before deployment
- Complete deployment visibility

**Risk Mitigation:**
- Health checks prevent bad deployments
- Blue/green strategy enables instant rollback
- Canary strategy reduces risk of gradual rollouts
- Comprehensive testing prevents regressions
