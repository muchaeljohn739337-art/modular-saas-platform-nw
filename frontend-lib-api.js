// API Configuration for Advancia PayLedger Frontend
// Connects frontend to live backend API

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://advanciapayledger-mock-api.advancia-platform.workers.dev';

export const apiClient = {
  // Health check
  healthCheck: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return await response.json();
  },

  // Authentication
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    return await response.json();
  },

  testAuth: async () => {
    const response = await fetch(`${API_BASE_URL}/api/auth/test`);
    return await response.json();
  },

  // Wallet operations
  getWallet: async () => {
    const response = await fetch(`${API_BASE_URL}/api/wallet/test`);
    return await response.json();
  },

  // Generic request method
  request: async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  },

  // Get with auth token
  getWithAuth: async (endpoint) => {
    const token = localStorage.getItem('accessToken');
    return apiClient.request(endpoint, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Post with auth token
  postWithAuth: async (endpoint, data) => {
    const token = localStorage.getItem('accessToken');
    return apiClient.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
};

// Export for easy import
export default apiClient;
