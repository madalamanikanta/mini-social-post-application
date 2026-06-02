import { createContext, useContext, useEffect, useState } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import api from '../services/api';
import { auth, googleProvider } from '../firebase/firebase';

const AuthContext = createContext({});

const AUTH_STORAGE_KEY = 'miniSocialAuth';

const buildPayload = (user, token) => ({ user, token });

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.token && parsed?.user) {
          setUser(parsed.user);
          setToken(parsed.token);
        }
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(buildPayload(user, token)));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }, [token, user]);

  const saveSession = (data) => {
    setUser(data.user);
    setToken(data.token);
  };

  const signup = async (values) => {
    const response = await api.post('/auth/signup', values);
    saveSession(response.data);
    return response.data;
  };

  const login = async (values) => {
    const response = await api.post('/auth/login', values);
    saveSession(response.data);
    return response.data;
  };

  const googleSignIn = async () => {
    if (!auth || !googleProvider) {
      throw new Error('Firebase is not configured. Google sign-in is unavailable.');
    }

    const result = await signInWithPopup(auth, googleProvider);
    const profile = result.user;
    const response = await api.post('/auth/google', {
      name: profile.displayName || profile.email.split('@')[0],
      email: profile.email,
      avatar: profile.photoURL || null,
    });
    saveSession(response.data);
    return response.data;
  };

  const logout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (signOutError) {
        console.warn('Firebase sign out failed:', signOutError);
      }
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const updateProfile = async (formData) => {
    const response = await api.put('/users/me', formData);
    setUser(response.data);
    if (token) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(buildPayload(response.data, token)));
    }
    return response.data;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    signup,
    login,
    googleSignIn,
    logout,
    updateProfile,
    saveSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
