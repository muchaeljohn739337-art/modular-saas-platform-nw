// Enhanced Authentication Hook for Advancia PayLedger
import { useState, useEffect } from "react";
import { apiClient } from "../lib/api.js";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        // Validate token and get user profile
        const profileResponse = await apiClient.getProfile();
        if (profileResponse.success) {
          setUser(profileResponse.data.user);
        } else {
          // Token invalid, clear it
          clearAuth();
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  const clearAuth = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("tokenExpiry");
    setUser(null);
    setError(null);
  };

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.login(credentials);

      if (response.success) {
        // Store tokens
        localStorage.setItem("accessToken", response.data.tokens.accessToken);
        localStorage.setItem("refreshToken", response.data.tokens.refreshToken);

        // Set token expiry if provided
        if (response.data.tokens.expiresIn) {
          const expiryTime = Date.now() + response.data.tokens.expiresIn * 1000;
          localStorage.setItem("tokenExpiry", expiryTime.toString());
        }

        // Set user
        setUser(response.data.user);

        return { success: true, user: response.data.user };
      } else {
        throw new Error(response.message || "Login failed");
      }
    } catch (error) {
      const errorMessage = error.message || "Authentication failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Registration function
  const register = async (userData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.register(userData);

      if (response.success) {
        // Auto-login after successful registration
        return await login({
          email: userData.email,
          password: userData.password,
        });
      } else {
        throw new Error(response.message || "Registration failed");
      }
    } catch (error) {
      const errorMessage = error.message || "Registration failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    clearAuth();
    setLoading(false);
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      // Call refresh endpoint (if available)
      const response = await apiClient.requestWithAuth("/api/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });

      if (response.success) {
        localStorage.setItem("accessToken", response.data.tokens.accessToken);
        localStorage.setItem("refreshToken", response.data.tokens.refreshToken);

        if (response.data.tokens.expiresIn) {
          const expiryTime = Date.now() + response.data.tokens.expiresIn * 1000;
          localStorage.setItem("tokenExpiry", expiryTime.toString());
        }

        return true;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      clearAuth();
      return false;
    }
  };

  // Check if token is expired
  const isTokenExpired = () => {
    const expiryTime = localStorage.getItem("tokenExpiry");
    if (!expiryTime) return false;
    return Date.now() > parseInt(expiryTime);
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.requestWithAuth("/api/auth/profile", {
        method: "PUT",
        body: JSON.stringify(profileData),
      });

      if (response.success) {
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      } else {
        throw new Error(response.message || "Profile update failed");
      }
    } catch (error) {
      const errorMessage = error.message || "Profile update failed";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Check if user is authenticated
  const isAuthenticated =
    !!user && !!localStorage.getItem("accessToken") && !isTokenExpired();

  return {
    // State
    user,
    loading,
    error,
    isAuthenticated,

    // Actions
    login,
    register,
    logout,
    refreshToken,
    updateProfile,

    // Utilities
    clearError: () => setError(null),
    checkAuthStatus,
    isTokenExpired,
  };
};

export default useAuth;
