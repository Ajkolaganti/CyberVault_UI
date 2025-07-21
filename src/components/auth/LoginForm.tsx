import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { signIn, loading } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!email) {
      setErrors(prev => ({ ...prev, email: 'Email is required' }));
      return;
    }
    if (!password) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
      return;
    }

    try {
      await signIn(email, password);
      toast.success('Welcome back!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg mx-auto mb-4 flex items-center justify-center">
            <div className="w-8 h-8 bg-white rounded opacity-90"></div>
          </div>
          <h2 className="text-3xl font-bold text-white">Sign in to CyberVault</h2>
          <p className="mt-2 text-gray-400">Secure access management platform</p>
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
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                  Remember me
                </label>
              </div>
              <Link
                to="/reset-password"
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              Sign in
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};