"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Building2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/Toast";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const { success, error: toastError } = useToast();

  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Sign Up | LeadFlow - WhatsApp AI Agent";
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!businessName || !email || !password) {
      toastError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      toastError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            business_name: businessName,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        success("Account created successfully! Welcome to LeadFlow.");
        router.refresh();
        router.push("/dashboard");
      } else {
        success("Registration successful! Please verify your email, then sign in.");
        router.push("/login");
      }
    } catch (err: any) {
      console.error("[Registration Error]:", err.message || err);
      toastError(err.message || "Failed to register account. Email may already be in use.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-[#09090B] px-4 overflow-hidden selection:bg-[#6366F1]/20 selection:text-[#6366F1]">
      {/* Ambient background grid pattern (dark theme radial dots) */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
      
      {/* Soft atmospheric gradient glowing blobs in corners for high contrast */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-[#6366F1]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-[#818CF8]/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Inner page layout with a gentle float animation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Main Card */}
        <div className="w-full bg-[#18181B] rounded-3xl p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-[#27272A] relative overflow-hidden group hover:shadow-[0_20px_50px_rgba(99,102,241,0.05)] transition-all duration-300">
          {/* Elegant Top Highlight Line */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#6366F1] to-[#818cf8]" />

          {/* Header Content */}
          <div className="flex flex-col items-center text-center">
            {/* Branded Logo Mark */}
            <div className="flex flex-col items-center select-none mb-4">
              <img src="/Logo.png" alt="LeadFlow Logo" className="h-12 w-12 object-contain mb-2.5" />
              <span className="font-sans text-3xl font-extrabold tracking-tight select-none">
                <span className="text-white">Lead</span><span className="text-[#6366F1]">Flow</span>
              </span>
            </div>

            <h1 className="font-sans text-2xl font-semibold tracking-tight text-white mb-2">
              Create your account
            </h1>
            
            <p className="font-sans text-sm text-zinc-400 max-w-[300px]">
              Set up your automated sales pipeline and start capturing leads today.
            </p>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleRegister} className="mt-8 space-y-5" noValidate>
            {/* Business Name Field */}
            <div className="space-y-2">
              <label 
                htmlFor="businessName" 
                className="block text-xs font-semibold text-zinc-400 tracking-wide uppercase select-none"
              >
                Business Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Acme Corp"
                  disabled={loading}
                  className="w-full h-12 pl-10 pr-4 bg-[#09090B] border border-[#27272A] focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/10 rounded-xl text-zinc-100 text-sm font-medium outline-none transition-all duration-200 disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="block text-xs font-semibold text-zinc-400 tracking-wide uppercase select-none"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  disabled={loading}
                  className="w-full h-12 pl-10 pr-4 bg-[#09090B] border border-[#27272A] focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/10 rounded-xl text-zinc-100 text-sm font-medium outline-none transition-all duration-200 disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label 
                htmlFor="password" 
                className="block text-xs font-semibold text-zinc-400 tracking-wide uppercase select-none"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  disabled={loading}
                  className="w-full h-12 pl-10 pr-10 bg-[#09090B] border border-[#27272A] focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/10 rounded-xl text-zinc-100 text-sm font-medium outline-none transition-all duration-200 disabled:opacity-50"
                  required
                />
                <button
                  type="button"
                  id="password-visibility-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  tabIndex={-1}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="register-submit-button"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#818cf8] hover:from-[#5a5cd8] hover:to-[#737ee0] text-white font-semibold text-sm shadow-md shadow-[#6366F1]/10 hover:shadow-lg hover:shadow-[#6366F1]/20 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-98 cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-75 disabled:pointer-events-none disabled:transform-none disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Sign Up</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Toggle login page link */}
          <div className="mt-6 text-center text-sm text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="cursor-pointer text-[#6366F1] hover:text-[#818cf8] transition-colors font-semibold">
              Sign in
            </Link>
          </div>

          {/* Bottom branding footer */}
          <div className="mt-8 pt-6 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-500 select-none">
            <span>LeadFlow Cloud v1.0</span>
            <a href="/privacy" className="hover:text-zinc-400 transition-colors cursor-pointer">Privacy & Terms</a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
