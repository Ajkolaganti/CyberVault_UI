import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-2xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm transition-all focus-within:border-cyan-400/70 focus-within:bg-cyan-50/50 dark:focus-within:bg-cyan-900/20 focus-within:shadow-lg focus-within:shadow-cyan-500/10">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
  <div className={`animate-fade-in-up ${delay} flex items-start gap-3 rounded-3xl bg-white/30 dark:bg-slate-800/40 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 p-5 w-64 shadow-lg`}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-2xl ring-2 ring-white/50" alt="avatar" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium text-slate-900 dark:text-white">{testimonial.name}</p>
      <p className="text-slate-600 dark:text-slate-400">{testimonial.handle}</p>
      <p className="mt-1 text-slate-700 dark:text-slate-300">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = (
    <span className="font-light text-slate-900 dark:text-white tracking-tighter">
      Welcome to <span className="font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">CyberVault</span>
    </span>
  ),
  description = "Secure credential management for modern organizations",
  testimonials = [],
  onSignIn,
  onResetPassword,
  onCreateAccount,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans w-full bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="w-full max-w-md relative z-10">
          <div className="flex flex-col gap-6">
            <h1 className="animate-fade-in-up delay-100 text-4xl md:text-5xl font-semibold leading-tight">{title}</h1>
            <p className="animate-fade-in-up delay-200 text-slate-600 dark:text-slate-400">{description}</p>

            <form className="space-y-5" onSubmit={onSignIn}>
              <div className="animate-fade-in-up delay-300">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Email Address</label>
                <GlassInputWrapper>
                  <input 
                    name="email" 
                    type="email" 
                    placeholder="Enter your email address" 
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400" 
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-fade-in-up delay-400">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Password</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input 
                      name="password" 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="Enter your password" 
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute inset-y-0 right-3 flex items-center group"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-fade-in-up delay-500 flex items-center justify-between text-sm">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    name="rememberMe" 
                    className="w-4 h-4 text-blue-600 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 transition-colors" 
                  />
                  <span className="text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Keep me signed in</span>
                </label>
                <button 
                  type="button"
                  onClick={onResetPassword}
                  className="hover:underline text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors font-medium"
                >
                  Reset password
                </button>
              </div>

              <button 
                type="submit" 
                className="animate-fade-in-up delay-600 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 py-4 font-medium text-white transition-all duration-200 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transform hover:-translate-y-0.5"
              >
                Sign In
              </button>
            </form>

            <p className="animate-fade-in-up delay-700 text-center text-sm text-slate-600 dark:text-slate-400">
              New to our platform? 
              <button 
                onClick={onCreateAccount}
                className="ml-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors font-medium"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: gradient background with testimonials */}
      <section className="hidden md:block flex-1 relative p-4">
        {/* Gradient background */}
        <div className="animate-slide-in-right delay-300 absolute inset-4 rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600 relative overflow-hidden">
          {/* Overlay patterns */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]"></div>
          
          {/* Decorative elements */}
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-32 right-16 w-24 h-24 bg-cyan-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-purple-400/30 rounded-full blur-lg animate-pulse delay-500"></div>
          
          {/* Content overlay */}
          <div className="absolute inset-8 flex flex-col justify-center items-center text-center text-white">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                Secure by Design
              </h2>
              <p className="text-lg text-white/80 max-w-md">
                Enterprise-grade security meets intuitive design. Protect what matters most with CyberVault.
              </p>
            </div>
            
            {/* Feature highlights */}
            <div className="grid grid-cols-1 gap-4 max-w-sm">
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <span className="text-sm">Zero-trust architecture</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span className="text-sm">End-to-end encryption</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span className="text-sm">Real-time monitoring</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Testimonials */}
        {testimonials.length > 0 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
            <TestimonialCard testimonial={testimonials[0]} delay="delay-1000" />
            {testimonials[1] && (
              <div className="hidden xl:flex">
                <TestimonialCard testimonial={testimonials[1]} delay="delay-1200" />
              </div>
            )}
            {testimonials[2] && (
              <div className="hidden 2xl:flex">
                <TestimonialCard testimonial={testimonials[2]} delay="delay-1400" />
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
