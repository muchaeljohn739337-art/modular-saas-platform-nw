# Backend Integration Instructions

## Add New Services to app.ts

Add these imports at the top of `backend/src/app.ts` (after line 30):

```typescript
import { setupSwagger } from './config/swagger';
import { metricsMiddleware } from './services/metrics';
import metricsRouter from './routes/metrics';
import kycRouter from './routes/kyc';
```

Add metrics middleware early (after line 72, before routes):

```typescript
// Metrics collection (add early in middleware chain)
app.use(metricsMiddleware);

// API Documentation (Swagger)
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_DOCS === 'true') {
  setupSwagger(app);
}
```

Add new routes (after line 102, with other routes):

```typescript
app.use('/api', metricsRouter);
app.use('/api/kyc', kycRouter);
```

## Install Dependencies

```bash
cd backend
npm install swagger-jsdoc swagger-ui-express prom-client
npm install -D @types/swagger-jsdoc @types/swagger-ui-express
```

## Update Prisma Schema

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

Add to User model:

```prisma
model User {
  // ... existing fields
  kycVerifications KycVerification[]
}
```

Run migration:

```bash
npx prisma migrate dev --name add_kyc_verification
```

## Environment Variables

Add to `.env`:

```bash
# Enable Swagger in production (optional)
ENABLE_DOCS=false

# Stripe Identity (for KYC)
STRIPE_SECRET_KEY=your_stripe_secret_key
```

## Test

```bash
# Start backend
npm run dev

# Test Swagger
# Visit: http://localhost:3001/api-docs

# Test Metrics
curl http://localhost:3001/api/metrics

# Test KYC endpoint
curl -X POST http://localhost:3001/api/kyc/verify \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

## Done!

All services are now integrated and ready to use.
