# 🚀 Vercel Environment Setup for Advancia PayLedger

## 📋 **Required Environment Variables**

Go to: https://vercel.com/advanciapayledger/frontend/settings/environment-variables

### **Add these 3 variables:**

```
NEXT_PUBLIC_API_URL=https://advanciapayledger-mock-api.advancia-platform.workers.dev
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_APP_URL=https://advancia-payledger-frontend.vercel.app
```

### **Settings:**
- **Environment**: Production, Preview, Development (add to all)
- **Type**: Plain Text
- **Scope**: All projects

---

## 🔧 **Manual Steps:**

1. **Open Vercel Dashboard**: https://vercel.com/advanciapayledger/frontend/settings/environment-variables
2. **Click "Add New"** for each variable
3. **Enter Name and Value** exactly as shown above
4. **Select Environments**: Production, Preview, Development
5. **Click "Save"**
6. **Redeploy** your frontend after adding all variables

---

## ✅ **Verification:**

After deployment, test in browser console:
```javascript
console.log(process.env.NEXT_PUBLIC_API_URL);
// Should show: https://advanciapayledger-mock-api.advancia-platform.workers.dev
```

---

## 🎯 **Next Steps:**

After environment variables are set:
1. Add API integration files to frontend
2. Update login and dashboard components
3. Deploy and test complete integration

**This step is crucial for frontend-backend connectivity!**
