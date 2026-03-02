# Frontend Environment Setup

## Create `.env.production` in frontend directory

Create file: `frontend/.env.production`

```env
NEXT_PUBLIC_API_URL=https://api.advanciapayledger.com
NEXT_PUBLIC_AI_URL=https://ai.advanciapayledger.com
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_SUPABASE_URL=https://jwabwrcykdtpwdhwhmqq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3YWJ3cmN5a2R0cHdkaHdobXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NTI3NTQsImV4cCI6MjA4NTEyODc1NH0.wk7Ok5i8O4eigd7iYhb-LwR48-B9QpKuRPi5GZfGWwk
```

## Create `.env.production` in backend directory

Create file: `backend/.env.production`

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://postgres.jwabwrcykdtpwdhwhmqq:YOUR_PASSWORD@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
REDIS_URL=redis://:YOUR_PASSWORD@redis-host:6379
JWT_SECRET=YOUR_JWT_SECRET_MIN_32_CHARS
JWT_REFRESH_SECRET=YOUR_REFRESH_SECRET_MIN_32_CHARS
STRIPE_SECRET_KEY=sk_live_YOUR_KEY
SENDGRID_API_KEY=YOUR_SENDGRID_KEY
SENTRY_DSN=YOUR_SENTRY_DSN
```

## Vercel Deployment

Set these environment variables in Vercel dashboard:

```
NEXT_PUBLIC_API_URL=https://api.advanciapayledger.com
NEXT_PUBLIC_AI_URL=https://ai.advanciapayledger.com
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_SUPABASE_URL=https://jwabwrcykdtpwdhwhmqq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Deploy to Vercel

```bash
cd frontend
npm install
npm run build
vercel --prod
```

Expected output:
```
✓ Production deployment complete
✓ https://advancia-payledger.vercel.app
```
