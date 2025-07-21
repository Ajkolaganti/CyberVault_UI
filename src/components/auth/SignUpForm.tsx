import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

export const SignUpForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(''); // Start with empty to force selection
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { signUp, loading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Enhanced validation
    if (!email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }
    if (!password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
      return;
    }
    if (password.length < 8) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters long' }));
      return;
    }
    // Backend uses isStrongPassword() with default rules
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
      setErrors(prev => ({ 
        ...prev, 
        password: 'Password must contain at least 1 lowercase, 1 uppercase, 1 number, and 1 symbol' 
      }));
      return;
    }
    if (password !== confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      return;
    }
    if (!role || role === '') {
      setErrors(prev => ({ ...prev, role: 'Please select a role' }));
      return;
    }
    // Backend only accepts these exact case-sensitive values
    if (!['Admin', 'Manager', 'User'].includes(role)) {
      setErrors(prev => ({ ...prev, role: 'Please select a valid role' }));
      return;
    }

    try {
      console.log('Submitting registration with:', { 
        email, 
        role, 
        passwordLength: password.length,
        passwordPattern: {
          hasLower: /[a-z]/.test(password),
          hasUpper: /[A-Z]/.test(password),
          hasNumber: /\d/.test(password),
          hasSpecial: /[@$!%*?&]/.test(password)
        }
      });
      
      // Send exact values as expected by backend (case-sensitive)
      const requestBody = {
        email: email.trim().toLowerCase(),
        password: password, // Don't modify password
        role: role // Don't modify role - send exact case-sensitive value
      };
      
      console.log('Request body:', { ...requestBody, password: '[REDACTED]' });
      
      await signUp(requestBody.email, requestBody.password, requestBody.role);
      toast.success('Account created successfully! Please check your email to verify your account.');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle validation errors from backend
      if (error.message.includes('Validation errors:')) {
        toast.error(error.message);
        return;
      }
      
      // Try to extract specific field errors
      if (error.message.includes('password') || error.message.includes('role')) {
        if (error.message.includes('password')) {
          setErrors(prev => ({ 
            ...prev, 
            password: 'Password does not meet server requirements. Please try a different password.' 
          }));
        }
        if (error.message.includes('role')) {
          setErrors(prev => ({ 
            ...prev, 
            role: 'Invalid role selected. Please contact administrator.' 
          }));
        }
        return;
      }
      
      toast.error(error.message || 'Failed to create account');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 bg-white rounded opacity-90"></div>
          </div>
          <h2 className="text-3xl font-bold text-white">Create your account</h2>
          <p className="mt-2 text-gray-400">Join the secure access management platform</p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              className="bg-white/20 border-white/30 text-white placeholder-gray-300"
            />

            <Input
              label="Password"
              secure
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              className="bg-white/20 border-white/30 text-white placeholder-gray-300"
              placeholder="8+ chars: 1 lowercase, 1 uppercase, 1 number, 1 symbol"
            />

            <Input
              label="Confirm Password"
              secure
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              className="bg-white/20 border-white/30 text-white placeholder-gray-300"
            />

            <div>
              <label className="block text-sm font-medium text-white mb-1">
                Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/20 text-white ${
                  errors.role 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-white/30'
                }`}
              >
                <option value="">Select a role</option>
                <option value="User" className="text-gray-900">User</option>
                <option value="Manager" className="text-gray-900">Manager</option>
                <option value="Admin" className="text-gray-900">Admin</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-400">{errors.role}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                Available roles: User, Manager, Admin (case-sensitive)
              </p>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              Create account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};