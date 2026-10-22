import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import api, { initApiBaseUrl } from '../api/client';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from SecureStore on startup
  useEffect(() => {
    const loadStoredSession = async () => {
      try {
        await initApiBaseUrl();
        const token = await SecureStore.getItemAsync('accessToken');
        const storedUser = await SecureStore.getItemAsync('user');
        if (token && storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.warn('Failed to restore session', err);
      } finally {
        setLoading(false);
      }
    };
    loadStoredSession();
  }, []);

  const login = async (email, password, login_type, expected_role) => {
    const res = await api.post('/auth/login', {
      email,
      password,
      login_type,
      expected_role,
    });

    if (res.data.success) {
      const { accessToken, user: userData } = res.data;
      await SecureStore.setItemAsync('accessToken', accessToken);
      await SecureStore.setItemAsync('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout').catch(() => {});
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('user');
    } catch (err) {
      console.warn('Logout cleanup error', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
