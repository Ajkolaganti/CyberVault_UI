import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { SignInPage, Testimonial } from '../ui/sign-in';
import toast from 'react-hot-toast';

const sampleTestimonials: Testimonial[] = [
  {
    avatarSrc: "https://images.unsplash.com/photo-1494790108755-2616b612c44e?w=400&h=400&fit=crop&crop=face",
    name: "Sarah Chen",
    handle: "@sarahsec",
    text: "CyberVault has revolutionized how we manage our security credentials. The interface is intuitive and secure."
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    name: "Marcus Johnson",
    handle: "@marcustech",
    text: "As a security professional, I trust CyberVault with our most sensitive credentials. Outstanding platform."
  },
  {
    avatarSrc: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    name: "David Martinez",
    handle: "@davidcyber",
    text: "The real-time validation and monitoring features are game-changers for our security operations."
  },
];

export const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, loading, user } = useAuthStore();

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await signIn(email, password);
      toast.success('Welcome back!');
    } catch (error) {
      toast.error('Invalid credentials');
    }
  };

  const handleGoogleSignIn = () => {
    toast.error('Google sign-in not implemented yet');
  };

  const handleResetPassword = () => {
    toast.success('Password reset link sent to your email');
  };

  const handleCreateAccount = () => {
    setIsSignUp(true);
  };

  if (isSignUp) {
    // You can create a separate SignUpPage component or extend the current one
    // For now, let's show a simple message
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
            Sign Up Feature Coming Soon
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
            We're working on the sign-up functionality. Please contact your administrator for account creation.
          </p>
          <button
            onClick={() => setIsSignUp(false)}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <SignInPage
      title={
        <span className="font-light text-gray-900 dark:text-white tracking-tighter">
          Welcome to <span className="font-semibold text-violet-600">CyberVault</span>
        </span>
      }
      description="Secure credential management for modern organizations"
      heroImageSrc="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=2160&q=80"
      testimonials={sampleTestimonials}
      onSignIn={handleSignIn}
      onGoogleSignIn={handleGoogleSignIn}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleCreateAccount}
    />
  );
};

  // Redirect if already authenticated
  if (user) {
    return <Navigate to="/" replace />;
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
      newErrors.password = 'Password must contain at least 1 lowercase, 1 uppercase, 1 number, and 1 symbol';
    }

    if (isSignUp) {
      if (!name) {
        newErrors.name = 'Name is required';
      }
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (!role) {
        newErrors.role = 'Please select a role';
      } else if (!['Admin', 'Manager', 'User'].includes(role)) {
        newErrors.role = 'Please select a valid role';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (isSignUp) {
        console.log('Attempting signup with:', { 
          email, 
          name, 
          role, 
          passwordLength: password.length 
        });
        await signUp(email, password, role);
        setShowSuccess(true);
        toast.success('Account created successfully! You can now sign in.');
        // Switch to login mode after successful signup
        setTimeout(() => {
          setIsSignUp(false);
          setShowSuccess(false);
          setPassword('');
          setConfirmPassword('');
          setName('');
          setRole('User'); // Reset to default User role
        }, 2000);
      } else {
        console.log('Attempting signin with email:', email);
        await signIn(email, password);
        toast.success('Welcome back!');
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast.error(error.message || `Failed to ${isSignUp ? 'create account' : 'sign in'}`);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    switch (field) {
      case 'email':
        setEmail(value);
        break;
      case 'password':
        setPassword(value);
        break;
      case 'confirmPassword':
        setConfirmPassword(value);
        break;
      case 'name':
        setName(value);
        break;
      case 'role':
        setRole(value);
        break;
    }
    
    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
    setErrors({});
    setPassword('');
    setConfirmPassword('');
    setName('');
    setShowSuccess(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
        <LoadingSpinner variant="dotlock" size="lg" text="Authenticating..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl font-bold text-white mb-2">
            {isSignUp ? 'Join CyberVault' : 'Welcome Back'}
          </h2>
          <p className="text-gray-300 text-lg">
            {isSignUp 
              ? 'Create your secure access management account'
              : 'Sign in to your privileged access management platform'
            }
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="bg-green-500/20 backdrop-blur-lg rounded-xl p-4 border border-green-500/30">
            <div className="flex items-center gap-3 text-green-300">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Account created successfully!</span>
            </div>
          </div>
        )}

        {/* Main Form Card */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name field for signup */}
              {isSignUp && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/90 text-gray-900 placeholder-gray-500 focus:bg-white ${
                        errors.name ? 'border-red-500 focus:ring-red-500' : 'border-white/50'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/90 text-gray-900 placeholder-gray-500 focus:bg-white ${
                      errors.email ? 'border-red-500 focus:ring-red-500' : 'border-white/50'
                    }`}
                    placeholder="Enter your email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/90 text-gray-900 placeholder-gray-500 focus:bg-white ${
                      errors.password ? 'border-red-500 focus:ring-red-500' : 'border-white/50'
                    }`}
                    placeholder={isSignUp ? "8+ chars: 1 lower, 1 upper, 1 number, 1 symbol" : "Enter your password"}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-400">{errors.password}</p>
                  )}
                </div>
              </div>

              {/* Confirm Password field for signup */}
              {isSignUp && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-white">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/90 text-gray-900 placeholder-gray-500 focus:bg-white ${
                        errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-white/50'
                      }`}
                      placeholder="Confirm your password"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Role field for signup */}
              {isSignUp && (
                <div className="space-y-2">
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-white">Role</label>
                      <select
                        value={role}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/90 text-gray-900 ${
                          errors.role 
                            ? 'border-red-500 focus:ring-red-500' 
                            : 'border-white/50'
                        }`}
                      >
                        <option value="User" className="text-gray-900">User</option>
                        <option value="Manager" className="text-gray-900">Manager</option>
                        <option value="Admin" className="text-gray-900">Admin</option>
                      </select>
                      {errors.role && (
                        <p className="text-sm text-red-400">{errors.role}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Remember me / Terms for signup */}
              <div className="flex items-center justify-between">
                {!isSignUp ? (
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded bg-white/20"
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                      Remember me
                    </label>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400">
                    By signing up, you agree to our Terms of Service
                  </div>
                )}
                
                {!isSignUp && (
                  <button
                    type="button"
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                loading={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>
          </div>
        </Card>

        {/* Toggle Auth Mode */}
        <div className="text-center">
          <p className="text-gray-400">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={toggleAuthMode}
              className="text-blue-400 hover:text-blue-300 transition-colors font-semibold"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="text-center text-gray-300">
            <Shield className="w-6 h-6 mx-auto mb-2 text-blue-400" />
            <p className="text-sm">Secure Authentication</p>
          </div>
          <div className="text-center text-gray-300">
            <Lock className="w-6 h-6 mx-auto mb-2 text-cyan-400" />
            <p className="text-sm">Encrypted Storage</p>
          </div>
          <div className="text-center text-gray-300">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-green-400" />
            <p className="text-sm">Real-time Monitoring</p>
          </div>
        </div>
      </div>
    </div>
  );
};
