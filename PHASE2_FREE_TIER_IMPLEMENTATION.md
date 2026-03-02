# Phase 2 Implementation - Free Tier Strategy

## 🎯 Goal: $0/month Monitoring & Security Stack

This guide implements all Phase 2 requirements using **100% free tools** until you have revenue.

---

## 📋 Quick Start Checklist

- [ ] Snyk free tier (security scanning)
- [ ] OpenAPI/Swagger (API docs)
- [ ] Prometheus + Grafana (monitoring)
- [ ] Basic compliance documentation
- [ ] KYC pay-per-use setup (Stripe Identity)

**Total Monthly Cost: $0** ✨

---

## 1. Snyk Integration (FREE Tier)

### Free Tier Limits:
- ✅ 200 tests per month
- ✅ Unlimited public repos
- ✅ Basic vulnerability database
- ✅ GitHub integration

### Implementation:

#### Step 1: Sign Up
```bash
# Visit https://snyk.io
# Sign up with GitHub account (free)
# Connect your repository
```

#### Step 2: Create GitHub Workflow

Create `.github/workflows/snyk-free.yml`:
```yaml
name: Snyk Security Scan (Free Tier)

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday

jobs:
  snyk-scan:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install Snyk CLI
        run: npm install -g snyk
      
      - name: Snyk Auth
        run: snyk auth ${{ secrets.SNYK_TOKEN }}
      
      - name: Snyk Test Backend
        working-directory: backend
        run: snyk test --severity-threshold=high
        continue-on-error: true
      
      - name: Snyk Test Frontend
        working-directory: frontend
        run: snyk test --severity-threshold=high
        continue-on-error: true
      
      - name: Snyk Monitor (Track Dependencies)
        working-directory: backend
        run: snyk monitor
```

#### Step 3: Add Snyk Token
1. Go to Snyk dashboard → Settings → API Token
2. Copy token
3. GitHub repo → Settings → Secrets → New secret
4. Name: `SNYK_TOKEN`, Value: your token

#### Step 4: Add Badge to README
```markdown
[![Snyk Security](https://snyk.io/test/github/YOUR_USERNAME/YOUR_REPO/badge.svg)](https://snyk.io/test/github/YOUR_USERNAME/YOUR_REPO)
```

---

## 2. OpenAPI/Swagger Documentation (FREE)

### Implementation:

#### Step 1: Install Dependencies
```bash
cd backend
npm install swagger-jsdoc swagger-ui-express
npm install -D @types/swagger-jsdoc @types/swagger-ui-express
```

#### Step 2: Create Swagger Config

Create `backend/src/config/swagger.ts`:
```typescript
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Advancia PayLedger API',
      version: '1.0.0',
      description: 'Healthcare payment processing and financial management platform',
      contact: {
        name: 'API Support',
        email: 'support@advanciapayledger.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development'
      },
      {
        url: 'https://api.advanciapayledger.com',
        description: 'Production'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            role: { type: 'string', enum: ['user', 'admin', 'provider'] }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            amount: { type: 'number', description: 'Amount in cents' },
            status: { type: 'string', enum: ['pending', 'completed', 'failed'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts']
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  // Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Advancia API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true
    }
  }));
  
  // OpenAPI JSON
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  console.log('📚 Swagger docs available at /api-docs');
};

export default swaggerSpec;
```

#### Step 3: Add to Express App

Update `backend/src/app.ts`:
```typescript
import { setupSwagger } from './config/swagger';

// After middleware, before routes
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DOCS === 'true') {
  setupSwagger(app);
}
```

#### Step 4: Document Routes

Example for `backend/src/routes/auth.ts`:
```typescript
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', loginController);
```

#### Step 5: Access Documentation
- Local: `http://localhost:3001/api-docs`
- Production: `https://api.advanciapayledger.com/api-docs`

---

## 3. Prometheus + Grafana (FREE, Self-Hosted)

### Implementation:

#### Step 1: Install Prometheus Client
```bash
cd backend
npm install prom-client
```

#### Step 2: Create Metrics Service

Create `backend/src/services/metrics.ts`:
```typescript
import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';

export const register = new Registry();

// Collect default metrics (CPU, memory, etc.)
collectDefaultMetrics({ register });

// HTTP Metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

export const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Business Metrics
export const paymentsTotal = new Counter({
  name: 'payments_total',
  help: 'Total payments processed',
  labelNames: ['status', 'type']
});

export const paymentsAmount = new Counter({
  name: 'payments_amount_cents',
  help: 'Total payment amount in cents',
  labelNames: ['currency']
});

export const activeUsers = new Gauge({
  name: 'active_users_total',
  help: 'Currently active users'
});

export const walletBalance = new Gauge({
  name: 'wallet_balance_cents',
  help: 'Total wallet balance in cents',
  labelNames: ['currency']
});

// Database Metrics
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
});

export const dbConnectionsActive = new Gauge({
  name: 'db_connections_active',
  help: 'Active database connections'
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(paymentsTotal);
register.registerMetric(paymentsAmount);
register.registerMetric(activeUsers);
register.registerMetric(walletBalance);
register.registerMetric(dbQueryDuration);
register.registerMetric(dbConnectionsActive);

// Middleware
export const metricsMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );
    
    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });
  });
  
  next();
};

// Helper functions
export const trackPayment = (status: string, type: string, amount: number, currency = 'USD') => {
  paymentsTotal.inc({ status, type });
  paymentsAmount.inc({ currency }, amount);
};

export const updateActiveUsers = (count: number) => {
  activeUsers.set(count);
};

export const updateWalletBalance = (balance: number, currency = 'USD') => {
  walletBalance.set({ currency }, balance);
};

export const trackDbQuery = (operation: string, table: string, duration: number) => {
  dbQueryDuration.observe({ operation, table }, duration);
};
```

#### Step 3: Add Metrics Endpoint

Create `backend/src/routes/metrics.ts`:
```typescript
import { Router } from 'express';
import { register } from '../services/metrics';

const router = Router();

router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

export default router;
```

#### Step 4: Update App

Update `backend/src/app.ts`:
```typescript
import { metricsMiddleware } from './services/metrics';
import metricsRouter from './routes/metrics';

// Add early in middleware chain
app.use(metricsMiddleware);

// Add metrics endpoint
app.use('/api', metricsRouter);
```

#### Step 5: Use Metrics in Controllers

Example in `backend/src/controllers/payments.ts`:
```typescript
import { trackPayment } from '../services/metrics';

export const createPayment = async (req: Request, res: Response) => {
  try {
    const payment = await prisma.payment.create({ data: req.body });
    
    // Track metric
    trackPayment('completed', 'transfer', payment.amount);
    
    res.json({ success: true, data: payment });
  } catch (error) {
    trackPayment('failed', 'transfer', 0);
    res.status(500).json({ success: false, error: 'Payment failed' });
  }
};
```

#### Step 6: Deploy Prometheus + Grafana

Create `infrastructure/monitoring/docker-compose.yml`:
```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    restart: unless-stopped
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_SERVER_ROOT_URL=http://localhost:3000
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    restart: unless-stopped
    networks:
      - monitoring
    depends_on:
      - prometheus

volumes:
  prometheus-data:
  grafana-data:

networks:
  monitoring:
    driver: bridge
```

Create `infrastructure/monitoring/prometheus.yml`:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'advancia-backend'
    static_configs:
      - targets: ['host.docker.internal:3001']
    metrics_path: '/api/metrics'
    scrape_interval: 10s
```

#### Step 7: Create Grafana Dashboards

Create `infrastructure/monitoring/grafana/provisioning/datasources/prometheus.yml`:
```yaml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
```

Create `infrastructure/monitoring/grafana/provisioning/dashboards/dashboard.yml`:
```yaml
apiVersion: 1

providers:
  - name: 'Advancia Dashboards'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
```

#### Step 8: Start Monitoring Stack
```bash
cd infrastructure/monitoring
docker-compose up -d

# Access:
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin)
```

#### Step 9: Import Pre-built Dashboard

In Grafana:
1. Go to Dashboards → Import
2. Use ID: `1860` (Node Exporter Full)
3. Select Prometheus datasource
4. Import

---

## 4. Basic Compliance Documentation (FREE)

### Manual Compliance Tracking

Create `docs/compliance/COMPLIANCE_CHECKLIST.md`:
```markdown
# Compliance Checklist

## HIPAA Requirements

### Administrative Safeguards
- [x] Security Management Process
- [x] Assigned Security Responsibility
- [x] Workforce Security
- [x] Information Access Management
- [ ] Security Awareness Training
- [ ] Security Incident Procedures
- [ ] Contingency Plan
- [ ] Business Associate Agreements

### Physical Safeguards
- [x] Facility Access Controls
- [x] Workstation Use
- [x] Workstation Security
- [x] Device and Media Controls

### Technical Safeguards
- [x] Access Control (RLS implemented)
- [x] Audit Controls (logging enabled)
- [x] Integrity Controls (checksums)
- [x] Transmission Security (HTTPS/TLS)

## SOC 2 Type II (When Needed)

### Trust Service Criteria
- [x] Security
- [ ] Availability
- [ ] Processing Integrity
- [ ] Confidentiality
- [ ] Privacy

## Evidence Collection

### Quarterly Reviews
- Access logs review
- Security incident review
- Vendor risk assessment
- Employee training records

### Annual Audits
- Penetration testing
- Vulnerability assessment
- Policy review and updates
- Disaster recovery testing
```

---

## 5. KYC Integration - Pay Per Use (Stripe Identity)

### Why Stripe Identity?
- ✅ $1.50 per verification (cheapest)
- ✅ No monthly fees
- ✅ Easy integration
- ✅ Already using Stripe for payments

### Implementation:

#### Step 1: Enable Stripe Identity
```bash
# In Stripe Dashboard:
# 1. Go to Products → Identity
# 2. Enable Identity
# 3. Get your API keys
```

#### Step 2: Install Stripe
```bash
cd backend
npm install stripe
# Already installed in your project
```

#### Step 3: Create KYC Service

Create `backend/src/services/kyc-stripe.ts`:
```typescript
import Stripe from 'stripe';
import prisma from '../lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export class StripeKYCService {
  async createVerificationSession(userId: string) {
    try {
      const session = await stripe.identity.verificationSessions.create({
        type: 'document',
        metadata: {
          userId
        },
        options: {
          document: {
            require_matching_selfie: true
          }
        }
      });
      
      await prisma.kycVerification.create({
        data: {
          userId,
          sessionId: session.id,
          provider: 'stripe',
          status: 'pending'
        }
      });
      
      return session;
    } catch (error) {
      console.error('KYC session creation failed:', error);
      throw error;
    }
  }
  
  async checkStatus(sessionId: string) {
    const session = await stripe.identity.verificationSessions.retrieve(sessionId);
    
    const statusMap: Record<string, string> = {
      'verified': 'approved',
      'requires_input': 'pending',
      'canceled': 'cancelled',
      'processing': 'pending'
    };
    
    const status = statusMap[session.status] || 'pending';
    
    await prisma.kycVerification.update({
      where: { sessionId },
      data: {
        status,
        completedAt: status === 'approved' ? new Date() : null
      }
    });
    
    return status;
  }
  
  async handleWebhook(event: Stripe.Event) {
    if (event.type === 'identity.verification_session.verified') {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      await this.checkStatus(session.id);
    }
  }
}

export default new StripeKYCService();
```

#### Step 4: Add KYC Routes

Create `backend/src/routes/kyc.ts`:
```typescript
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import kycService from '../services/kyc-stripe';

const router = Router();

router.post('/verify', authenticateToken, async (req, res) => {
  try {
    const session = await kycService.createVerificationSession(req.user.id);
    
    res.json({
      success: true,
      data: {
        sessionId: session.id,
        clientSecret: session.client_secret,
        url: session.url
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'KYC session creation failed' });
  }
});

router.get('/status', authenticateToken, async (req, res) => {
  try {
    const verification = await prisma.kycVerification.findFirst({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!verification) {
      return res.status(404).json({ success: false, error: 'No verification found' });
    }
    
    const status = await kycService.checkStatus(verification.sessionId);
    
    res.json({ success: true, data: { status } });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Status check failed' });
  }
});

export default router;
```

#### Step 5: Frontend Component

Create `frontend/components/KYCVerification.tsx`:
```typescript
'use client';

import { useState } from 'react';

export default function KYCVerification() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  
  const startVerification = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/kyc/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const { data } = await response.json();
      
      // Redirect to Stripe Identity verification
      window.location.href = data.url;
    } catch (error) {
      console.error('Failed to start verification:', error);
      alert('Failed to start verification. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const checkStatus = async () => {
    try {
      const response = await fetch('/api/kyc/status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const { data } = await response.json();
      setStatus(data.status);
    } catch (error) {
      console.error('Failed to check status:', error);
    }
  };
  
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Identity Verification</h2>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-2">
          To comply with financial regulations, we need to verify your identity.
        </p>
        <p className="text-sm text-gray-500">
          Cost: $1.50 per verification (one-time fee)
        </p>
      </div>
      
      {status && (
        <div className={`mb-4 p-3 rounded ${
          status === 'approved' ? 'bg-green-100 text-green-800' :
          status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          Status: {status}
        </div>
      )}
      
      <div className="space-y-3">
        <button
          onClick={startVerification}
          disabled={loading}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Starting...' : 'Start Verification'}
        </button>
        
        <button
          onClick={checkStatus}
          className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300"
        >
          Check Status
        </button>
      </div>
    </div>
  );
}
```

#### Step 6: Add to Prisma Schema

Add to `backend/prisma/schema.prisma`:
```prisma
model KycVerification {
  id          String    @id @default(uuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  sessionId   String    @unique
  provider    String    @default("stripe")
  status      String    @default("pending")
  completedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([userId])
  @@index([status])
}
```

---

## 📊 Cost Comparison

| Service | Free Option | Paid Option | When to Upgrade |
|---------|-------------|-------------|-----------------|
| Snyk | 200 tests/month | $99/month | >200 dependencies |
| Swagger | Self-hosted (free) | N/A | Never |
| Prometheus | Self-hosted (free) | N/A | Never |
| Grafana | Self-hosted (free) | $49/month (cloud) | >10k metrics |
| KYC | $1.50/verification | N/A | Pay per use |

**Total: $0/month + $1.50 per KYC verification**

---

## 🚀 Deployment Steps

### 1. Deploy Monitoring Stack
```bash
cd infrastructure/monitoring
docker-compose up -d
```

### 2. Enable Snyk
```bash
# Add SNYK_TOKEN to GitHub secrets
# Push code to trigger workflow
```

### 3. Enable Swagger
```bash
cd backend
npm install swagger-jsdoc swagger-ui-express
# Add swagger config
npm run dev
# Visit http://localhost:3001/api-docs
```

### 4. Test Metrics
```bash
# Visit http://localhost:3001/api/metrics
# Should see Prometheus metrics
```

### 5. Configure Grafana
```bash
# Visit http://localhost:3000
# Login: admin/admin
# Add Prometheus datasource
# Import dashboard
```

---

## ✅ Success Criteria

- [ ] Snyk scanning weekly
- [ ] Swagger docs accessible
- [ ] Prometheus collecting metrics
- [ ] Grafana showing dashboards
- [ ] KYC verification working
- [ ] Total cost: $0/month

---

## 🎯 Next Steps After Revenue

### At $10k MRR:
- Upgrade to Grafana Cloud ($49/month)
- Add New Relic APM (free tier first)

### At $50k MRR:
- Add Datadog APM ($300/month)
- Consider SOC 2 compliance

### At $100k MRR:
- Add Drata/Vanta ($2,000/month)
- Full compliance automation

---

**Last Updated**: February 1, 2026
**Total Cost**: $0/month + pay-per-use KYC
