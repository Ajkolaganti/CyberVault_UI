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

  const handleResetPassword = () => {
    toast.success('Password reset link sent to your email');
  };

  const handleCreateAccount = () => {
    setIsSignUp(true);
  };

  if (isSignUp) {
    // Navigate to the SignupPage component
    return <Navigate to="/signup" replace />;
  }

  return (
    <SignInPage
      title={
        <span className="font-light text-slate-900 dark:text-white tracking-tighter">
          Welcome to <span className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">CyberVault</span>
        </span>
      }
      description="Secure credential management for modern organizations"
      testimonials={sampleTestimonials}
      onSignIn={handleSignIn}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleCreateAccount}
    />
  );
};
