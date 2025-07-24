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
