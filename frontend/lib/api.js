// Real API Client for Advancia PayLedger
// Connects to live backend: https://advanciapayledger-mock-api.advancia-platform.workers.dev

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://advanciapayledger-mock-api.advancia-platform.workers.dev";

export const apiClient = {
  // Health check
  healthCheck: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok)
        throw new Error(`Health check failed: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Health check error:", error);
      throw error;
    }
  },

  // Authentication
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Login failed: ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // User registration
  register: async (userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Registration failed: ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Profile fetch failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Profile error:", error);
      throw error;
    }
  },

  // Wallet operations
  getWallet: async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/api/wallet`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Wallet fetch failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Wallet error:", error);
      throw error;
    }
  },

  // Transaction operations
  getTransactions: async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/api/transactions`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Transactions fetch failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Transactions error:", error);
      throw error;
    }
  },

  // Send payment
  sendPayment: async (paymentData) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/api/payments/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Payment failed: ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Payment error:", error);
      throw error;
    }
  },

  // Request payment
  requestPayment: async (requestData) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`${API_BASE_URL}/api/payments/request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Payment request failed: ${response.status}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Payment request error:", error);
      throw error;
    }
  },

  // Generic request method with auth
  requestWithAuth: async (endpoint, options = {}) => {
    const token = localStorage.getItem("accessToken");
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  },
};

export default apiClient;
