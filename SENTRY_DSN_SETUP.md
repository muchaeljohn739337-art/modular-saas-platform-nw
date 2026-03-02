# 🔐 Sentry DSN Configuration

## ✅ Your Sentry DSNs

### **Backend DSN:**
```
https://98fb3b13dcf717869669c221b27bf048@o4510804235714560.ingest.us.sentry.io/4510804243251200
```

### **Frontend DSN:**
```
[Provide your frontend DSN here]
```

---

## 🚀 Quick Setup

### **Step 1: Add to Backend Environment**

**File:** `backend/.env`
```bash
SENTRY_DSN=https://98fb3b13dcf717869669c221b27bf048@o4510804235714560.ingest.us.sentry.io/4510804243251200
NODE_ENV=production
```

### **Step 2: Add to Frontend Environment**

**File:** `frontend/.env.local`
```bash
NEXT_PUBLIC_SENTRY_DSN=[your-frontend-dsn-here]
NODE_ENV=production
```

### **Step 3: Add to GitHub Secrets**

Go to: https://github.com/muchaeljohn739337-art/advanciapayledger-new/settings/secrets/actions

Add:
- `SENTRY_DSN` (backend)
- `NEXT_PUBLIC_SENTRY_DSN` (frontend)

---

## ⚠️ IMPORTANT: Security Note

**DO NOT commit these DSNs to version control!**

The DSN in this file should be:
1. Added to `.env` files (which are gitignored)
2. Added to GitHub Secrets for CI/CD
3. Removed from this documentation file after setup

---

## ✅ Verification

### **Backend:**
```bash
cd backend
npm run dev
# Should see: ✅ Sentry initialized successfully
```

### **Frontend:**
```bash
cd frontend
npm run dev
# Should see: ✅ Client-side Sentry initialized
```

---

## 🎯 What's Already Configured

### **Backend:**
- ✅ Sentry packages installed (`@sentry/node`, `@sentry/profiling-node`, `@sentry/tracing`)
- ✅ Configuration file: `backend/src/config/sentry.ts`
- ✅ Initialized in: `backend/src/index.ts`
- ✅ Express error handler: Ready to add
- ✅ HIPAA-compliant data filtering
- ✅ Logger integration: `enableLogs: true`
- ✅ Console logging integration

### **Frontend:**
- ✅ Sentry package installed (`@sentry/nextjs`)
- ✅ Configuration files:
  - `frontend/instrumentation-client.ts`
  - `frontend/sentry.server.config.ts`
  - `frontend/sentry.edge.config.ts`
- ✅ HIPAA-compliant session replay (masked)
- ✅ Logger integration
- ✅ Browser tracing

---

## 📋 Next Steps

1. **Add DSN to `backend/.env`** ✅ (Ready to do)
2. **Add DSN to `frontend/.env.local`** (Need frontend DSN)
3. **Add Express error handler** (See below)
4. **Test error tracking**
5. **Add to GitHub Secrets**

---

## 🔧 Add Express Error Handler

The Express error handler should be added **AFTER all routes but BEFORE the generic error handler**.

**File:** `backend/src/app.ts`

Add this code after all route definitions:

```typescript
import * as Sentry from '@sentry/node';

// ... all your routes ...

// Sentry error handler (MUST be before other error handlers)
app.use(Sentry.setupExpressErrorHandler(app));

// Optional fallthrough error handler
app.use(function onError(err: Error, req: Request, res: Response, next: NextFunction) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.json({
    error: 'Internal Server Error',
    sentryId: (res as any).sentry
  });
});
```

---

## ✅ Configuration Status

| Component | Status | Action |
|-----------|--------|--------|
| Backend Sentry packages | ✅ Installed | None |
| Backend config file | ✅ Created | None |
| Backend DSN | ⏳ Need to add | Add to `.env` |
| Backend Express handler | ⏳ Need to add | Add to `app.ts` |
| Frontend Sentry package | ✅ Installed | None |
| Frontend config files | ✅ Created | None |
| Frontend DSN | ⏳ Need to add | Add to `.env.local` |
| Logger integration | ✅ Complete | None |
| HIPAA compliance | ✅ Complete | None |

---

## 🎯 Testing

### **Test Backend Error Tracking:**
```bash
# In backend
curl http://localhost:3001/api/test-error
# Should create error in Sentry dashboard
```

### **Test Frontend Error Tracking:**
```bash
# In browser console
throw new Error('Test error');
# Should appear in Sentry dashboard
```

---

## 📞 Support

- **Sentry Dashboard:** https://sentry.io/organizations/o4510804235714560/
- **Documentation:** `SENTRY_BEST_PRACTICES.md`
- **Backend Config:** `backend/src/config/sentry.ts`
- **Frontend Config:** `frontend/instrumentation-client.ts`

---

**Ready to activate Sentry with your DSNs!** 🚀
