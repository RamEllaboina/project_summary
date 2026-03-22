import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import React from 'react';
import { User, AuthResponse } from '../types';
import { apiClient } from '../utils/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<AuthResponse>;
  register: (username: string, email: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('userToken');
      const storedUser = localStorage.getItem('userData');

      if (storedToken && storedUser) {
        try {
          // Verify token is still valid
          apiClient.setToken(storedToken);
          const response = await apiClient.checkAuth();
          setUser(response.user);
          setToken(storedToken);
        } catch (error) {
          // Token is invalid, clear storage
          localStorage.removeItem('userToken');
          localStorage.removeItem('userData');
          apiClient.setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await apiClient.login(username, password);
      
      if (response.success && response.token && response.user) {
        setUser(response.user);
        setToken(response.token);
        apiClient.setToken(response.token);
        localStorage.setItem('userData', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await apiClient.register(username, email, password);
      
      if (response.success && response.token && response.user) {
        setUser(response.user);
        setToken(response.token);
        apiClient.setToken(response.token);
        localStorage.setItem('userData', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    apiClient.setToken(null);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return React.createElement(
    AuthContext.Provider,
    { value },
    children
  );
};
