/**
 * Advancia Frontend Integration
 * Connect React frontend to AI-powered backend services
 */

// API Configuration
const API_CONFIG = {
  mainAPI: 'https://advancia-payledger-api.advancia-platform.workers.dev',
  healthcareAI: 'https://advancia-healthcare-ai.advancia-platform.workers.dev'
};

// API Client Class
class AdvanciaAPIClient {
  constructor() {
    this.mainAPI = API_CONFIG.mainAPI;
    this.healthcareAI = API_CONFIG.healthcareAI;
    this.token = localStorage.getItem('advancia_token') || null;
  }

  // Authentication
  async register(userData) {
    const response = await fetch(`${this.mainAPI}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (data.success) {
      this.token = data.data.token;
      localStorage.setItem('advancia_token', this.token);
    }
    return data;
  }

  async login(credentials) {
    const response = await fetch(`${this.mainAPI}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    if (data.success) {
      this.token = data.data.token;
      localStorage.setItem('advancia_token', this.token);
    }
    return data;
  }

  // Payment Processing
  async createPayment(paymentData) {
    const response = await fetch(`${this.mainAPI}/api/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(paymentData)
    });
    return await response.json();
  }

  async getTransactions() {
    const response = await fetch(`${this.mainAPI}/api/transactions`, {
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });
    return await response.json();
  }

  // Healthcare AI Services
  async analyzeMedicalCoding(description, serviceType) {
    const response = await fetch(`${this.healthcareAI}/api/ai/medical-coding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, serviceType })
    });
    return await response.json();
  }

  async detectFraud(paymentData) {
    const response = await fetch(`${this.healthcareAI}/api/ai/fraud-detection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment: paymentData })
    });
    return await response.json();
  }

  async checkEligibility(patientInfo, service) {
    const response = await fetch(`${this.healthcareAI}/api/ai/eligibility-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientInfo, service })
    });
    return await response.json();
  }

  async getAIDashboard() {
    const response = await fetch(`${this.healthcareAI}/api/ai/dashboard`);
    return await response.json();
  }
}

// React Hook for API Integration
export const useAdvanciaAPI = () => {
  const [apiClient] = useState(() => new AdvanciaAPIClient());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const withLoading = async (callback) => {
    setLoading(true);
    setError(null);
    try {
      const result = await callback();
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    apiClient,
    loading,
    error,
    withLoading
  };
};

export default AdvanciaAPIClient;
