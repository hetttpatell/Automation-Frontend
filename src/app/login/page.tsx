"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, Sparkles, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    document.title = "Sign In | LeadFlow - WhatsApp AI Agent";
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email || !password) {
      setErrorMsg("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      setSuccessMsg("Welcome back! Signing you in...");
      // Force the server to pick up the new auth cookie, then navigate
      router.refresh();
      router.push("/dashboard");
    } catch (err: any) {
      console.error("[Login Error]:", err.message || err);
      setErrorMsg(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="relative min-h-screen w-full flex items-center justify-center bg-[#0b0f19] px-4 overflow-hidden selection:bg-accent/20 selection:text-accent">
        {/* Ambient background grid pattern (dark theme radial dots) */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
        
        {/* Soft atmospheric gradient glowing blobs in corners for high contrast */}
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-accent-secondary/5 rounded-full blur-[130px] pointer-events-none" />

        {/* Inner page layout with a gentle float animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Main Card */}
          <div className="w-full bg-white rounded-3xl p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-slate-100/80 relative overflow-hidden group hover:shadow-[0_20px_50px_rgba(0,50,255,0.06)] transition-shadow duration-300">
            {/* Elegant Top Highlight Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-accent to-accent-secondary" />

            {/* Header Content */}
            <div className="flex flex-col items-center text-center">
              {/* Branded Logo Mark */}
              <div className="flex flex-col items-center select-none mb-4">
                <img src="/Logo.png" alt="LeadFlow Logo" className="h-12 w-12 object-contain mb-2.5" />
                <span className="font-sans text-3xl font-extrabold tracking-tight select-none">
                  <span className="text-slate-900">Lead</span><span className="text-[#6366F1]">Flow</span>
                </span>
              </div>

              <h1 className="font-sans text-2xl font-semibold tracking-tight text-slate-900 mb-1.5">
                Welcome back
              </h1>
              
              <p className="font-sans text-sm text-slate-500 max-w-[280px]">
                Sign in to manage your AI agent.
              </p>
            </div>

            {/* Form Fields */}
            <form onSubmit={handleLogin} className="mt-8 space-y-5" noValidate>
              
              {/* Alert notifications */}
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-red-50/80 border border-red-100 rounded-2xl p-4 flex items-start gap-3 text-red-700 text-xs leading-relaxed"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p>{errorMsg}</p>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3 text-emerald-700 text-xs leading-relaxed"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <p>{successMsg}</p>
                </motion.div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <label 
                  htmlFor="email" 
                  className="block text-xs font-semibold text-slate-700 tracking-wide uppercase select-none"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    disabled={loading}
                    className="w-full h-12 pl-10 pr-4 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white border border-slate-200/80 focus:border-accent rounded-xl text-slate-900 text-sm font-medium outline-hidden transition-all duration-200 focus:ring-4 focus:ring-accent/10 disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label 
                    htmlFor="password" 
                    className="block text-xs font-semibold text-slate-700 tracking-wide uppercase select-none"
                  >
                    Password
                  </label>
                  <a 
                    href="#forgot-password" 
                    id="forgot-password"
                    className="cursor-pointer text-xs font-semibold text-accent hover:text-accent-secondary transition-colors duration-150"
                  >
                    Forgot?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    disabled={loading}
                    className="w-full h-12 pl-10 pr-10 bg-slate-50/50 hover:bg-slate-50/80 focus:bg-white border border-slate-200/80 focus:border-accent rounded-xl text-slate-900 text-sm font-medium outline-hidden transition-all duration-200 focus:ring-4 focus:ring-accent/10 disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    id="password-visibility-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="login-submit-button"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-accent to-accent-secondary hover:from-accent hover:to-accent text-white font-semibold text-sm shadow-md shadow-accent/10 hover:shadow-lg hover:shadow-accent/20 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-98 cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-75 disabled:pointer-events-none disabled:transform-none disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom branding footer */}
            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 select-none">
              <span>LeadFlow Cloud v1.0</span>
              <a href="/privacy" className="hover:text-slate-600 transition-colors cursor-pointer">Privacy & Terms</a>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
