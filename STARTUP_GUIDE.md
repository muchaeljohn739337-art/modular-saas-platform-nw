# 🚀 Advancia PayLedger - Startup Guide

## ✅ **Platform Status: FULLY OPERATIONAL**

### **🌐 Access Points**
- **Frontend**: http://localhost:3000 (Next.js Application)
- **Backend API**: http://localhost:3001 (Express Server)
- **Health Check**: http://localhost:3001/health ✅

---

## 🎯 **What's Available Right Now**

### **📱 Frontend Application**
- **Marketing Site**: Landing page, features, pricing
- **Interactive Playground**: Sticky notes workspace
- **Navigation**: Smooth routing between pages
- **Responsive Design**: Mobile-friendly interface

### **🔧 Backend API Services**
- **Healthcare API**: Complete facility/patient/appointment management
- **Payment Processing**: Multi-method payments with insurance integration
- **Crypto Services**: 5+ cryptocurrencies supported
- **Analytics**: Real-time dashboard and financial reporting
- **Mock Database**: Full functionality without database setup

---

## 🏥 **Healthcare Platform Features**

### **Facility Management**
```
GET /api/v2/facilities
- 3 Healthcare facilities (Hospital, Clinic, Specialty Center)
- NPI numbers and subscription tiers
- Complete facility profiles
```

### **Patient Records**
```
GET /api/v2/patients
- Patient demographics and insurance
- Medical record numbers (MRN)
- Emergency contact information
```

### **Appointment Scheduling**
```
GET /api/v2/appointments
POST /api/v2/appointments
- Multiple appointment types
- Telehealth support
- Status tracking (scheduled, completed, cancelled)
```

### **Payment Processing**
```
GET /api/v2/payments
POST /api/v2/payments
- Insurance claim calculations
- Multiple payment methods (Credit Card, ACH, Crypto)
- Patient responsibility tracking
```

### **Wallet Management**
```
GET /api/v2/wallets
- Crypto wallets (Ethereum)
- Fiat currency wallets
- Transaction history
```

### **Analytics Dashboard**
```
GET /api/v2/dashboard
- Real-time revenue tracking
- Patient growth metrics
- Payment method breakdown
- Financial reporting
```

---

## 🧪 **Testing the Platform**

### **Quick API Tests**
```bash
# Test healthcare facilities
curl http://localhost:3001/api/v2/facilities

# Test patient records
curl http://localhost:3001/api/v2/patients

# Test dashboard analytics
curl http://localhost:3001/api/v2/dashboard

# Test crypto tokens
curl http://localhost:3001/api/crypto/tokens

# Test billing summary
curl http://localhost:3001/api/v2/billing/summary
```

### **Frontend Navigation**
- **Home**: http://localhost:3000
- **Features**: http://localhost:3000/features
- **Pricing**: http://localhost:3000/pricing
- **Playground**: http://localhost:3000/playground

---

## 📊 **Current Data Overview**

### **Healthcare Facilities**
- **City General Hospital** (Enterprise tier)
- **Family Care Clinic** (Professional tier)
- **Specialty Surgery Center** (Professional tier)

### **Patients**
- **John Doe** (MRN: MRN001) - Blue Cross Blue Shield
- **Jane Smith** (MRN: MRN002) - Aetna Insurance

### **Appointments**
- **Completed**: Initial consultation for John Doe
- **Scheduled**: Follow-up for Jane Smith (Telehealth)

### **Payments**
- **Total Billed**: $475
- **Total Paid**: $250
- **Insurance Coverage**: $380
- **Patient Responsibility**: $95

### **Wallets**
- **Crypto Wallet**: $1,250.50 USDC (Ethereum)
- **Fiat Wallet**: $500 USD

---

## 🎮 **Interactive Features**

### **Playground Workspace**
- Add/edit/delete sticky notes
- Drag and drop positioning
- Color selection
- Export to text file
- Access at: http://localhost:3000/playground

### **Real-time Features**
- Live cryptocurrency prices
- Dashboard analytics
- Payment processing simulation
- Appointment status tracking

---

## 🔧 **Development Commands**

### **Start Services**
```bash
# Start both frontend and backend
npm run dev

# Start individually
npm run dev:frontend  # Port 3000
npm run dev:backend   # Port 3001
```

### **Testing Commands**
```bash
# Test mock API
node test-mock-api.js

# Test enhanced healthcare API
node test-enhanced-mock-api.js

# Run all tests
npm test
```

### **Database (Optional)**
```bash
# When ready for persistent data
docker-compose up -d db redis
cd backend && npx prisma migrate dev
```

---

## 🚀 **Production Features Enabled**

✅ **HIPAA-Compliant Data Structure**  
✅ **Insurance Integration Logic**  
✅ **Multi-Facility Support**  
✅ **Telehealth Capabilities**  
✅ **Cryptocurrency Payments**  
✅ **Comprehensive Analytics**  
✅ **Financial Reporting**  
✅ **Real-time Dashboard**  
✅ **Mock Database (No Setup Required)**  

---

## 📞 **Support & Documentation**

### **API Documentation**
- **Healthcare API**: `/api/v2/*` endpoints
- **Crypto API**: `/api/crypto/*` endpoints  
- **Mock API**: `/api/mock/*` endpoints
- **System Health**: `/health`, `/metrics`

### **Available Documentation**
- `README.md` - Main project documentation
- `DEPLOYMENT.md` - Production deployment guide
- `API_DOCUMENTATION.md` - Complete API reference
- `HIPAA_COMPLIANCE_GUIDE.md` - Security compliance

---

## 🎉 **Ready to Use!**

The **Advancia PayLedger Healthcare Payment Platform** is now fully operational with:

- **Complete Frontend** application
- **Full Backend API** with healthcare-specific features
- **Mock Database** for immediate testing
- **Real-time Analytics** and dashboard
- **Cryptocurrency** integration
- **Insurance** processing logic

**No database setup required** - everything works out of the box!

---

**Last Updated**: February 12, 2026  
**Version**: 1.0.0 - Mock Database Edition  
**Status**: 🟢 **FULLY OPERATIONAL**
