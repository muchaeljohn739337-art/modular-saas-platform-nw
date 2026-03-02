# Phase 2 & Phase 3 Implementation Guide

## 🎯 Overview

This guide provides step-by-step instructions for implementing all Phase 2 (10 hours) and Phase 3 (1 month) monitoring, security, and compliance integrations.

---

## 📅 Phase 2: This Month (10 hours)

### 1. Snyk Integration (2-3 hours)

**Purpose**: Continuous security monitoring for dependencies and code vulnerabilities.

#### Setup Steps:

1. **Sign up for Snyk**
   ```bash
   # Visit https://snyk.io and create account
   # Connect your GitHub repository
   ```

2. **Install Snyk CLI**
   ```bash
   npm install -g snyk
   snyk auth
   ```

3. **Add Snyk to GitHub Actions**
   
   Create `.github/workflows/snyk.yml`:
   ```yaml
   name: Snyk Security Scan
   
   on:
     push:
       branches: [main, master, develop]
     pull_request:
       branches: [main, master]
     schedule:
       - cron: '0 0 * * 0'  # Weekly on Sunday
   
   jobs:
     snyk:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         
         - name: Run Snyk to check for vulnerabilities (Backend)
           uses: snyk/actions/node@master
           env:
             SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
           with:
             args: --severity-threshold=high --file=backend/package.json
         
         - name: Run Snyk to check for vulnerabilities (Frontend)
           uses: snyk/actions/node@master
           env:
             SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
           with:
             args: --severity-threshold=high --file=frontend/package.json
         
         - name: Run Snyk Code Analysis
           uses: snyk/actions/node@master
           env:
             SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
           with:
             command: code test
   ```

4. **Add Snyk Token to GitHub Secrets**
   - Go to GitHub repo → Settings → Secrets → Actions
   - Add `SNYK_TOKEN` from Snyk dashboard

5. **Configure Snyk Policy** (Optional)
   
   Create `.snyk` file in root:
   ```yaml
   version: v1.25.0
   ignore: {}
   patch: {}
   ```

#### Integration with Backend:

Add to `backend/package.json`:
```json
{
  "scripts": {
    "snyk:test": "snyk test",
    "snyk:monitor": "snyk monitor"
  }
}
```

---

### 2. OpenAPI/Swagger Documentation (3-4 hours)

**Purpose**: Auto-generated, interactive API documentation.

#### Setup Steps:

1. **Install Dependencies**
   ```bash
   cd backend
   npm install swagger-jsdoc swagger-ui-express @types/swagger-jsdoc @types/swagger-ui-express
   ```

2. **Create Swagger Configuration**
   
   Create `backend/src/config/swagger.ts`:
   ```typescript
   import swaggerJsdoc from 'swagger-jsdoc';
   import swaggerUi from 'swagger-ui-express';
   import { Express } from 'express';
   
   const options = {
     definition: {
       openapi: '3.0.0',
       info: {
         title: 'Advancia PayLedger API',
         version: '1.0.0',
         description: 'Healthcare payment processing and financial management API',
         contact: {
           name: 'Advancia Support',
           email: 'support@advanciapayledger.com'
         },
         license: {
           name: 'Proprietary',
         }
       },
       servers: [
         {
           url: 'http://localhost:3001',
           description: 'Development server'
         },
         {
           url: 'https://api.advanciapayledger.com',
           description: 'Production server'
         }
       ],
       components: {
         securitySchemes: {
           bearerAuth: {
             type: 'http',
             scheme: 'bearer',
             bearerFormat: 'JWT'
           }
         }
       },
       security: [{
         bearerAuth: []
       }]
     },
     apis: ['./src/routes/*.ts', './src/controllers/*.ts']
   };
   
   const swaggerSpec = swaggerJsdoc(options);
   
   export const setupSwagger = (app: Express) => {
     app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
       explorer: true,
       customCss: '.swagger-ui .topbar { display: none }',
       customSiteTitle: 'Advancia PayLedger API Docs'
     }));
     
     // Serve OpenAPI spec as JSON
     app.get('/api-docs.json', (req, res) => {
       res.setHeader('Content-Type', 'application/json');
       res.send(swaggerSpec);
     });
   };
   
   export default swaggerSpec;
   ```

3. **Add Swagger to Express App**
   
   Update `backend/src/app.ts`:
   ```typescript
   import { setupSwagger } from './config/swagger';
   
   // After middleware setup, before routes
   setupSwagger(app);
   ```

4. **Document Your Routes**
   
   Example for `backend/src/routes/payments.ts`:
   ```typescript
   /**
    * @swagger
    * /api/payments:
    *   post:
    *     summary: Create a new payment
    *     tags: [Payments]
    *     security:
    *       - bearerAuth: []
    *     requestBody:
    *       required: true
    *       content:
    *         application/json:
    *           schema:
    *             type: object
    *             required:
    *               - amount
    *               - recipientId
    *             properties:
    *               amount:
    *                 type: number
    *                 description: Payment amount in cents
    *                 example: 5000
    *               recipientId:
    *                 type: string
    *                 description: Recipient user ID
    *               description:
    *                 type: string
    *                 description: Payment description
    *     responses:
    *       201:
    *         description: Payment created successfully
    *         content:
    *           application/json:
    *             schema:
    *               type: object
    *               properties:
    *                 success:
    *                   type: boolean
    *                 data:
    *                   type: object
    *                   properties:
    *                     id:
    *                       type: string
    *                     amount:
    *                       type: number
    *                     status:
    *                       type: string
    *       400:
    *         description: Invalid request
    *       401:
    *         description: Unauthorized
    */
   router.post('/', authenticateToken, createPayment);
   ```

5. **Access Documentation**
   - Development: `http://localhost:3001/api-docs`
   - Production: `https://api.advanciapayledger.com/api-docs`

---

### 3. Prometheus + Grafana (4-5 hours)

**Purpose**: Real-time metrics collection and visualization.

#### Setup Steps:

1. **Install Prometheus Client**
   ```bash
   cd backend
   npm install prom-client
   ```

2. **Create Metrics Service**
   
   Create `backend/src/services/metrics.ts`:
   ```typescript
   import { Registry, Counter, Histogram, Gauge } from 'prom-client';
   import { Request, Response, NextFunction } from 'express';
   
   export const register = new Registry();
   
   // HTTP Metrics
   export const httpRequestDuration = new Histogram({
     name: 'http_request_duration_seconds',
     help: 'Duration of HTTP requests in seconds',
     labelNames: ['method', 'route', 'status_code'],
     buckets: [0.1, 0.5, 1, 2, 5]
   });
   
   export const httpRequestTotal = new Counter({
     name: 'http_requests_total',
     help: 'Total number of HTTP requests',
     labelNames: ['method', 'route', 'status_code']
   });
   
   // Business Metrics
   export const paymentsTotal = new Counter({
     name: 'payments_total',
     help: 'Total number of payments processed',
     labelNames: ['status', 'type']
   });
   
   export const paymentsAmount = new Counter({
     name: 'payments_amount_total',
     help: 'Total payment amount processed',
     labelNames: ['currency']
   });
   
   export const activeUsers = new Gauge({
     name: 'active_users',
     help: 'Number of currently active users'
   });
   
   export const walletBalance = new Gauge({
     name: 'wallet_balance_total',
     help: 'Total wallet balance across all users',
     labelNames: ['currency']
   });
   
   // Database Metrics
   export const databaseQueryDuration = new Histogram({
     name: 'database_query_duration_seconds',
     help: 'Duration of database queries',
     labelNames: ['operation', 'table'],
     buckets: [0.01, 0.05, 0.1, 0.5, 1]
   });
   
   // Register all metrics
   register.registerMetric(httpRequestDuration);
   register.registerMetric(httpRequestTotal);
   register.registerMetric(paymentsTotal);
   register.registerMetric(paymentsAmount);
   register.registerMetric(activeUsers);
   register.registerMetric(walletBalance);
   register.registerMetric(databaseQueryDuration);
   
   // Middleware to track HTTP metrics
   export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
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
   ```

3. **Add Metrics Endpoint**
   
   Create `backend/src/routes/metrics.ts`:
   ```typescript
   import { Router } from 'express';
   import { register } from '../services/metrics';
   
   const router = Router();
   
   router.get('/metrics', async (req, res) => {
     res.set('Content-Type', register.contentType);
     res.end(await register.metrics());
   });
   
   export default router;
   ```

4. **Update App to Use Metrics**
   
   Update `backend/src/app.ts`:
   ```typescript
   import { metricsMiddleware } from './services/metrics';
   import metricsRouter from './routes/metrics';
   
   // Add metrics middleware early
   app.use(metricsMiddleware);
   
   // Add metrics endpoint
   app.use('/api', metricsRouter);
   ```

5. **Deploy Prometheus**
   
   Create `infrastructure/prometheus/prometheus.yml`:
   ```yaml
   global:
     scrape_interval: 15s
     evaluation_interval: 15s
   
   scrape_configs:
     - job_name: 'advancia-backend'
       static_configs:
         - targets: ['backend:3001']
       metrics_path: '/api/metrics'
   ```

6. **Deploy Grafana**
   
   Create `infrastructure/grafana/docker-compose.yml`:
   ```yaml
   version: '3.8'
   
   services:
     prometheus:
       image: prom/prometheus:latest
       ports:
         - "9090:9090"
       volumes:
         - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
         - prometheus-data:/prometheus
       command:
         - '--config.file=/etc/prometheus/prometheus.yml'
         - '--storage.tsdb.path=/prometheus'
     
     grafana:
       image: grafana/grafana:latest
       ports:
         - "3000:3000"
       environment:
         - GF_SECURITY_ADMIN_PASSWORD=admin
         - GF_USERS_ALLOW_SIGN_UP=false
       volumes:
         - grafana-data:/var/lib/grafana
         - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
         - ./grafana/datasources:/etc/grafana/provisioning/datasources
   
   volumes:
     prometheus-data:
     grafana-data:
   ```

7. **Create Grafana Dashboard**
   
   Create `infrastructure/grafana/dashboards/advancia.json`:
   ```json
   {
     "dashboard": {
       "title": "Advancia PayLedger Metrics",
       "panels": [
         {
           "title": "HTTP Request Rate",
           "targets": [
             {
               "expr": "rate(http_requests_total[5m])"
             }
           ]
         },
         {
           "title": "Payment Volume",
           "targets": [
             {
               "expr": "rate(payments_total[5m])"
             }
           ]
         }
       ]
     }
   }
   ```

---

## 📅 Phase 3: Before Production (1 month)

### 1. Datadog Monitoring (1 week)

**Purpose**: Comprehensive APM, logs, and infrastructure monitoring.

#### Setup Steps:

1. **Sign up for Datadog**
   - Visit https://www.datadoghq.com
   - Choose appropriate plan (Pro or Enterprise for HIPAA)

2. **Install Datadog Agent**
   ```bash
   npm install dd-trace --save
   ```

3. **Configure Datadog APM**
   
   Create `backend/src/config/datadog.ts`:
   ```typescript
   import tracer from 'dd-trace';
   
   export const initDatadog = () => {
     tracer.init({
       service: 'advancia-backend',
       env: process.env.NODE_ENV || 'development',
       version: process.env.APP_VERSION || '1.0.0',
       logInjection: true,
       analytics: true,
       runtimeMetrics: true,
       profiling: true,
       appsec: true  // Application Security Monitoring
     });
     
     return tracer;
   };
   ```

4. **Update Entry Point**
   
   Update `backend/src/index.ts` (MUST be first import):
   ```typescript
   import { initDatadog } from './config/datadog';
   initDatadog();
   
   // Rest of imports...
   ```

5. **Add Datadog to Docker**
   
   Update `docker-compose.yml`:
   ```yaml
   services:
     backend:
       environment:
         - DD_AGENT_HOST=datadog-agent
         - DD_TRACE_AGENT_PORT=8126
         - DD_SERVICE=advancia-backend
         - DD_ENV=${NODE_ENV}
     
     datadog-agent:
       image: gcr.io/datadoghq/agent:latest
       environment:
         - DD_API_KEY=${DD_API_KEY}
         - DD_SITE=datadoghq.com
         - DD_APM_ENABLED=true
         - DD_LOGS_ENABLED=true
         - DD_PROCESS_AGENT_ENABLED=true
       volumes:
         - /var/run/docker.sock:/var/run/docker.sock:ro
         - /proc/:/host/proc/:ro
         - /sys/fs/cgroup/:/host/sys/fs/cgroup:ro
   ```

6. **Configure Log Collection**
   
   Update Winston logger in `backend/src/config/logger.ts`:
   ```typescript
   import winston from 'winston';
   
   const logger = winston.createLogger({
     format: winston.format.combine(
       winston.format.timestamp(),
       winston.format.json()
     ),
     transports: [
       new winston.transports.File({
         filename: '/var/log/advancia/app.log',
         format: winston.format.json()
       })
     ]
   });
   
   export default logger;
   ```

7. **Set Up Datadog Dashboards**
   - API Performance Dashboard
   - Payment Processing Dashboard
   - Error Rate Dashboard
   - Infrastructure Dashboard

8. **Configure Alerts**
   - High error rate (>1%)
   - Slow API responses (>2s p95)
   - Failed payments spike
   - Database connection issues

---

### 2. Drata/Vanta Compliance (1-2 weeks)

**Purpose**: Automated SOC 2, HIPAA, and compliance monitoring.

#### Option A: Drata

1. **Sign up for Drata**
   - Visit https://drata.com
   - Choose HIPAA + SOC 2 package

2. **Connect Integrations**
   - GitHub (code repository)
   - AWS/GCP (infrastructure)
   - Supabase (database)
   - Vercel (frontend hosting)
   - Datadog (monitoring)

3. **Install Drata Agent**
   ```bash
   # On production servers
   curl -sSL https://install.drata.com | bash
   ```

4. **Configure Policies**
   - Access control policies
   - Data encryption policies
   - Incident response procedures
   - Employee training requirements

5. **Set Up Evidence Collection**
   - Automated evidence gathering
   - Quarterly access reviews
   - Security awareness training
   - Vendor risk assessments

#### Option B: Vanta

1. **Sign up for Vanta**
   - Visit https://vanta.com
   - Choose SOC 2 + HIPAA package

2. **Connect Services**
   - Similar to Drata integration list

3. **Install Vanta Agent**
   ```bash
   # On production servers
   curl -sSL https://install.vanta.com | bash
   ```

4. **Complete Questionnaires**
   - Security policies
   - Data handling procedures
   - Access control documentation

#### Compliance Checklist:

- [ ] Enable MFA for all team members
- [ ] Implement access logging (already done with RLS)
- [ ] Set up encrypted backups
- [ ] Document incident response plan
- [ ] Create security awareness training
- [ ] Perform quarterly access reviews
- [ ] Maintain vendor risk assessments
- [ ] Enable audit logging on all systems

---

### 3. KYC Integration (1-2 weeks)

**Purpose**: Identity verification for financial compliance (FinCEN, AML).

#### Recommended Providers:

1. **Persona** (Recommended for healthcare)
2. **Onfido**
3. **Jumio**
4. **Stripe Identity**

#### Implementation with Persona:

1. **Sign up for Persona**
   - Visit https://withpersona.com
   - Choose appropriate plan

2. **Install Persona SDK**
   ```bash
   cd backend
   npm install persona-node
   
   cd ../frontend
   npm install persona
   ```

3. **Create KYC Service**
   
   Create `backend/src/services/kyc.ts`:
   ```typescript
   import { Persona } from 'persona-node';
   import prisma from '../lib/prisma';
   
   const personaClient = new Persona({
     apiKey: process.env.PERSONA_API_KEY!,
     environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
   });
   
   export interface KYCVerificationData {
     userId: string;
     firstName: string;
     lastName: string;
     dateOfBirth: string;
     address: {
       street: string;
       city: string;
       state: string;
       postalCode: string;
       country: string;
     };
     ssn?: string;
     documentType: 'passport' | 'drivers_license' | 'id_card';
   }
   
   export class KYCService {
     async createInquiry(data: KYCVerificationData) {
       try {
         const inquiry = await personaClient.inquiries.create({
           data: {
             attributes: {
               'inquiry-template-id': process.env.PERSONA_TEMPLATE_ID!,
               'reference-id': data.userId,
               'name-first': data.firstName,
               'name-last': data.lastName,
               'birthdate': data.dateOfBirth,
               'address-street-1': data.address.street,
               'address-city': data.address.city,
               'address-subdivision': data.address.state,
               'address-postal-code': data.address.postalCode
             }
           }
         });
         
         await prisma.kycVerification.create({
           data: {
             userId: data.userId,
             inquiryId: inquiry.data.id,
             status: 'pending',
             provider: 'persona'
           }
         });
         
         return inquiry;
       } catch (error) {
         console.error('KYC inquiry creation failed:', error);
         throw error;
       }
     }
     
     async checkStatus(inquiryId: string) {
       const inquiry = await personaClient.inquiries.retrieve(inquiryId);
       
       const status = inquiry.data.attributes.status;
       const kycStatus = this.mapPersonaStatus(status);
       
       await prisma.kycVerification.update({
         where: { inquiryId },
         data: {
           status: kycStatus,
           completedAt: kycStatus !== 'pending' ? new Date() : null
         }
       });
       
       return kycStatus;
     }
     
     private mapPersonaStatus(personaStatus: string): string {
       const statusMap: Record<string, string> = {
         'completed': 'approved',
         'approved': 'approved',
         'declined': 'rejected',
         'needs_review': 'pending',
         'expired': 'expired'
       };
       
       return statusMap[personaStatus] || 'pending';
     }
     
     async handleWebhook(payload: any) {
       const { data } = payload;
       const inquiryId = data.id;
       const status = data.attributes.status;
       
       await this.checkStatus(inquiryId);
       
       // Send notification to user
       const verification = await prisma.kycVerification.findUnique({
         where: { inquiryId },
         include: { user: true }
       });
       
       if (verification) {
         // Send email notification
         // Update user account status
       }
     }
   }
   
   export default new KYCService();
   ```

4. **Add KYC Routes**
   
   Create `backend/src/routes/kyc.ts`:
   ```typescript
   import { Router } from 'express';
   import { authenticateToken } from '../middleware/auth';
   import kycService from '../services/kyc';
   
   const router = Router();
   
   router.post('/verify', authenticateToken, async (req, res) => {
     try {
       const inquiry = await kycService.createInquiry({
         userId: req.user.id,
         ...req.body
       });
       
       res.json({
         success: true,
         data: {
           inquiryId: inquiry.data.id,
           sessionToken: inquiry.data.attributes['session-token']
         }
       });
     } catch (error) {
       res.status(500).json({ success: false, error: 'KYC verification failed' });
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
       
       const status = await kycService.checkStatus(verification.inquiryId);
       
       res.json({
         success: true,
         data: { status }
       });
     } catch (error) {
       res.status(500).json({ success: false, error: 'Status check failed' });
     }
   });
   
   router.post('/webhook', async (req, res) => {
     try {
       await kycService.handleWebhook(req.body);
       res.json({ success: true });
     } catch (error) {
       res.status(500).json({ success: false });
     }
   });
   
   export default router;
   ```

5. **Add Frontend Component**
   
   Create `frontend/components/KYCVerification.tsx`:
   ```typescript
   import { useState } from 'react';
   import { Client as PersonaClient } from 'persona';
   
   export default function KYCVerification() {
     const [loading, setLoading] = useState(false);
     
     const startVerification = async () => {
       setLoading(true);
       
       try {
         const response = await fetch('/api/kyc/verify', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             firstName: 'John',
             lastName: 'Doe',
             dateOfBirth: '1990-01-01',
             address: {
               street: '123 Main St',
               city: 'New York',
               state: 'NY',
               postalCode: '10001',
               country: 'US'
             },
             documentType: 'drivers_license'
           })
         });
         
         const { data } = await response.json();
         
         const client = new PersonaClient({
           templateId: process.env.NEXT_PUBLIC_PERSONA_TEMPLATE_ID!,
           environmentId: process.env.NEXT_PUBLIC_PERSONA_ENV_ID!,
           sessionToken: data.sessionToken,
           onComplete: ({ inquiryId, status }) => {
             console.log('Verification complete:', inquiryId, status);
             // Refresh user status
           },
           onCancel: () => {
             console.log('Verification cancelled');
           },
           onError: (error) => {
             console.error('Verification error:', error);
           }
         });
         
         client.open();
       } catch (error) {
         console.error('Failed to start verification:', error);
       } finally {
         setLoading(false);
       }
     };
     
     return (
       <div className="p-6">
         <h2 className="text-2xl font-bold mb-4">Identity Verification</h2>
         <p className="mb-4">
           To comply with financial regulations, we need to verify your identity.
         </p>
         <button
           onClick={startVerification}
           disabled={loading}
           className="bg-blue-600 text-white px-6 py-2 rounded-lg"
         >
           {loading ? 'Starting...' : 'Start Verification'}
         </button>
       </div>
     );
   }
   ```

6. **Update Database Schema**
   
   Add to `backend/prisma/schema.prisma`:
   ```prisma
   model KycVerification {
     id          String   @id @default(uuid())
     userId      String
     user        User     @relation(fields: [userId], references: [id])
     inquiryId   String   @unique
     provider    String   @default("persona")
     status      String   @default("pending")
     completedAt DateTime?
     createdAt   DateTime @default(now())
     updatedAt   DateTime @updatedAt
     
     @@index([userId])
     @@index([status])
   }
   ```

7. **Environment Variables**
   
   Add to `.env`:
   ```bash
   # KYC - Persona
   PERSONA_API_KEY=your_api_key_here
   PERSONA_TEMPLATE_ID=your_template_id
   PERSONA_WEBHOOK_SECRET=your_webhook_secret
   
   # Frontend
   NEXT_PUBLIC_PERSONA_TEMPLATE_ID=your_template_id
   NEXT_PUBLIC_PERSONA_ENV_ID=your_environment_id
   ```

---

## 🔐 Security Considerations

### All Integrations Must:

1. **Use Environment Variables** - Never hardcode API keys
2. **Enable HTTPS** - All external communications encrypted
3. **Implement Rate Limiting** - Prevent abuse
4. **Log All Actions** - Audit trail for compliance
5. **Handle Errors Gracefully** - Don't expose internal details
6. **Validate All Inputs** - Prevent injection attacks

---

## 📊 Success Metrics

### Phase 2 Completion Criteria:

- [ ] Snyk scanning all dependencies weekly
- [ ] OpenAPI docs accessible at `/api-docs`
- [ ] Prometheus collecting metrics
- [ ] Grafana dashboards showing real-time data

### Phase 3 Completion Criteria:

- [ ] Datadog APM tracking all requests
- [ ] Drata/Vanta compliance score >90%
- [ ] KYC verification flow functional
- [ ] All compliance evidence automated

---

## 🚀 Deployment Order

1. **Week 1**: Snyk + OpenAPI/Swagger
2. **Week 2**: Prometheus + Grafana
3. **Week 3**: Datadog integration
4. **Week 4**: Drata/Vanta setup + KYC integration

---

## 💰 Cost Estimates

| Service | Monthly Cost | Notes |
|---------|-------------|-------|
| Snyk | $0 - $99 | Free tier available |
| Datadog | $15 - $31/host | Pro plan recommended |
| Drata | $1,000 - $2,000 | SOC 2 + HIPAA |
| Vanta | $3,000 - $5,000 | Alternative to Drata |
| Persona KYC | $1 - $5/verification | Pay per use |
| Grafana Cloud | $0 - $49 | Self-hosted is free |

**Total Monthly**: $1,100 - $7,200 (depending on choices)

---

## 📞 Support Resources

- **Snyk**: https://support.snyk.io
- **Swagger**: https://swagger.io/docs
- **Prometheus**: https://prometheus.io/docs
- **Grafana**: https://grafana.com/docs
- **Datadog**: https://docs.datadoghq.com
- **Drata**: https://help.drata.com
- **Vanta**: https://help.vanta.com
- **Persona**: https://docs.withpersona.com

---

## ✅ Next Steps

1. Review this implementation guide
2. Prioritize which integrations to implement first
3. Set up accounts for chosen services
4. Add API keys to GitHub Secrets
5. Follow step-by-step implementation for each service
6. Test thoroughly in staging before production
7. Monitor and iterate based on metrics

---

**Last Updated**: February 1, 2026
**Status**: Ready for Implementation
