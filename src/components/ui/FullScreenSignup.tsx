"use client";
 
import { Shield } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { GlowingEffect } from "./GlowingEffect";
import toast from 'react-hot-toast';

 
export const FullScreenSignup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("User");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { signUp } = useAuthStore();
 
  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };
 
  const validatePassword = (value: string) => {
    return value.length >= 8;
  };

  const validatePasswordMatch = (password: string, confirm: string) => {
    return password === confirm;
  };
 
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    
    let valid = true;
 
    // Validate email
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
      valid = false;
    }
 
    // Validate password
    if (!validatePassword(password)) {
      setPasswordError("Password must be at least 8 characters.");
      valid = false;
    }

    // Validate password confirmation
    if (!validatePasswordMatch(password, confirmPassword)) {
      setConfirmPasswordError("Passwords do not match.");
      valid = false;
    }
 
    if (!valid) return;

    setIsSubmitting(true);

    try {
      await signUp(email, password, role);
      
      toast.success('Account created successfully! Please sign in with your new credentials.');
      
      // Redirect to login page after successful signup
      navigate('/login');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
      
      // Check if error is specifically about email confirmation
      if (errorMessage.toLowerCase().includes('confirmation email') || 
          errorMessage.toLowerCase().includes('email') || 
          errorMessage.toLowerCase().includes('sending')) {
        
        // User might be created but email failed
        toast.success('Account created successfully! Email confirmation failed, but you can still sign in with your credentials.', {
          duration: 6000,
        });
        
        // Still redirect to login since account might be created
        setTimeout(() => navigate('/login'), 2000);
        
      } else {
        // Other errors (validation, duplicate user, etc.)
        toast.error(errorMessage);
        console.error('Signup error:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
 
  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden p-4">
      <div className="w-full relative max-w-5xl overflow-hidden flex flex-col md:flex-row shadow-xl">
        {/* Background overlay */}
        <div className="w-full h-full z-2 absolute bg-gradient-to-t from-transparent to-black/10"></div>
        
        {/* Backdrop blur stripes */}
        <div className="flex absolute z-2 overflow-hidden backdrop-blur-2xl opacity-20">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[40rem] z-2 w-[4rem] bg-gradient-to-r from-transparent via-black via-[69%] to-white/30 opacity-30 overflow-hidden"></div>
          ))}
        </div>
        
        {/* Decorative shapes */}
        <div className="w-[15rem] h-[15rem] bg-gradient-to-br from-blue-500 to-cyan-500 absolute z-1 rounded-full bottom-0 opacity-60"></div>
        <div className="w-[8rem] h-[5rem] bg-gradient-to-r from-cyan-400 to-blue-400 absolute z-1 rounded-full bottom-0 left-16 opacity-40"></div>
        <div className="w-[6rem] h-[6rem] bg-gradient-to-br from-purple-500 to-blue-600 absolute z-1 rounded-full top-10 right-20 opacity-30"></div>

        {/* Left side - Dark section */}
        <div className="bg-gradient-to-br from-blue-200 via-purple-900 to-blue-900 text-white p-8 md:p-12 md:w-1/2 relative rounded-bl-3xl overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-medium leading-tight tracking-tight mb-4">
              Secure credential management for modern teams.
            </h1>
            <p className="text-blue-100 opacity-80 text-sm md:text-base">
              Protect your privileged access with enterprise-grade security, 
              just-in-time access controls, and comprehensive session monitoring.
            </p>
          </div>
        </div>

        {/* Right side - Form section */}
        <div className="p-8 md:p-12 md:w-1/2 flex flex-col bg-slate-50 relative z-10">
          <GlowingEffect
            spread={40}
            proximity={60}
            inactiveZone={0.3}
            borderWidth={2}
            glow={true}
            disabled={false}
            className="rounded-r-3xl"
          />
          
          <div className="flex flex-col items-left mb-8">
            <div className="text-blue-500 mb-4">
              <Shield className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-medium mb-2 tracking-tight text-slate-900">
              Get Started
            </h2>
            <p className="text-left opacity-80 text-slate-600">
              Create your CyberVault account and select your role
            </p>
          </div>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm mb-2 text-slate-700 font-medium">
                Your email
              </label>
              <div className="relative">
                <GlowingEffect
                  spread={20}
                  proximity={25}
                  inactiveZone={0.8}
                  borderWidth={1}
                  glow={true}
                  disabled={false}
                />
                <input
                  type="email"
                  id="email"
                  placeholder="user@cybervault.com"
                  className={`relative text-sm w-full py-3 px-4 border rounded-xl focus:outline-none focus:ring-2 bg-white/90 backdrop-blur-sm text-slate-900 focus:ring-blue-500 transition-all ${
                    emailError ? "border-red-500" : "border-slate-200"
                  }`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!emailError}
                  aria-describedby="email-error"
                />
              </div>
              {emailError && (
                <p id="email-error" className="text-red-500 text-xs mt-1">
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm mb-2 text-slate-700 font-medium">
                Create new password
              </label>
              <div className="relative">
                <GlowingEffect
                  spread={20}
                  proximity={25}
                  inactiveZone={0.8}
                  borderWidth={1}
                  glow={true}
                  disabled={false}
                />
                <input
                  type="password"
                  id="password"
                  placeholder="Minimum 8 characters"
                  className={`relative text-sm w-full py-3 px-4 border rounded-xl focus:outline-none focus:ring-2 bg-white/90 backdrop-blur-sm text-slate-900 focus:ring-blue-500 transition-all ${
                    passwordError ? "border-red-500" : "border-slate-200"
                  }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!passwordError}
                  aria-describedby="password-error"
                />
              </div>
              {passwordError && (
                <p id="password-error" className="text-red-500 text-xs mt-1">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm mb-2 text-slate-700 font-medium">
                Confirm password
              </label>
              <div className="relative">
                <GlowingEffect
                  spread={20}
                  proximity={25}
                  inactiveZone={0.8}
                  borderWidth={1}
                  glow={true}
                  disabled={false}
                />
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder="Confirm your password"
                  className={`relative text-sm w-full py-3 px-4 border rounded-xl focus:outline-none focus:ring-2 bg-white/90 backdrop-blur-sm text-slate-900 focus:ring-blue-500 transition-all ${
                    confirmPasswordError ? "border-red-500" : "border-slate-200"
                  }`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  aria-invalid={!!confirmPasswordError}
                  aria-describedby="confirmPassword-error"
                />
              </div>
              {confirmPasswordError && (
                <p id="confirmPassword-error" className="text-red-500 text-xs mt-1">
                  {confirmPasswordError}
                </p>
              )}
            </div>

            {/* Role Field */}
            <div>
              <label htmlFor="role" className="block text-sm mb-2 text-slate-700 font-medium">
                Select your role
              </label>
              <div className="relative">
                <GlowingEffect
                  spread={20}
                  proximity={25}
                  inactiveZone={0.8}
                  borderWidth={1}
                  glow={true}
                  disabled={false}
                />
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="relative text-sm w-full py-3 px-4 border rounded-xl focus:outline-none focus:ring-2 bg-white/90 backdrop-blur-sm text-slate-900 focus:ring-blue-500 transition-all border-slate-200 appearance-none cursor-pointer"
                >
                  <option value="User">User - Standard access to credential management</option>
                  <option value="Manager">Manager - Intermediate access with team oversight capabilities</option>
                  <option value="Admin">Admin - Full system access and administrative privileges</option>
                </select>
                {/* Custom dropdown arrow */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="relative mt-2">
              <GlowingEffect
                spread={25}
                proximity={30}
                inactiveZone={0.6}
                borderWidth={2}
                glow={true}
                disabled={false}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-blue-400 disabled:to-cyan-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:shadow-blue-500/25 active:scale-95 disabled:active:scale-100"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating account...
                  </span>
                ) : (
                  'Create a new account'
                )}
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center text-slate-600 text-sm mt-4">
              Already have account?{" "}
              <a href="/login" className="text-slate-900 font-medium underline hover:text-blue-600 transition-colors">
                Login
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
