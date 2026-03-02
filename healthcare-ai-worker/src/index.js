/**
 * Advancia Healthcare AI Worker
 * AI-powered healthcare payment processing and medical coding
 */

// AI Models simulation (replace with real AI APIs in production)
const aiModels = {
  medicalCoding: {
    accuracy: 0.95,
    processingTime: '2-3 seconds'
  },
  fraudDetection: {
    accuracy: 0.98,
    riskLevels: ['low', 'medium', 'high', 'critical']
  },
  eligibilityCheck: {
    accuracy: 0.92,
    insurers: ['Blue Cross', 'Aetna', 'UnitedHealth', 'Cigna']
  }
};

// Medical billing codes database
const billingCodes = {
  '99213': 'Office visit, established patient',
  '99214': 'Office visit, established patient, detailed',
  '99215': 'Office visit, established patient, comprehensive',
  '80053': 'Comprehensive metabolic panel',
  '85025': 'Complete blood count (CBC)'
};

// Helper functions
function analyzeMedicalDescription(description) {
  // Simulate AI medical coding analysis
  const codes = [];
  const desc = description.toLowerCase();
  
  if (desc.includes('office visit') || desc.includes('consultation')) {
    codes.push('99213');
  }
  if (desc.includes('blood test') || desc.includes('lab work')) {
    codes.push('80053');
  }
  if (desc.includes('complete blood') || desc.includes('cbc')) {
    codes.push('85025');
  }
  
  return codes.map(code => ({
    code,
    description: billingCodes[code] || 'Unknown code',
    confidence: Math.random() * 0.3 + 0.7 // 70-100% confidence
  }));
}

function detectFraud(payment) {
  // Simulate AI fraud detection
  const riskFactors = [];
  let riskScore = 0;
  
  if (payment.amount > 10000) {
    riskFactors.push('High amount transaction');
    riskScore += 30;
  }
  
  if (payment.recipient.toLowerCase().includes('test')) {
    riskFactors.push('Test recipient detected');
    riskScore += 20;
  }
  
  if (payment.description.toLowerCase().includes('urgent')) {
    riskFactors.push('Urgent payment flag');
    riskScore += 15;
  }
  
  let riskLevel = 'low';
  if (riskScore >= 60) riskLevel = 'critical';
  else if (riskScore >= 40) riskLevel = 'high';
  else if (riskScore >= 20) riskLevel = 'medium';
  
  return {
    riskLevel,
    riskScore,
    riskFactors,
    recommendation: riskLevel === 'critical' ? 'Manual review required' : 'Auto-approve'
  };
}

function checkEligibility(patientInfo, service) {
  // Simulate AI eligibility checking
  const insurer = aiModels.eligibilityCheck.insurers[
    Math.floor(Math.random() * aiModels.eligibilityCheck.insurers.length)
  ];
  
  const coverage = Math.random() * 100;
  const copay = Math.random() * 50;
  
  return {
    insurer,
    coverage: coverage.toFixed(2) + '%',
    copay: '$' + copay.toFixed(2),
    eligible: coverage > 20,
    preAuthRequired: coverage > 80,
    estimatedReimbursement: '$' + (Math.random() * 1000).toFixed(2)
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        service: 'advancia-healthcare-ai',
        timestamp: new Date().toISOString(),
        models: aiModels
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // AI Medical Coding endpoint
    if (url.pathname === '/api/ai/medical-coding' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { description, serviceType } = body;

        if (!description) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Medical description is required'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const codes = analyzeMedicalDescription(description);
        
        return new Response(JSON.stringify({
          success: true,
          data: {
            description,
            suggestedCodes: codes,
            processingTime: aiModels.medicalCoding.processingTime,
            accuracy: aiModels.medicalCoding.accuracy
          }
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid request body'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // AI Fraud Detection endpoint
    if (url.pathname === '/api/ai/fraud-detection' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { payment } = body;

        if (!payment) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Payment data is required'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const fraudAnalysis = detectFraud(payment);
        
        return new Response(JSON.stringify({
          success: true,
          data: {
            payment,
            fraudAnalysis,
            modelAccuracy: aiModels.fraudDetection.accuracy,
            processedAt: new Date().toISOString()
          }
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid request body'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // AI Eligibility Check endpoint
    if (url.pathname === '/api/ai/eligibility-check' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { patientInfo, service } = body;

        if (!patientInfo || !service) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Patient info and service details are required'
          }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }

        const eligibility = checkEligibility(patientInfo, service);
        
        return new Response(JSON.stringify({
          success: true,
          data: {
            patientInfo: { ...patientInfo, ssn: '***-**-****' }, // Mask sensitive data
            service,
            eligibility,
            modelAccuracy: aiModels.eligibilityCheck.accuracy,
            processedAt: new Date().toISOString()
          }
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });

      } catch (error) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid request body'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }
    }

    // AI Dashboard endpoint
    if (url.pathname === '/api/ai/dashboard' && request.method === 'GET') {
      return new Response(JSON.stringify({
        success: true,
        data: {
          models: aiModels,
          stats: {
            totalProcessed: Math.floor(Math.random() * 10000) + 1000,
            accuracyRate: (Math.random() * 5 + 95).toFixed(2) + '%',
            avgProcessingTime: '2.3 seconds',
            fraudPrevented: Math.floor(Math.random() * 100) + 20,
            costSavings: '$' + (Math.random() * 50000 + 10000).toFixed(2)
          },
          capabilities: [
            'Medical Coding Automation',
            'Fraud Detection & Prevention',
            'Insurance Eligibility Verification',
            'HIPAA Compliance Checking',
            'Billing Optimization',
            'Patient Risk Assessment'
          ]
        }
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // API info
    if (url.pathname === '/api/ai') {
      return new Response(JSON.stringify({
        service: 'Advancia Healthcare AI',
        version: '1.0.0',
        description: 'AI-powered healthcare payment processing platform',
        endpoints: [
          'GET /health - AI service health check',
          'POST /api/ai/medical-coding - Automatic medical billing codes',
          'POST /api/ai/fraud-detection - Payment fraud analysis',
          'POST /api/ai/eligibility-check - Insurance eligibility verification',
          'GET /api/ai/dashboard - AI analytics dashboard'
        ],
        models: aiModels
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Default response
    return new Response(JSON.stringify({
      service: 'Advancia Healthcare AI',
      status: 'running',
      message: 'AI-powered healthcare payment processing'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
};
