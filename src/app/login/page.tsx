"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Check, CheckCheck, Video, Phone, ChevronLeft } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/Toast";

interface Message {
  id: string;
  sender: "customer" | "agent";
  text: string;
  time: string;
  showStep: number;
}

const conversation: Message[] = [
  {
    id: "msg-1",
    sender: "customer",
    text: "Hi, I need a ceramic coating for my Tesla, it is an emergency! Can I book today?",
    time: "9:33 PM",
    showStep: 1
  },
  {
    id: "msg-2",
    sender: "agent",
    text: "Hello! I can certainly help with that. Let me check our availability. What model of Tesla is it, and what is your location?",
    time: "6:43 PM",
    showStep: 3
  }
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [step, setStep] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Multi-step loop with precise intervals
  useEffect(() => {
    let t: NodeJS.Timeout;

    const timings = [
      800,   // step 0 -> 1: Show customer message (showStep: 1)
      1000,  // step 1 -> 2: Show typing indicator (step: 2)
      1800,  // step 2 -> 3: Show agent message (showStep: 3)
      8000   // step 3 -> 0: Wait before resetting loop
    ];

    t = setTimeout(() => {
      if (step < 3) {
        setStep(prev => prev + 1);
      } else {
        setStep(0);
      }
    }, timings[step] || 2000);

    return () => clearTimeout(t);
  }, [step]);

  // Auto-scroll chat container to the bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [step]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      toastError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      success("Welcome back! Signing you in...");
      router.refresh();
      router.push("/dashboard");
    } catch (err: any) {
      if (err.message === "Email not confirmed") {
        toastError("Please confirm your email address before signing in. Check your inbox for the verification link.");
      } else {
        console.error("[Login Error]:", err.message || err);
        toastError(err.message || "Invalid credentials. Please check your email and password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const dotVariants = {
    initial: { y: 0 },
    animate: {
      y: [0, -5, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        repeatType: "reverse" as const,
      }
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col lg:flex-row bg-[#FAFAFA] text-slate-800 selection:bg-accent/20 selection:text-accent">
      
      {/* ─── LEFT PANEL (Full-bleed Marketing Sidebar) ─── */}
      <div className="hidden lg:flex lg:w-[50%] xl:w-[50%] min-h-screen bg-[#ebf3fc] px-8 pt-8 lg:px-12 lg:pt-12 xl:px-16 xl:pt-16 pb-0 lg:pb-0 flex flex-col justify-between relative overflow-hidden shrink-0">
        
        {/* Branding Logo Header (Navbar with Logo) */}
        <div className="relative z-10 flex items-center justify-center gap-2 select-none self-center">
          <img src="/Logo.png" alt="LeadFlow Logo" className="h-7 w-7 lg:h-8 lg:w-8 object-contain" />
          <span className="font-sans text-2xl lg:text-3xl font-extrabold tracking-tight text-[#0f172a]">
            LeadFlow
          </span>
        </div>

        {/* Centered Title & Description */}
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center w-full max-w-lg mx-auto py-8">
          <div className="w-full text-center">
            <h2 className="text-[32px] lg:text-[36px] font-bold text-[#0f172a] leading-[1.25] mb-4 font-sans tracking-tight">
              Automate your sales <br /> pipeline with AI
            </h2>
            <p className="text-[14px] text-[#475569] max-w-[420px] mx-auto leading-relaxed font-sans">
              Engage WhatsApp leads 24/7. Deploy custom AI agents to qualify customers, offer service options, and save verified bookings.
            </p>

            {/* Feature Highlights */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-6 max-w-md mx-auto select-none">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-slate-200/60 shadow-xs text-[11px] font-bold text-slate-800 backdrop-blur-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                24/7 Auto-Reply
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-slate-200/60 shadow-xs text-[11px] font-bold text-slate-800 backdrop-blur-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
                Smart AI Brain
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/70 border border-slate-200/60 shadow-xs text-[11px] font-bold text-slate-800 backdrop-blur-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6] animate-pulse" />
                Instant Bookings
              </div>
            </div>

          </div>
        </div>

        {/* iPhone 15 Pro Container at the bottom edge */}
        <div className="hidden lg:flex justify-center items-end relative w-full mt-auto select-none shrink-0">
          <div className="relative w-[350px] h-[400px] border-[6px] border-[#0f172a] border-b-0 rounded-t-[2.8rem] bg-[#0f172a] shadow-[0_25px_55px_-10px_rgba(0,0,0,0.18)] overflow-hidden ring-1 ring-[#0f172a]/10 flex flex-col">
            
            {/* iPhone Inner Screen */}
            <div className="absolute inset-[1px] rounded-t-[2.5rem] overflow-hidden bg-[#efeae2] flex flex-col h-full">
              
              {/* iOS Status Bar */}
              <div className="w-full h-8 pt-2 px-6 flex items-center justify-between text-[11px] font-semibold text-slate-800 bg-[#efeae2] shrink-0 select-none z-20">
                <span>9:41</span>
                <div className="flex items-center gap-1.5">
                  <div className="flex gap-[1.5px] items-end h-2.5">
                    <span className="w-[2.5px] h-1 bg-slate-800 rounded-2xs" />
                    <span className="w-[2.5px] h-1.5 bg-slate-800 rounded-2xs" />
                    <span className="w-[2.5px] h-2 bg-slate-800 rounded-2xs" />
                    <span className="w-[2.5px] h-2.5 bg-slate-800 rounded-2xs" />
                  </div>
                  <span className="text-[9px] font-bold tracking-tight">5G</span>
                  <div className="w-5 h-2.5 border border-slate-800/85 rounded-sm p-[1px] flex items-center">
                    <div className="h-full w-[85%] bg-slate-800 rounded-3xs" />
                  </div>
                </div>
              </div>

              {/* iPhone Dynamic Island */}
              <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-20 h-4 bg-[#0f172a] rounded-full z-30 flex items-center justify-center pointer-events-none">
                <div className="w-1.5 h-1.5 rounded-full bg-[#101010] absolute right-3" />
              </div>

              {/* Authentic WhatsApp Contact Header (Light) */}
              <div className="bg-[#f0f2f5] px-3.5 pb-2 pt-1.5 flex items-center justify-between shrink-0 z-10 select-none shadow-sm border-b border-slate-200/50">
                <div className="flex items-center gap-1.5">
                  <ChevronLeft className="w-5 h-5 text-[#007AFF] cursor-pointer" />
                  <div className="relative w-8 h-8 rounded-full bg-[#0f172a] flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                    <span className="font-sans text-xs">L</span>
                  </div>
                  <div className="flex flex-col ml-0.5">
                    <div className="flex items-center gap-1">
                      <span className="text-[12px] font-bold text-[#0f172a] tracking-wide">LeadFlow Business</span>
                      <div className="w-3.5 h-3.5 rounded-full bg-[#10B981] flex items-center justify-center text-white scale-80 shrink-0">
                        <Check className="w-2.5 h-2.5 text-white stroke-[3.5]" />
                      </div>
                    </div>
                    <span className="text-[9px] text-[#475569] font-medium leading-none mt-0.5">verified</span>
                  </div>
                </div>
                <div className="flex items-center gap-3.5 text-[#007AFF]">
                  <Video className="w-4 h-4" />
                  <Phone className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* WhatsApp Chat Canvas */}
              <div 
                ref={chatContainerRef}
                className="flex-1 px-3.5 py-3 flex flex-col gap-2.5 bg-[#efeae2] overflow-y-auto relative scrollbar-none"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {/* WhatsApp background pattern (subtle overlay) */}
                <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm16 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm20-12a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-30 24a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm24 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' fill='%23000000' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />

                <div className="self-center my-1 bg-[#eae6df] text-[#475569] text-[9px] font-bold px-2 py-0.5 rounded-md shadow-xs select-none">
                  Today
                </div>

                <AnimatePresence mode="popLayout">
                  {conversation
                    .filter(msg => step >= msg.showStep)
                    .map((msg) => {
                      const isCustomer = msg.sender === "customer";
                      
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 15, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          className={`flex flex-col max-w-[85%] relative z-10 ${isCustomer ? "self-end items-end" : "self-start items-start"}`}
                        >
                          <div className={`relative text-xs px-3 py-2 rounded-xl shadow-xs font-sans leading-relaxed ${isCustomer ? "bg-[#dcf8c6] text-slate-900 rounded-tr-none" : "bg-white text-slate-900 rounded-tl-none"}`}>
                            {isCustomer ? (
                              <div className="absolute top-0 right-[-5px] w-[6px] h-[8px] text-[#dcf8c6] fill-current">
                                <svg width="6" height="8" viewBox="0 0 6 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M0 0C3 0 6 0 6 0V8C6 8 5 4.5 0 0Z" fill="currentColor" />
                                </svg>
                              </div>
                            ) : (
                              <div className="absolute top-0 left-[-5px] w-[6px] h-[8px] text-white fill-current">
                                <svg width="6" height="8" viewBox="0 0 6 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path d="M6 0C3 0 0 0 0 0V8C0 8 1 4.5 6 0Z" fill="currentColor" />
                                </svg>
                              </div>
                            )}
                            <span className="text-[12px]">{msg.text}</span>
                            <div className="flex items-center justify-end gap-1 mt-1 text-[8.5px] text-slate-500/70 select-none leading-none">
                              <span>{msg.time}</span>
                              {isCustomer && (
                                <CheckCheck className="w-3 h-3 text-[#34B7F1]" />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                  {step === 2 && (
                    <motion.div
                      key="typing-indicator"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.1 } }}
                      className="flex flex-col items-start self-start max-w-[85%] relative z-10"
                    >
                      <div className="relative bg-white text-slate-800 px-3.5 py-2.5 rounded-xl rounded-tl-none shadow-xs flex items-center gap-1">
                        <div className="absolute top-0 left-[-5px] w-[6px] h-[8px] text-white fill-current">
                          <svg width="6" height="8" viewBox="0 0 6 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 0C3 0 0 0 0 0V8C0 8 1 4.5 6 0Z" fill="currentColor" />
                          </svg>
                        </div>
                        <div className="flex gap-0.5 items-center justify-center h-2">
                          <motion.span variants={dotVariants} initial="initial" animate="animate" transition={{ delay: 0 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                          <motion.span variants={dotVariants} initial="initial" animate="animate" transition={{ delay: 0.12 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                          <motion.span variants={dotVariants} initial="initial" animate="animate" transition={{ delay: 0.24 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL (Full-bleed Authentication Form) ─── */}
      <div className="flex-1 min-h-screen bg-white flex flex-col justify-between items-center p-8 lg:p-12 xl:p-16 relative">
        
        {/* Spacer top to push content center */}
        <div className="flex-1 flex items-center justify-center w-full">
          {/* Form Container */}
          <div className="w-full max-w-[360px] flex flex-col justify-center py-10 lg:py-0">
            
            {/* Mobile Branding Logo Header */}
            <div className="flex items-center gap-2 select-none mb-8 lg:hidden justify-center">
              <img src="/Logo.png" alt="LeadFlow Logo" className="h-8 w-8 object-contain" />
              <span className="font-sans text-2xl font-extrabold tracking-tight text-[#0f172a]">
                LeadFlow
              </span>
            </div>

            {/* Header */}
            <div className="text-left mb-8">
              <h1 className="text-[32px] font-bold tracking-tight text-slate-900 mb-2.5 font-sans leading-tight">
                Welcome back
              </h1>
              <p className="text-sm text-slate-500 leading-relaxed font-sans">
                Sign in to your LeadFlow account to manage your automated sales pipeline.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5" noValidate>
              
              {/* Email Input */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-[11px] font-bold text-slate-550 tracking-wider uppercase select-none"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div
                    className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-150"
                    style={{ color: focusedField === "email" ? "#3b82f6" : "#94a3b8" }}
                  >
                    <Mail className="w-[17px] h-[17px]" strokeWidth={1.8} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="name@company.com"
                    disabled={loading}
                    className="w-full h-11 pl-10.5 pr-4 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)] disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-[11px] font-bold text-slate-550 tracking-wider uppercase select-none"
                >
                  Password
                </label>
                <div className="relative">
                  <div
                    className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-150"
                    style={{ color: focusedField === "password" ? "#3b82f6" : "#94a3b8" }}
                  >
                    <Lock className="w-[17px] h-[17px]" strokeWidth={1.8} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full h-11 pl-10.5 pr-11 rounded-xl text-sm font-medium bg-white border border-slate-200 text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)] disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-[17px] h-[17px]" strokeWidth={1.8} /> : <Eye className="w-[17px] h-[17px]" strokeWidth={1.8} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-full text-white font-semibold text-sm cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-75 disabled:pointer-events-none transition-all duration-350 transform active:scale-[0.98] select-none bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing In…</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>

            </form>

            {/* Toggle Link */}
            <div className="mt-6 text-center text-xs text-slate-500 select-none">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="cursor-pointer font-bold text-indigo-650 hover:text-indigo-555 transition-colors"
              >
                Sign up
              </Link>
            </div>

          </div>
        </div>

        {/* Footer always at the bottom of the right column */}
        <div className="w-full text-center text-xs text-slate-400 select-none pb-6 lg:pb-0">
          <span>LeadFlow Cloud v1.0 — © 2026</span>
        </div>

      </div>

    </div>
  );
}
