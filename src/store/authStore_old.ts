import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthUser {
  id: string;
  email: string;
  role?: string;
  name?: string;
}

interface AuthState {
  user: AuthUser | null;
  supabaseUser: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setSupabaseUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  refreshToken: () => Promise<void>;
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthUser {
  id: string;
  email: string;
  role?: string;
  name?: string;
}

interface AuthState {
  user: AuthUser | null;
  supabaseUser: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setSupabaseUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      supabaseUser: null,
      token: null,
      loading: true,
      
      signIn: async (email: string, password: string) => {
        set({ loading: true });
        try {
          // First, sign in with Supabase
          const { data: supabaseData, error: supabaseError } = await supabase.auth.signInWithPassword({ 
            email, 
            password 
          });
          
          if (supabaseError) throw supabaseError;
          
          // Get Supabase JWT token
          const supabaseToken = supabaseData.session?.access_token;
          
          // Then authenticate with our backend API
          const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(supabaseToken && { 'X-Supabase-Token': supabaseToken })
            },
            body: JSON.stringify({ email, password }),
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Authentication failed' }));
            throw new Error(errorData.message || 'Failed to authenticate with backend');
          }
          
          const backendData = await response.json();
          
          // Set both tokens and user data
          set({ 
            user: {
              id: backendData.user.id,
              email: backendData.user.email,
              role: backendData.user.role,
              name: backendData.user.name
            },
            supabaseUser: supabaseData.user,
            token: backendData.token,
            loading: false 
          });
          
          // Store JWT token in localStorage for API calls
          localStorage.setItem('cybervault_token', backendData.token);
          
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      
      signUp: async (email: string, password: string) => {
        set({ loading: true });
        try {
          // First, register with our backend API
          const response = await fetch('/api/v1/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
            throw new Error(errorData.message || 'Failed to create account');
          }
          
          // Then sign up with Supabase
          const { error: supabaseError } = await supabase.auth.signUp({ 
            email, 
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`
            }
          });
          
          if (supabaseError) {
            console.warn('Supabase signup failed:', supabaseError.message);
            // Don't throw here as backend registration was successful
          }
          
          set({ loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      
      signOut: async () => {
        set({ loading: true });
        try {
          // Sign out from Supabase
          await supabase.auth.signOut();
          
          // Clear tokens and user data
          localStorage.removeItem('cybervault_token');
          set({ 
            user: null, 
            supabaseUser: null, 
            token: null, 
            loading: false 
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      
      resetPassword: async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`
        });
        if (error) throw error;
      },
      
      refreshToken: async () => {
        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (error) throw error;
          
          if (data.session) {
            set({ 
              supabaseUser: data.user,
              token: data.session.access_token 
            });
            localStorage.setItem('cybervault_token', data.session.access_token);
          }
        } catch (error) {
          console.error('Failed to refresh token:', error);
          // If refresh fails, sign out user
          get().signOut();
        }
      },
      
      setUser: (user: AuthUser | null) => set({ user }),
      setSupabaseUser: (supabaseUser: User | null) => set({ supabaseUser }),
      setToken: (token: string | null) => set({ token }),
      setLoading: (loading: boolean) => set({ loading }),
    }),
    {
      name: 'cybervault-auth',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token 
      }),
    }
  )
);