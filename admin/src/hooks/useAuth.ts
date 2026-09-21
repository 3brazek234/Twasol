import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminAccessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    // Since we don't have a /me endpoint, we decode the JWT or trust it until a 401 occurs.
    // For a robust app, we'd add a GET /api/auth/me or similar.
    // For now, we will decode the token payload.
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN') {
        setUser({
          id: payload.userId,
          email: payload.email,
          fullName: 'Admin', // Payload might not have fullName
          role: payload.role,
        });
      } else {
        // Not an admin, reject
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
      }
    } catch (e) {
      console.error('Invalid token format');
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { data } = response;
      if (data.user.role !== 'ADMIN' && data.user.role !== 'SUPER_ADMIN') {
        throw new Error('Unauthorized: Admin access required');
      }
      
      localStorage.setItem('adminAccessToken', data.accessToken);
      localStorage.setItem('adminRefreshToken', data.refreshToken);
      
      setUser(data.user);
      return true;
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    setUser(null);
    window.location.href = '/login';
  };

  return { user, loading, login, logout };
}
