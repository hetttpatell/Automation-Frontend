"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Check, CheckCheck, Sparkles, Video, Phone, MoreVertical, Flame, Database, Plus, Camera, Mic, ChevronLeft, User2, Building2 } from "lucide-react";
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
    time: "9:41 AM",
    showStep: 1
  },
  {
    id: "msg-2",
    sender: "agent",
    text: "Hello! I can certainly help with that. Let me check our availability. What model of Tesla is it, and what is your location?",
    time: "9:41 AM",
    showStep: 3
  },
  {
    id: "msg-3",
    sender: "customer",
    text: "It is a Model Y. I am located in downtown.",
    time: "9:42 AM",
    showStep: 4
  },
  {
    id: "msg-4",
    sender: "agent",
    text: "Perfect. We have a slot open at 4:00 PM today with our mobile detailing team. Would you like me to book this for you?",
    time: "9:42 AM",
    showStep: 6
  },
  {
    id: "msg-5",
    sender: "customer",
    text: "Yes please, book it! My name is Amit, phone: +1-555-0199.",
    time: "9:43 AM",
    showStep: 7
  },
  {
    id: "msg-6",
    sender: "agent",
    text: "Great, Amit! I have booked your slot at 4:00 PM for the Tesla Model Y Ceramic Coating. Detailing team is on their way.",
    time: "9:43 AM",
    showStep: 9
  }
];

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const { success, error: toastError } = useToast();

  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [step, setStep] = useState(0);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Multi-step loop with precise intervals matching landing page
  useEffect(() => {
    let t: NodeJS.Timeout;

    const timings = [
      1000, // 0 -> 1: Customer msg 1
      1200, // 1 -> 2: Agent typing 1
      1800, // 2 -> 3: Agent reply 1
      1500, // 3 -> 4: Customer msg 2
      1200, // 4 -> 5: Agent typing 2
      1800, // 5 -> 6: Agent reply 2
      1500, // 6 -> 7: Customer msg 3
      1200, // 7 -> 8: Agent typing 3
      2000, // 8 -> 9: Agent reply 3
      1800, // 9 -> 10: Lead Card Wow Moment
      10000 // 10 -> 0: Wait and reset loop
    ];

    t = setTimeout(() => {
      if (step < 10) {
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
      <div className="w-full lg:w-[50%] xl:w-[55%] min-h-screen bg-[#F8FAFC] border-r border-slate-200/80 p-8 lg:p-12 xl:p-16 flex flex-col justify-between relative overflow-hidden shrink-0">
        
        {/* Subtle grid pattern for texture */}
        <div 
          className="absolute inset-0 opacity-[0.05] pointer-events-none" 
          style={{ 
            backgroundImage: "linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)", 
            backgroundSize: "14px 24px" 
          }} 
        />
        <div className="absolute top-0 left-1/4 w-[350px] h-[350px] bg-accent/5 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-accent-secondary/5 rounded-full blur-[110px] pointer-events-none" />

        {/* Branding Logo Header */}
        <div className="relative z-10 flex items-center gap-2.5 select-none self-start mb-10 lg:mb-0">
          <div className="p-1.5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <img src="/Logo.png" alt="LeadFlow Logo" className="h-7 w-7 object-contain" />
          </div>
          <span className="font-sans text-xl font-bold tracking-tight text-slate-900">
            Lead<span className="text-accent">Flow</span>
          </span>
        </div>

        {/* Center content containing text and iPhone mockup */}
        <div className="relative z-10 my-auto flex flex-col items-center w-full max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full text-center mb-8"
          >
            <h2 className="text-3xl lg:text-4xl font-calistoga text-slate-900 leading-[1.25] mb-3.5 tracking-tight">
              Automate your sales pipeline with{" "}
              <span className="bg-gradient-to-r from-accent to-accent-secondary bg-clip-text text-transparent select-none font-calistoga">
                AI
              </span>
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed font-sans max-w-md mx-auto">
              Engage WhatsApp leads 24/7. Deploy custom AI agents to qualify customers, offer service options, and save verified bookings.
            </p>
          </motion.div>

          {/* iPhone 15 Pro Container */}
          <div className="hidden lg:flex items-center justify-center relative w-full scale-[0.85] origin-center xl:scale-[0.9]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-gradient-to-tr from-accent/8 to-accent-secondary/8 rounded-full blur-[60px] -z-10 pointer-events-none" />

            <div className="relative w-[320px] h-[620px] border-[6px] border-slate-950 rounded-[2.8rem] bg-slate-950 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.12)] overflow-visible ring-1 ring-slate-900/10">
              
              {/* iPhone Inner Screen */}
              <div className="absolute inset-[1px] rounded-[2.5rem] overflow-hidden bg-[#e5ddd5] flex flex-col">
                
                {/* iOS Status Bar */}
                <div className="w-full h-9 pt-2 px-6 flex items-center justify-between text-[11px] font-semibold text-white/95 bg-[#075e54] shrink-0 select-none z-20">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-[1.5px] items-end h-2.5">
                      <span className="w-[2.5px] h-1 bg-white rounded-2xs" />
                      <span className="w-[2.5px] h-1.5 bg-white rounded-2xs" />
                      <span className="w-[2.5px] h-2 bg-white rounded-2xs" />
                      <span className="w-[2.5px] h-2.5 bg-white rounded-2xs" />
                    </div>
                    <span className="text-[9px] font-bold tracking-tight">5G</span>
                    <div className="w-5 h-2.5 border border-white/80 rounded-sm p-[1px] flex items-center">
                      <div className="h-full w-[85%] bg-white rounded-3xs" />
                    </div>
                  </div>
                </div>

                {/* iPhone Dynamic Island */}
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-20 h-4.5 bg-slate-950 rounded-full z-30 flex items-center justify-center pointer-events-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#101010] absolute right-3" />
                </div>

                {/* Authentic WhatsApp Contact Header */}
                <div className="bg-[#075e54] px-3.5 pb-2.5 pt-1.5 flex items-center justify-between shrink-0 z-10 select-none shadow-md">
                  <div className="flex items-center gap-1.5">
                    <ChevronLeft className="w-5 h-5 text-white cursor-pointer" />
                    <div className="relative w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white shrink-0 overflow-hidden">
                      <User2 className="w-5 h-5 text-white/80" />
                    </div>
                    <div className="flex flex-col ml-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[12px] font-bold text-white tracking-wide">LeadFlow Business</span>
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-white/20 flex items-center justify-center text-white scale-80 shrink-0">
                          <Check className="w-2.5 h-2.5 text-white stroke-[3.5]" />
                        </div>
                      </div>
                      <span className="text-[9px] text-emerald-300 font-medium leading-none mt-0.5">online</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3.5 text-white/90">
                    <Video className="w-4 h-4" />
                    <Phone className="w-3.5 h-3.5" />
                    <MoreVertical className="w-4 h-4" />
                  </div>
                </div>

                {/* WhatsApp Chat Canvas */}
                <div 
                  ref={chatContainerRef}
                  className="flex-1 px-3.5 py-4 flex flex-col gap-3.5 bg-[#e5ddd5] overflow-y-auto relative scrollbar-none"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm16 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm20-12a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-30 24a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm24 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' fill='%23000000' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />

                  <AnimatePresence mode="popLayout">
                    {conversation
                      .filter(msg => step >= msg.showStep)
                      .map((msg) => {
                        const isCustomer = msg.sender === "customer";
                        
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ type: "spring", stiffness: 260, damping: 22 }}
                            className={`flex flex-col max-w-[85%] relative z-10 ${isCustomer ? "self-end items-end" : "self-start items-start"}`}
                          >
                            <div className={`relative text-xs px-3.5 py-2.5 rounded-2xl shadow-xs font-sans leading-relaxed ${isCustomer ? "bg-[#dcf8c6] text-slate-800 rounded-tr-none" : "bg-white text-slate-800 rounded-tl-none"}`}>
                              {isCustomer ? (
                                <div className="absolute top-0 right-[-6px] w-[8px] h-[10px] text-[#dcf8c6] fill-current">
                                  <svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M0 0C4 0 8 0 8 0V10C8 10 7 5.5 0 0Z" fill="currentColor" />
                                  </svg>
                                </div>
                              ) : (
                                <div className="absolute top-0 left-[-6px] w-[8px] h-[10px] text-white fill-current">
                                  <svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M8 0C4 0 0 0 0 0V10C0 10 1 5.5 8 0Z" fill="currentColor" />
                                  </svg>
                                </div>
                              )}
                              <span>{msg.text}</span>
                              {isCustomer && (
                                <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-500/70 select-none">
                                  <span>{msg.time}</span>
                                  <CheckCheck className={`w-3.5 h-3.5 transition-colors duration-300 ${step > msg.showStep ? "text-[#34B7F1]" : "text-slate-400"}`} />
                                </div>
                              )}
                              {!isCustomer && (
                                <div className="flex items-center justify-start gap-1 mt-1 text-[9px] text-slate-400 select-none">
                                  <span>{msg.time}</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}

                    {step === 2 && (
                      <motion.div
                        key="typing-indicator-1"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                        className="flex flex-col items-start self-start max-w-[85%] relative z-10"
                      >
                        <div className="relative bg-white text-slate-800 px-4 py-3 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-1.5">
                          <div className="absolute top-0 left-[-6px] w-[8px] h-[10px] text-white fill-current">
                            <svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 0C4 0 0 0 0 0V10C0 10 1 5.5 8 0Z" fill="currentColor" />
                            </svg>
                          </div>
                          <div className="flex gap-1 items-center justify-center h-3">
                            <motion.span variants={dotVariants} initial="initial" animate="animate" transition={{ delay: 0 }} className="w-2 h-2 bg-slate-400 rounded-full" />
                            <motion.span variants={dotVariants} initial="initial" animate="animate" transition={{ delay: 0.15 }} className="w-2 h-2 bg-slate-400 rounded-full" />
                            <motion.span variants={dotVariants} initial="initial" animate="animate" transition={{ delay: 0.3 }} className="w-2 h-2 bg-slate-400 rounded-full" />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {step === 5 && (
                      <motion.div
                        key="typing-indicator-2"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                        className="flex flex-col items-start self-start max-w-[85%] relative z-10"
                      >
                        <div className="relative bg-white text-slate-800 px-4 py-3 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-1.5">
                          <div className="absolute top-0 left-[-6px] w-[8px] h-[10px] text-white fill-current">
                            <svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 0C4 0 0 0 0 0V10C0 10 1 5.5 8 0Z" fill="currentColor" />
                            </svg>
                          </div>
                          <div className="flex gap-1 items-center justify-center h-3">
                            <motion.span variants={dotVariants} initial="initial" animate="animate" transition={{ delay: 0 }} className="w-2 h-2 bg-slate-400 rounded-full" />
                            <motion.span variants={dotVariants} initial="initial" animate="animate" transition={{ delay: 0.15 }} className="w-2 h-2 bg-slate-400 rounded-full" />
                            <motion.span variants={dotVariants} initial="initial" animate="animate" transition={{ delay: 0.3 }} className="w-2 h-2 bg-slate-400 rounded-full" />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {step === 8 && (
                      <motion.div
                        key="typing-indicator-3"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                        className="flex flex-col items-start self-start max-w-[85%] relative z-10"
                      >
                        <div className="relative bg-white text-slate-800 px-4 py-3 rounded-2xl rounded-tl-none shadow-xs flex items-center gap-1.5">
                          <div className="absolute top-0 left-[-6px] w-[8px] h-[10px] text-white fill-current">
                            <svg width="8" height="10" viewBox="0 0 8 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 0C4 0 0 0 0 0V10C0 10 1 5.5 8 0Z" fill="currentColor" />
                            </svg>
                          </div>
                          <div className="flex gap-1 items-center justify-center h-3">
                            <motion.span variants={dotVariants} initial="initial" animate="animate" transition={{ delay: 0 }} className="w-2 h-2 bg-slate-400 rounded-full" />
                            <motion.span variants={dotVariants} initial="initial" animate="animate" transition={{ delay: 0.15 }} className="w-2 h-2 bg-slate-400 rounded-full" />
                            <motion.span variants={dotVariants} initial="initial" animate="animate" transition={{ delay: 0.3 }} className="w-2 h-2 bg-slate-400 rounded-full" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Input Footer */}
                <div className="bg-[#f6f6f6] px-3 py-2.5 border-t border-slate-200/50 flex items-center gap-3 shrink-0 select-none">
                  <Plus className="w-5 h-5 text-[#007AFF] shrink-0" />
                  <div className="flex-1 bg-white border border-slate-200/80 rounded-full py-1 px-3.5 flex items-center justify-between shadow-xs">
                    <span className="text-[10px] text-slate-400">Message</span>
                    <Camera className="w-4 h-4 text-[#007AFF] shrink-0" />
                  </div>
                  <Mic className="w-4 h-4 text-[#007AFF] shrink-0" />
                </div>
              </div>

              {/* Elevated SaaS Lead Card */}
              <AnimatePresence>
                {step >= 10 && (
                  <motion.div
                    key="wow-lead-card"
                    initial={{ opacity: 0, x: 80, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 50, scale: 0.9 }}
                    className="absolute right-[-40px] top-[26%] w-[240px] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-slate-200 rounded-2xl p-4 z-30"
                  >
                    <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-1.5 text-indigo-650">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-slate-500">Lead Extracted</span>
                      </div>
                      <div className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
                        <Check className="w-2 h-2 stroke-[3]" />
                        <span className="text-[8px] font-extrabold uppercase">Confirmed</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-[10.5px]">
                      <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        <span className="text-[9px] text-slate-500">Customer</span>
                        <span className="font-semibold text-slate-800">Amit</span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        <span className="text-[9px] text-slate-500">Vehicle</span>
                        <span className="font-semibold text-slate-800">Tesla Model Y</span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        <span className="text-[9px] text-slate-500">Service</span>
                        <span className="font-semibold text-slate-800">Ceramic Coating</span>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                        <span className="text-[9px] text-slate-500">Urgency</span>
                        <div className="px-1.5 py-0.5 bg-red-50 text-red-600 border border-red-200 text-[8px] font-extrabold rounded-full flex items-center gap-0.5 shadow-sm">
                          <Flame className="w-3 h-3 text-red-500 fill-red-500" />
                          <span>HIGH</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>
        </div>

        {/* Left footer */}
        <div className="relative z-10 text-[10px] text-slate-400 select-none self-start hidden lg:block">
          <span>LeadFlow Cloud v1.0 — © 2026</span>
        </div>

      </div>

      {/* ─── RIGHT PANEL (Full-bleed Authentication Form) ─── */}
      <div className="flex-1 min-h-screen bg-white flex items-center justify-center p-8 lg:p-12 xl:p-16 relative">
        
        {/* Form Container (borderless, modern layout) */}
        <div className="w-full max-w-[360px] flex flex-col justify-center py-10 lg:py-0">
          
          {/* Header */}
          <div className="text-left mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-2 font-sans">
              Create your account
            </h1>
            <p className="text-sm text-slate-500 leading-relaxed font-sans">
              Set up your automated sales pipeline and start capturing leads today.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-5" noValidate>
            
            {/* Business Name Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="businessName"
                className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase select-none"
              >
                Business Name
              </label>
              <div className="relative">
                <div
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-150"
                  style={{ color: focusedField === "businessName" ? "#6366F1" : "#94A3B8" }}
                >
                  <Building2 className="w-[17px] h-[17px]" strokeWidth={1.8} />
                </div>
                <input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  onFocus={() => setFocusedField("businessName")}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Acme Corp"
                  disabled={loading}
                  className="w-full h-11 pl-10.5 pr-4 rounded-xl text-sm font-medium bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)] disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase select-none"
              >
                Email Address
              </label>
              <div className="relative">
                <div
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-150"
                  style={{ color: focusedField === "email" ? "#6366F1" : "#94A3B8" }}
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
                  className="w-full h-11 pl-10.5 pr-4 rounded-xl text-sm font-medium bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)] disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase select-none"
              >
                Password
              </label>
              <div className="relative">
                <div
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-150"
                  style={{ color: focusedField === "password" ? "#6366F1" : "#94A3B8" }}
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
                  placeholder="••••••••••••"
                  disabled={loading}
                  className="w-full h-11 pl-10.5 pr-11 rounded-xl text-sm font-medium bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 outline-none transition-all duration-200 focus:bg-white focus:border-indigo-500 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)] disabled:opacity-50"
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
                className="w-full h-11 rounded-xl text-white font-semibold text-sm cursor-pointer flex items-center justify-center gap-2 group disabled:opacity-75 disabled:pointer-events-none transition-all duration-350 transform active:scale-[0.98] select-none bg-gradient-to-r from-accent to-accent-secondary shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/35"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account…</span>
                  </>
                ) : (
                  <>
                    <span>Sign Up</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Toggle Link */}
          <div className="mt-6 text-center text-xs text-slate-500 select-none">
            Already have an account?{" "}
            <Link
              href="/login"
              className="cursor-pointer font-bold text-indigo-650 hover:text-indigo-555 transition-colors"
            >
              Sign in
            </Link>
          </div>

          {/* Mobile Footer */}
          <div className="mt-12 pt-6 border-t border-slate-150 flex items-center justify-between text-[10px] text-slate-400 lg:hidden select-none">
            <span>LeadFlow Cloud v1.0</span>
            <a href="/privacy" className="hover:text-slate-650 transition-colors cursor-pointer">Privacy & Terms</a>
          </div>

        </div>

      </div>

    </div>
  );
}
