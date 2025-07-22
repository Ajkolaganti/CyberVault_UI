"use client";
 
import { ShieldIcon } from "lucide-react";
import { useState } from "react";

 
export const FullScreenSignupNew = () => {
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
        <div className="w-full h-full z-2 absolute bg-gradient-to-t from-transparent to-black"></div>
        <div className="flex absolute z-2 overflow-hidden backdrop-blur-2xl">
          <div className="h-[40rem] z-2 w-[4rem] bg-gradient-to-r from-transparent via-black via-[69%] to-white/30 opacity-30 overflow-hidden"></div>
          <div className="h-[40rem] z-2 w-[4rem] bg-gradient-to-r from-transparent via-black via-[69%] to-white/30 opacity-30 overflow-hidden"></div>
          <div className="h-[40rem] z-2 w-[4rem] bg-gradient-to-r from-transparent via-black via-[69%] to-white/30 opacity-30 overflow-hidden"></div>
          <div className="h-[40rem] z-2 w-[4rem] bg-gradient-to-r from-transparent via-black via-[69%] to-white/30 opacity-30 overflow-hidden"></div>
          <div className="h-[40rem] z-2 w-[4rem] bg-gradient-to-r from-transparent via-black via-[69%] to-white/30 opacity-30 overflow-hidden"></div>
          <div className="h-[40rem] z-2 w-[4rem] bg-gradient-to-r from-transparent via-black via-[69%] to-white/30 opacity-30 overflow-hidden"></div>
        </div>
        <div className="w-[15rem] h-[15rem] bg-blue-500 absolute z-1 rounded-full bottom-0"></div>
        <div className="w-[8rem] h-[5rem] bg-cyan-400 absolute z-1 rounded-full bottom-0"></div>
        <div className="w-[8rem] h-[5rem] bg-cyan-400 absolute z-1 rounded-full bottom-0"></div>
 
        <div className="bg-black text-white p-8 md:p-12 md:w-1/2 relative rounded-bl-3xl overflow-hidden">
          <h1 className="text-2xl md:text-3xl font-medium leading-tight z-10 tracking-tight relative">
            Secure credential management for modern teams.
          </h1>
        </div>
 
        <div className="p-8 md:p-12 md:w-1/2 flex flex-col bg-slate-50 z-99 text-slate-900">
          <div className="flex flex-col items-left mb-8">
            <div className="text-blue-500 mb-4">
              <ShieldIcon className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-medium mb-2 tracking-tight">
              Get Started
            </h2>
            <p className="text-left opacity-80">
              Welcome to CyberVault — Let's get started
            </p>
          </div>
 
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit}
            noValidate
          >
            <div>
              <label htmlFor="email" className="block text-sm mb-2">
                Your email
              </label>
              <input
                type="email"
                id="email"
                placeholder="user@cybervault.com"
                className={`text-sm w-full py-2 px-3 border rounded-lg focus:outline-none focus:ring-1 bg-white text-black focus:ring-blue-500 ${
                  emailError ? "border-red-500" : "border-gray-300"
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!emailError}
                aria-describedby="email-error"
              />
              {emailError && (
                <p id="email-error" className="text-red-500 text-xs mt-1">
                  {emailError}
                </p>
              )}
            </div>
 
            <div>
              <label htmlFor="password" className="block text-sm mb-2">
                Create new password
              </label>
              <input
                type="password"
                id="password"
                className={`text-sm w-full py-2 px-3 border rounded-lg focus:outline-none focus:ring-1 bg-white text-black focus:ring-blue-500 ${
                  passwordError ? "border-red-500" : "border-gray-300"
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!passwordError}
                aria-describedby="password-error"
              />
              {passwordError && (
                <p id="password-error" className="text-red-500 text-xs mt-1">
                  {passwordError}
                </p>
              )}
            </div>
 
            <button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Create a new account
            </button>
 
            <div className="text-center text-gray-600 text-sm">
              Already have account?{" "}
              <a href="/login" className="text-slate-900 font-medium underline">
                Login
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
