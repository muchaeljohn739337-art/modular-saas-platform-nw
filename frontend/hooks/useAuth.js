// Minimal Authentication Hook for Advancia PayLedger
import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api.js';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setUser({ name: 'Advancia User', email: 'admin@demo.com', role: 'admin' });
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.login(credentials);
      if (response.success) {
        localStorage.setItem('accessToken', response.data.tokens.accessToken);
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
    } catch (error) {
      setError(error.message || 'Authentication failed');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setError(null);
    setLoading(false);
  };

  return { user, loading, error, login, logout, isAuthenticated: !!user };
};
export default useAuth;
