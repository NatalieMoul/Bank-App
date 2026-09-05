import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, getToken, setToken, clearToken } from '../api';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await apiRequest('/auth/me');
        if (data.user.role === 'admin') {
          setAdmin(data.user);
        } else {
          clearToken();
        }
      } catch (e) {
        clearToken();
      }
      setLoading(false);
    })();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      if (data.user.role !== 'admin') {
        return { success: false, message: 'This login is for administrators only.' };
      }

      setToken(data.token);
      setAdmin(data.user);
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  };

  const logout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore — clear the local session regardless.
    }
    clearToken();
    setAdmin(null);
  };

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
