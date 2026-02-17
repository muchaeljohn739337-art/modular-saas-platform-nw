import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../utils/fetcher";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  tenant_id: string;
  tenant_name: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const {
    data: user,
    error,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["user", "profile"],
    queryFn: async () => {
      const response = await api.get("/auth/profile");
      return response.data;
    },
    retry: false,
    enabled: !!localStorage.getItem("access_token"),
  });

  useEffect(() => {
    if (user) {
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });
    } else if (!isLoading) {
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, [user, isLoading]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { access_token, user } = response.data;
      
      localStorage.setItem("access_token", access_token);
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });
      
      toast.success("Logged in successfully");
      return { success: true, user };
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed");
      return { success: false, error };
    }
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
    toast.success("Logged out successfully");
  };

  return {
    ...authState,
    user,
    login,
    logout,
    refetch,
  };
}
