import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('mediqueue_user');
      if (!saved || saved === 'undefined' || saved === 'null') return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('mediqueue_token'));
  const [loading, setLoading] = useState(false);

  // Re-fetch current user profile on app load if token exists
  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('mediqueue_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success) {
            setUser(res.data.data);
            localStorage.setItem('mediqueue_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.warn('Session verification notice:', err);
          if (err.response && err.response.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    };

    verifyUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { user: loggedInUser, token: authToken } = res.data.data;
      setToken(authToken);
      setUser(loggedInUser);
      localStorage.setItem('mediqueue_token', authToken);
      localStorage.setItem('mediqueue_user', JSON.stringify(loggedInUser));
      return loggedInUser;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.data.success) {
      const { user: registeredUser, token: authToken } = res.data.data;
      setToken(authToken);
      setUser(registeredUser);
      localStorage.setItem('mediqueue_token', authToken);
      localStorage.setItem('mediqueue_user', JSON.stringify(registeredUser));
      return registeredUser;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('mediqueue_token');
    localStorage.removeItem('mediqueue_user');
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('mediqueue_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
