'use client';

class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<{ data: T }> {
    const url = `${this.baseURL}${endpoint}`;

    // Get auth token
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;

    const headers = {
      ...this.defaultHeaders,
      ...options.headers,
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized
      if (response.status === 401) {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          try {
            // Attempt to refresh token
            const refreshResponse = await fetch(
              `${this.baseURL}/api/auth/refresh`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ refreshToken }),
              },
            );

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              localStorage.setItem(
                "accessToken",
                refreshData.tokens.accessToken,
              );
              localStorage.setItem(
                "refreshToken",
                refreshData.tokens.refreshToken,
              );

              // Retry original request with new token
              const newToken = refreshData.tokens.accessToken;
              const retryResponse = await fetch(url, {
                ...options,
                headers: {
                  ...headers,
                  Authorization: `Bearer ${newToken}`,
                },
              });

              if (!retryResponse.ok) {
                throw new Error(`HTTP error! status: ${retryResponse.status}`);
              }

              return { data: await retryResponse.json() };
            } else {
              // Refresh failed, clear tokens and redirect to login
              localStorage.removeItem("accessToken");
              localStorage.removeItem("refreshToken");
              window.location.href = "/login";
              throw new Error("Authentication failed");
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            window.location.href = "/login";
            throw new Error("Authentication failed");
          }
        } else {
          // No refresh token, redirect to login
          window.location.href = "/login";
          throw new Error("Authentication required");
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
  ): Promise<{ data: T }> {
    const url = params
      ? `${endpoint}?${new URLSearchParams(params)}`
      : endpoint;
    return this.request<T>(url);
  }

  async post<T>(endpoint: string, data?: any): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<{ data: T }> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    });
  }

  async upload<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>,
  ): Promise<{ data: T }> {
    const formData = new FormData();
    formData.append("file", file);

    if (additionalData) {
      Object.keys(additionalData).forEach((key) => {
        formData.append(key, additionalData[key]);
      });
    }

    const token = localStorage.getItem("accessToken");
    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error("File upload failed:", error);
      throw error;
    }
  }
}

export const api = new ApiClient();

// API endpoints
export const endpoints = {
  // Authentication
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    me: '/api/auth/me',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
  },
  
  // Billing
  billing: {
    invoices: '/api/billing/invoices',
    services: '/api/billing/services',
    reports: {
      summary: '/api/billing/reports/summary',
      aging: '/api/billing/reports/aging',
      unpaid: '/api/billing/reports/unpaid',
    },
    patients: {
      invoices: (patientId: string) => `/api/billing/patients/${patientId}/invoices`,
      balance: (patientId: string) => `/api/billing/patients/${patientId}/balance`,
    },
  },
  
  // Payments
  payments: {
    base: '/api/payments',
    methods: '/api/payments/methods',
    reports: {
      summary: '/api/payments/reports/summary',
      methods: '/api/payments/reports/methods',
      failures: '/api/payments/reports/failures',
    },
  },
  
  // Patients
  patients: {
    base: '/api/patients',
    byId: (id: string) => `/api/patients/${id}`,
  },
  
  // Providers
  providers: {
    base: '/api/providers',
    byId: (id: string) => `/api/providers/${id}`,
  },
};

// API types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Error handling
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Request interceptor for logging
api.request = (async (endpoint: string, options: RequestInit = {}) => {
  const startTime = Date.now();
  
  try {
    const result = await ApiClient.prototype.request.call(api, endpoint, options);
    const duration = Date.now() - startTime;
    
    console.log(`API Request: ${options.method || 'GET'} ${endpoint} - ${duration}ms`);
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error(`API Error: ${options.method || 'GET'} ${endpoint} - ${duration}ms`, error);
    
    throw error;
  }
}) as any;
