"use client";
 
import { Shield } from "lucide-react";
import { useState } from "react";
import { GlowingEffect } from "./GlowingEffect";

 
export const FullScreenSignup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
 
  const validateEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };
 
  const validatePassword = (value: string) => {
    return value.length >= 8;
  };
 
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let valid = true;
 
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address.");
      valid = false;
    } else {
      setEmailError("");
    }
 
    if (!validatePassword(password)) {
      setPasswordError("Password must be at least 8 characters.");
      valid = false;
    } else {
      setPasswordError("");
    }
 
    if (valid) {
      // Submission logic goes here
      console.log("Form submitted!");
      console.log("Email:", email);
      alert("Form submitted!");
      setEmail("");
      setPassword("");
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
        <div className="bg-black text-white p-8 md:p-12 md:w-1/2 relative rounded-bl-3xl overflow-hidden">
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
              Welcome to CyberVault — Let's get started
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
                className="relative w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl hover:shadow-blue-500/25 active:scale-95"
              >
                Create a new account
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
