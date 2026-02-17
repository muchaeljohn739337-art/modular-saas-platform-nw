import { apiClient } from "./index";

// Auth Service Types
export interface LoginRequest {
  email: string;
  password: string;
  tenant_id?: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: Service;
    role: string;
    tenant_id: string;
    created_at: string;
    updated_at: string;
    last_login?: string;
    subscription_status: string;
  };
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role: string;
  tenant_id: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenant_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  subscription_status: string;
}

export interface UpdateUserRequest {
  name?: string;
  role?: string;
  status?: string;
}

// Auth Service API Methods
export class AuthService {
  private client = apiClient;

  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return this.client.post<LoginResponse>("/auth/login", credentials);
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<LoginResponse>> {
    return this.client.post<LoginResponse>("/auth/register", userData);
  }

  async refreshToken(tokenData: RefreshTokenRequest): Promise<ApiResponse<RefreshTokenResponse>> {
    return this.client.post<RefreshTokenResponse>("/auth/refresh", tokenData);
  }

  async logout(): Promise<ApiResponse<null>> {
    return this.client.post<null>("/auth/logout");
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.client.get<User>("/auth/me");
  }

  async updateUser(userId: string, userData: UpdateUserRequest): Promise<ApiResponse<User>> {
    return this.client.patch<User>(`/auth/users/${userId}`, userData);
  }

  async changePassword(userId: string, passwordData: { current_password: string; new_password: string }): Promise<ApiResponse<null>> {
    return this.client.post<null>(`/auth/users/${userId}/change-password`, passwordData);
  }

  async resetPassword(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.client.post<{ message: string }>("/auth/reset-password", { email });
  }
}

export const authService = new AuthService();
