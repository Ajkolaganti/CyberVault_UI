import React, { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { checkAuthStatus } = useAuthStore();

  useEffect(() => {
    // Check authentication status on app initialization
    checkAuthStatus();
  }, [checkAuthStatus]);

  return <>{children}</>;
};