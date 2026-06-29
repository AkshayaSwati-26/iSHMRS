import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('authToken');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.status === 'success') {
      const { user: loggedUser, accessToken } = res.data.data;
      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setUser(loggedUser);
      return loggedUser;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const hasRole = (roles) => {
    if (!user || !user.role) return false;
    return roles.includes(user.role.name);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasRole, isAuthenticated: !!user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
