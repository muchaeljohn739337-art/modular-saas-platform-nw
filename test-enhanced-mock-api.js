// Test Enhanced Mock API Endpoints
const http = require('http');

const makeRequest = (options, data = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
};

async function testEnhancedMockAPI() {
  console.log('🏥 Testing Enhanced Healthcare Mock API...\n');
  
  try {
    // Test facilities endpoint
    console.log('1. Testing GET /api/v2/facilities');
    const facilitiesResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/v2/facilities',
      method: 'GET'
    });
    console.log(`Status: ${facilitiesResponse.status}`);
    console.log(`Facilities: ${facilitiesResponse.data.data?.length || 0} found`);
    if (facilitiesResponse.data.data?.length > 0) {
      console.log(`Sample facility: ${facilitiesResponse.data.data[0].name}`);
    }
    console.log('');

    // Test patients endpoint
    console.log('2. Testing GET /api/v2/patients');
    const patientsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/v2/patients',
      method: 'GET'
    });
    console.log(`Status: ${patientsResponse.status}`);
    console.log(`Patients: ${patientsResponse.data.data?.length || 0} found`);
    console.log('');

    // Test appointments endpoint
    console.log('3. Testing GET /api/v2/appointments');
    const appointmentsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/v2/appointments',
      method: 'GET'
    });
    console.log(`Status: ${appointmentsResponse.status}`);
    console.log(`Appointments: ${appointmentsResponse.data.data?.length || 0} found`);
    if (appointmentsResponse.data.data?.length > 0) {
      console.log(`Sample appointment: ${appointmentsResponse.data.data[0].type} - ${appointmentsResponse.data.data[0].status}`);
    }
    console.log('');

    // Test enhanced payments endpoint
    console.log('4. Testing GET /api/v2/payments');
    const paymentsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/v2/payments',
      method: 'GET'
    });
    console.log(`Status: ${paymentsResponse.status}`);
    console.log(`Payments: ${paymentsResponse.data.data?.length || 0} found`);
    console.log('');

    // Test wallets endpoint
    console.log('5. Testing GET /api/v2/wallets');
    const walletsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/v2/wallets',
      method: 'GET'
    });
    console.log(`Status: ${walletsResponse.status}`);
    console.log(`Wallets: ${walletsResponse.data.data?.length || 0} found`);
    if (walletsResponse.data.data?.length > 0) {
      console.log(`Sample wallet: ${walletsResponse.data.data[0].type} - $${walletsResponse.data.data[0].balance}`);
    }
    console.log('');

    // Test enhanced dashboard
    console.log('6. Testing GET /api/v2/dashboard');
    const dashboardResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/v2/dashboard',
      method: 'GET'
    });
    console.log(`Status: ${dashboardResponse.status}`);
    if (dashboardResponse.data.success) {
      const overview = dashboardResponse.data.data.overview;
      console.log(`Dashboard Overview:`);
      console.log(`  Total Revenue: $${overview.totalRevenue}`);
      console.log(`  Total Patients: ${overview.totalPatients}`);
      console.log(`  Total Appointments: ${overview.totalAppointments}`);
      console.log(`  Completed Payments: ${overview.completedPayments}`);
      console.log(`  Pending Payments: ${overview.pendingPayments}`);
    }
    console.log('');

    // Test billing summary
    console.log('7. Testing GET /api/v2/billing/summary');
    const billingResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/v2/billing/summary',
      method: 'GET'
    });
    console.log(`Status: ${billingResponse.status}`);
    if (billingResponse.data.success) {
      const summary = billingResponse.data.data;
      console.log(`Billing Summary:`);
      console.log(`  Total Billed: $${summary.totalBilled}`);
      console.log(`  Total Paid: $${summary.totalPaid}`);
      console.log(`  Total Insurance: $${summary.totalInsurance}`);
      console.log(`  Patient Responsibility: $${summary.totalPatientResponsibility}`);
      console.log(`  Collection Rate: ${summary.collectionRate.toFixed(2)}%`);
    }
    console.log('');

    // Test calendar appointments
    console.log('8. Testing GET /api/v2/appointments/calendar');
    const calendarResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/v2/appointments/calendar',
      method: 'GET'
    });
    console.log(`Status: ${calendarResponse.status}`);
    console.log(`Calendar Events: ${calendarResponse.data.data?.length || 0} found`);
    console.log('');

    // Test financial report
    console.log('9. Testing GET /api/v2/reports/financial');
    const financialResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/v2/reports/financial',
      method: 'GET'
    });
    console.log(`Status: ${financialResponse.status}`);
    if (financialResponse.data.success) {
      const report = financialResponse.data.data;
      console.log(`Financial Report:`);
      console.log(`  Total Revenue: $${report.totalRevenue}`);
      console.log(`  Collection Rate: ${report.collectionRate.toFixed(2)}%`);
      console.log(`  Payment Methods:`, Object.keys(report.paymentBreakdown));
    }
    console.log('');

    // Test creating a new appointment
    console.log('10. Testing POST /api/v2/appointments');
    const newAppointment = {
      patientId: '1',
      providerId: '2',
      facilityId: '1',
      type: 'FOLLOW_UP',
      scheduledStart: new Date('2024-03-01T10:00:00').toISOString(),
      scheduledEnd: new Date('2024-03-01T10:30:00').toISOString(),
      reason: 'Follow up visit',
      isTelehealth: false
    };
    
    const createAppointmentResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/v2/appointments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, newAppointment);
    console.log(`Status: ${createAppointmentResponse.status}`);
    console.log(`Appointment created: ${createAppointmentResponse.data.success ? 'YES' : 'NO'}`);
    console.log('');

    // Test creating a new payment
    console.log('11. Testing POST /api/v2/payments');
    const newPayment = {
      facilityId: '1',
      patientId: '1',
      type: 'THERAPY',
      totalAmount: 125.00,
      method: 'CREDIT_CARD',
      processor: 'STRIPE'
    };
    
    const createPaymentResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/v2/payments',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, newPayment);
    console.log(`Status: ${createPaymentResponse.status}`);
    console.log(`Payment created: ${createPaymentResponse.data.success ? 'YES' : 'NO'}`);
    console.log('');

    // Test wallet transactions
    console.log('12. Testing GET /api/v2/wallets/1/transactions');
    const walletTransactionsResponse = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/v2/wallets/1/transactions',
      method: 'GET'
    });
    console.log(`Status: ${walletTransactionsResponse.status}`);
    console.log(`Wallet Transactions: ${walletTransactionsResponse.data.data?.length || 0} found`);
    console.log('');

    console.log('✅ All Enhanced Mock API Tests Completed!');
    console.log('\n📊 Summary:');
    console.log('- Facilities, Patients, Appointments: Full CRUD operations');
    console.log('- Payments: Enhanced with insurance and patient responsibility');
    console.log('- Wallets: Crypto and fiat wallet management');
    console.log('- Dashboard: Comprehensive healthcare analytics');
    console.log('- Billing: Insurance claims and patient billing');
    console.log('- Calendar: Appointment scheduling and management');
    console.log('- Reports: Financial and operational reporting');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEnhancedMockAPI();
