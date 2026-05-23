import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types';
import { PRECONFIGURED_USERS } from '../constants/users';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = '@campusevents_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Erreur chargement session:', e);
    } finally {
      setIsLoading(false);
    }
  }

  function login(email: string, password: string): boolean {
    const found = PRECONFIGURED_USERS.find(
      u => u.email === email && u.password === password
    );
    
    if (found) {
      setUser(found);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(found));
      return true;
    }
    return false;
  }

  function logout() {
    setUser(null);
    AsyncStorage.removeItem(STORAGE_KEY);
  }

  return React.createElement(
    AuthContext.Provider,
    { value: { user, login, logout, isLoading } },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}