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
  signUp: (email: string, password: string, role?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  checkAuthStatus: () => Promise<void>;
}

// Helper function to decode JWT token (client-side only for user info)
const decodeJWTPayload = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

// Helper function to get auth headers for API calls
export const getAuthHeaders = () => {
  const token = localStorage.getItem('cybervault_token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
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
          console.log('Attempting login with email:', email);
          const loginEndpoint = '/api/v1/auth/login';
          console.log('[AuthStore] Attempting login at endpoint:', loginEndpoint);
          
          const response = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include', // Important for CORS with credentials
          });
          
          console.log('Login response status:', response.status);
          console.log('Login response headers:', Object.fromEntries(response.headers.entries()));
          
          if (!response.ok) {
            let errorMessage = 'Authentication failed';
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json().catch(() => ({ message: 'Authentication failed' }));
              console.error('Login error:', errorData);
              errorMessage = errorData.message || 'Invalid credentials';
            } else {
              const textError = await response.text().catch(() => 'Authentication failed');
              console.error('Non-JSON login error:', textError);
              
              // Handle CORS errors specifically
              if (response.status === 0 || !response.status) {
                errorMessage = 'Network error: Please check if the backend server is running and CORS is properly configured.';
              } else {
                errorMessage = `Server error: ${response.status}`;
              }
            }
            
            throw new Error(errorMessage);
          }
          
          const data = await response.json();
          console.log('Login successful, received data:', { token: data.token ? 'Present' : 'Missing' });
          
          // Decode JWT to get user information
          const userPayload = decodeJWTPayload(data.token);
          if (!userPayload) {
            throw new Error('Invalid token received');
          }
          
          console.log('Decoded user info:', { 
            id: userPayload.id, 
            email: userPayload.email, 
            role: userPayload.role 
          });
          
          // Set user data and token
          set({ 
            user: {
              id: userPayload.id,
              email: userPayload.email,
              role: userPayload.role,
              name: userPayload.name || userPayload.email.split('@')[0] // Use email prefix as fallback name
            },
            token: data.token,
            loading: false 
          });
          
          // Store JWT token in localStorage for API calls
          localStorage.setItem('cybervault_token', data.token);
          
        } catch (error) {
          console.error('Login error:', error);
          set({ loading: false });
          throw error;
        }
      },
      
      signUp: async (email: string, password: string, role: string = 'user') => {
        set({ loading: true });
        try {
          console.log('Attempting registration with email:', email, 'role:', role);
          
          const response = await fetch('/api/v1/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ email, password, role }),
            credentials: 'include', // Important for CORS with credentials
          });
          
          console.log('Registration response status:', response.status);
          console.log('Registration response headers:', Object.fromEntries(response.headers.entries()));
          
          if (!response.ok) {
            let errorMessage = 'Registration failed';
            const contentType = response.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
              const errorData = await response.json();
              console.error('Registration error data:', errorData);
              
              // Handle validation errors
              if (errorData.errors && Array.isArray(errorData.errors)) {
                const validationErrors = errorData.errors.map((err: any) => 
                  `${err.path}: ${err.msg}`
                ).join(', ');
                errorMessage = `Validation errors: ${validationErrors}`;
              } else {
                errorMessage = errorData.message || errorMessage;
              }
            } else {
              const textError = await response.text();
              console.error('Non-JSON registration error:', textError);
              
              // Handle CORS errors specifically
              if (response.status === 0 || !response.status) {
                errorMessage = 'Network error: Please check if the backend server is running and CORS is properly configured.';
              } else {
                errorMessage = `Server error: ${response.status}`;
              }
            }
            
            throw new Error(errorMessage);
          }
          
          const data = await response.json();
          console.log('Registration successful:', data.message);
          
          // Backend only returns success message, not token
          // User needs to login after registration
          set({ loading: false });
          
        } catch (error) {
          console.error('Registration error:', error);
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
          // Decode the JWT token to get user info
          const userPayload = decodeJWTPayload(token);
          
          if (!userPayload) {
            console.log('Invalid token found, removing from storage');
            localStorage.removeItem('cybervault_token');
            set({ user: null, token: null, loading: false });
            return;
          }
          
          // Check if token is expired
          const currentTime = Math.floor(Date.now() / 1000);
          if (userPayload.exp && userPayload.exp < currentTime) {
            console.log('Token expired, removing from storage');
            localStorage.removeItem('cybervault_token');
            set({ user: null, token: null, loading: false });
            return;
          }
          
          console.log('Valid token found, setting user from JWT payload');
          set({ 
            user: {
              id: userPayload.id,
              email: userPayload.email,
              role: userPayload.role,
              name: userPayload.name || userPayload.email.split('@')[0]
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
