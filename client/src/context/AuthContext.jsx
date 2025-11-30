import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
          const response = await api.authAPI.getMe();
          setUser(response.user);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('deviceToken');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.authAPI.login(email, password);
      setUser(response.user);
      return response.user;
    } catch (error) {
      throw error;
    }
  };

  const register = async (email, password, displayName) => {
    try {
      const response = await api.authAPI.register(email, password, displayName);
      setUser(response.user);
      return response.user;
    } catch (error) {
      throw error;
    }
  };

  const googleLogin = async (idToken) => {
    try {
      const response = await api.authAPI.googleLogin(idToken);
      setUser(response.user);
      return response.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    googleLogin,
    logout,
    setUser, // Export setUser for OAuth callback
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

