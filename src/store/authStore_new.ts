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
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  
  console.log('[AuthStore] Generated auth headers:', {
    'Content-Type': headers['Content-Type'],
    'Authorization': token ? 'Bearer [TOKEN_PRESENT]' : 'Not included'
  });
  
  return headers;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      loading: true,
      
      signIn: async (email: string, password: string) => {
        set({ loading: true });
        try {
          const loginEndpoint = '/api/v1/auth/login';
          console.log('[AuthStore] Attempting login at endpoint:', loginEndpoint);
          console.log('[AuthStore] Login request payload:', { email, password: '[REDACTED]' });
          
          const response = await fetch(loginEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
          
          console.log('[AuthStore] Login response status:', response.status, response.statusText);
          console.log('[AuthStore] Login response headers:', Object.fromEntries(response.headers.entries()));
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Authentication failed' }));
            console.error('[AuthStore] Login failed with error:', errorData);
            throw new Error(errorData.message || 'Invalid credentials');
          }
          
          const data = await response.json();
          console.log('[AuthStore] Login successful, received data:', { 
            user: data.user, 
            token: data.token ? 'Present' : 'Missing' 
          });
          
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
          console.log('[AuthStore] Token stored in localStorage');
          
        } catch (error) {
          console.error('[AuthStore] Login error:', error);
          set({ loading: false });
          throw error;
        }
      },
      
      signUp: async (email: string, password: string) => {
        set({ loading: true });
        try {
          const registerEndpoint = '/api/v1/auth/register';
          console.log('[AuthStore] Attempting registration at endpoint:', registerEndpoint);
          console.log('[AuthStore] Registration request payload:', { email, password: '[REDACTED]' });
          
          const response = await fetch(registerEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });
          
          console.log('[AuthStore] Registration response status:', response.status, response.statusText);
          console.log('[AuthStore] Registration response headers:', Object.fromEntries(response.headers.entries()));
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Registration failed' }));
            console.error('[AuthStore] Registration failed with error:', errorData);
            throw new Error(errorData.message || 'Failed to create account');
          }
          
          const data = await response.json();
          console.log('[AuthStore] Registration response data:', {
            user: data.user || 'Not provided',
            token: data.token ? 'Present' : 'Missing',
            message: data.message || 'No message'
          });
          
          // If backend returns token immediately, set auth state
          if (data.token && data.user) {
            console.log('[AuthStore] Registration returned token, setting auth state');
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
            console.log('[AuthStore] Token stored in localStorage after registration');
          } else {
            console.log('[AuthStore] Registration successful but no token returned, user needs to login');
            set({ loading: false });
          }
          
        } catch (error) {
          console.error('[AuthStore] Registration error:', error);
          set({ loading: false });
          throw error;
        }
      },
      
      signOut: async () => {
        set({ loading: true });
        try {
          const token = localStorage.getItem('cybervault_token');
          console.log('[AuthStore] Attempting signout, token present:', !!token);
          
          // Optional: Call backend logout endpoint
          if (token) {
            const logoutEndpoint = '/api/v1/auth/logout';
            console.log('[AuthStore] Calling logout endpoint:', logoutEndpoint);
            console.log('[AuthStore] Logout request headers:', getAuthHeaders());
            
            try {
              const response = await fetch(logoutEndpoint, {
                method: 'POST',
                headers: getAuthHeaders(),
              });
              
              console.log('[AuthStore] Logout response status:', response.status, response.statusText);
              
              if (response.ok) {
                console.log('[AuthStore] Logout endpoint call successful');
              } else {
                console.warn('[AuthStore] Logout endpoint returned error status:', response.status);
              }
            } catch (error) {
              console.warn('[AuthStore] Failed to call logout endpoint:', error);
            }
          }
          
          // Clear tokens and user data
          console.log('[AuthStore] Clearing localStorage and auth state');
          localStorage.removeItem('cybervault_token');
          set({ 
            user: null, 
            token: null, 
            loading: false 
          });
          console.log('[AuthStore] Signout completed successfully');
          
        } catch (error) {
          console.error('[AuthStore] Signout error:', error);
          set({ loading: false });
          throw error;
        }
      },
      
      resetPassword: async (email: string) => {
        const resetEndpoint = '/api/v1/auth/reset-password';
        console.log('[AuthStore] Attempting password reset at endpoint:', resetEndpoint);
        console.log('[AuthStore] Password reset request payload:', { email });
        
        const response = await fetch(resetEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email }),
        });
        
        console.log('[AuthStore] Password reset response status:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Reset failed' }));
          console.error('[AuthStore] Password reset failed with error:', errorData);
          throw new Error(errorData.message || 'Failed to send reset email');
        }
        
        const data = await response.json().catch(() => ({ message: 'Reset email sent' }));
        console.log('[AuthStore] Password reset successful:', data);
      },
      
      checkAuthStatus: async () => {
        const token = localStorage.getItem('cybervault_token');
        console.log('[AuthStore] Checking auth status, token present:', !!token);
        
        if (!token) {
          console.log('[AuthStore] No token found, setting unauthenticated state');
          set({ user: null, token: null, loading: false });
          return;
        }
        
        try {
          const authCheckEndpoint = '/api/v1/auth/me';
          console.log('[AuthStore] Validating token at endpoint:', authCheckEndpoint);
          console.log('[AuthStore] Auth check request headers:', getAuthHeaders());
          
          const response = await fetch(authCheckEndpoint, {
            headers: getAuthHeaders(),
          });
          
          console.log('[AuthStore] Auth check response status:', response.status, response.statusText);
          
          if (!response.ok) {
            console.log('[AuthStore] Token validation failed, removing token and setting unauthenticated state');
            // Token is invalid or expired
            localStorage.removeItem('cybervault_token');
            set({ user: null, token: null, loading: false });
            return;
          }
          
          const userData = await response.json();
          console.log('[AuthStore] Token validation successful, user data:', userData);
          
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
          console.log('[AuthStore] Auth state updated with validated user data');
          
        } catch (error) {
          console.error('[AuthStore] Failed to check auth status:', error);
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
