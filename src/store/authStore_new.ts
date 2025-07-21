import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  id: string;
  email: string;
  role?: string;
  name?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  checkAuthStatus: () => Promise<void>;
}

// Helper function to get auth headers for API calls
export const getAuthHeaders = () => {
  const token = localStorage.getItem('cybervault_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: true,
      
      signIn: async (email: string, password: string) => {
        set({ loading: true });
        try {
          const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Authentication failed' }));
            throw new Error(errorData.message || 'Invalid credentials');
          }
          
          const data = await response.json();
          
          // Set user data and token
          set({ 
            user: {
              id: data.user.id,
              email: data.user.email,
              role: data.user.role,
              name: data.user.name
            },
            token: data.token,
            loading: false 
          });
          
          // Store JWT token in localStorage for API calls
          localStorage.setItem('cybervault_token', data.token);
          
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      
      signUp: async (email: string, password: string) => {
        set({ loading: true });
        try {
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
          
          const data = await response.json();
          
          // If backend returns token immediately, set auth state
          if (data.token && data.user) {
            set({ 
              user: {
                id: data.user.id,
                email: data.user.email,
                role: data.user.role,
                name: data.user.name
              },
              token: data.token,
              loading: false 
            });
            
            localStorage.setItem('cybervault_token', data.token);
          } else {
            set({ loading: false });
          }
          
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      
      signOut: async () => {
        set({ loading: true });
        try {
          // Optional: Call backend logout endpoint
          const token = localStorage.getItem('cybervault_token');
          if (token) {
            try {
              await fetch('/api/v1/auth/logout', {
                method: 'POST',
                headers: getAuthHeaders(),
              });
            } catch (error) {
              console.warn('Failed to call logout endpoint:', error);
            }
          }
          
          // Clear tokens and user data
          localStorage.removeItem('cybervault_token');
          set({ 
            user: null, 
            token: null, 
            loading: false 
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },
      
      resetPassword: async (email: string) => {
        const response = await fetch('/api/v1/auth/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Reset failed' }));
          throw new Error(errorData.message || 'Failed to send reset email');
        }
      },
      
      checkAuthStatus: async () => {
        const token = localStorage.getItem('cybervault_token');
        
        if (!token) {
          set({ user: null, token: null, loading: false });
          return;
        }
        
        try {
          const response = await fetch('/api/v1/auth/me', {
            headers: getAuthHeaders(),
          });
          
          if (!response.ok) {
            // Token is invalid or expired
            localStorage.removeItem('cybervault_token');
            set({ user: null, token: null, loading: false });
            return;
          }
          
          const userData = await response.json();
          set({ 
            user: {
              id: userData.id,
              email: userData.email,
              role: userData.role,
              name: userData.name
            },
            token,
            loading: false 
          });
          
        } catch (error) {
          console.error('Failed to check auth status:', error);
          localStorage.removeItem('cybervault_token');
          set({ user: null, token: null, loading: false });
        }
      },
      
      setUser: (user: AuthUser | null) => set({ user }),
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
