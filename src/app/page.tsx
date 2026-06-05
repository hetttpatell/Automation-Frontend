"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import { 
  ArrowRight, 
  Check, 
  CheckCheck, 
  Sparkles, 
  Zap, 
  Shield, 
  Video, 
  Phone, 
  MoreVertical,
  RotateCcw,
  Flame,
  Layers,
  Database,
  Plus,
  Camera,
  Mic,
  ChevronLeft,
  User2,
  Brain,
  MessageSquare,
  RefreshCw,
  QrCode,
  Sliders,
  Activity,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from "lucide-react";

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

export default function Home() {
  const [step, setStep] = useState(0);
  const [hasReplayed, setHasReplayed] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Multi-step loop with precise intervals
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
        setHasReplayed(true);
      }
    }, timings[step] || 2000);

    return () => clearTimeout(t);
  }, [step]);

  // Auto-scroll chat container to the bottom as the conversation grows
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [step]);

  const handleManualReplay = () => {
    setStep(0);
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
    <div className="relative min-h-screen bg-[#FAFAFA] text-[#0F172A] overflow-hidden flex flex-col font-sans selection:bg-accent/20 selection:text-accent">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-accent-secondary/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Global Header */}
      <Navbar />

      {/* Main Hero Section */}
      <main className="relative z-10 flex-1 flex items-center max-w-7xl w-full mx-auto px-6 py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-16 lg:gap-12 items-center w-full">
          
          {/* Left Column (The Pitch) */}
          <div className="flex flex-col items-start gap-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-mono font-bold tracking-wider text-accent uppercase">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
              AI WHATSAPP AGENT
            </div>

            {/* Headline */}
            <h1 className="font-calistoga text-5xl sm:text-6xl lg:text-7xl text-slate-900 tracking-tight leading-[1.08] text-left">
              Turn WhatsApp into your best{" "}
              <span className="bg-gradient-to-r from-accent to-accent-secondary bg-clip-text text-transparent font-calistoga select-none">
                salesperson.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg text-slate-600 font-sans leading-relaxed max-w-xl text-left">
              Deploy intelligent AI agents that converse instantly with prospects, answer inquiries, schedule bookings, and extract highly structured leads into your CRM in real time.
            </p>

            {/* CTA Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <Link href="/register" className="group cursor-pointer inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-accent to-accent-secondary text-white font-semibold font-sans shadow-lg shadow-accent/20 hover:shadow-xl hover:shadow-accent/30 transition-all duration-300 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              
              <button 
                onClick={handleManualReplay}
                className="group cursor-pointer inline-flex items-center justify-center px-6 py-4 rounded-xl text-slate-500 hover:text-slate-900 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 active:scale-95 shadow-sm"
              >
                <RotateCcw className="w-4 h-4 mr-2 text-slate-400 group-hover:text-slate-600 transition-colors" />
                Replay Animation
              </button>
            </div>

            {/* Key Value Props / Social Proof */}
            <div className="w-full pt-6 border-t border-slate-200/60 grid grid-cols-3 gap-6">
              <div className="flex flex-col items-start gap-2">
                <div className="p-2 rounded-lg bg-accent/5 text-accent">
                  <Zap className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-800">Instant Setup</span>
                <span className="text-xs text-slate-500">Go live in minutes.</span>
              </div>
              <div className="flex flex-col items-start gap-2">
                <div className="p-2 rounded-lg bg-accent/5 text-accent">
                  <Layers className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-800">99% Extraction</span>
                <span className="text-xs text-slate-500">Highly accurate AI data.</span>
              </div>
              <div className="flex flex-col items-start gap-2">
                <div className="p-2 rounded-lg bg-accent/5 text-accent">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-800">Secure Vault</span>
                <span className="text-xs text-slate-500">GDPR & SOC-2 ready.</span>
              </div>
            </div>
          </div>

          {/* Right Column (Interactive Demo with Slim iPhone Frame) */}
          <div className="flex items-center justify-center relative w-full lg:h-[680px]">
            {/* Ambient decorative glowing backdrops */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-gradient-to-tr from-accent/15 to-accent-secondary/15 rounded-full blur-[80px] -z-10 pointer-events-none" />

            {/* iPhone 15 Pro Container */}
            <div className="relative w-[320px] h-[620px] border-[6px] border-slate-950 rounded-[2.8rem] bg-slate-950 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] overflow-visible ring-1 ring-slate-900/10">
              
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
                    <Video className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
                    <Phone className="w-3.5 h-3.5 hover:text-white transition-colors cursor-pointer" />
                    <MoreVertical className="w-4 h-4 hover:text-white transition-colors cursor-pointer" />
                  </div>
                </div>

                {/* WhatsApp Chat Canvas */}
                <div 
                  ref={chatContainerRef}
                  className="flex-1 px-3.5 py-4 flex flex-col gap-3.5 bg-[#e5ddd5] overflow-y-auto relative scrollbar-none"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  <style dangerouslySetInnerHTML={{__html: `div::-webkit-scrollbar { display: none; }`}} />

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
                  <Plus className="w-6 h-6 text-[#007AFF] hover:text-[#0051a8] transition-colors cursor-pointer shrink-0" />
                  
                  <div className="flex-1 bg-white border border-slate-200/80 rounded-full py-1.5 px-4.5 flex items-center justify-between shadow-xs">
                    <span className="text-xs text-slate-400">Message</span>
                    <Camera className="w-5 h-5 text-[#007AFF] hover:text-[#0051a8] transition-colors cursor-pointer shrink-0" />
                  </div>
                  
                  <Mic className="w-5 h-5 text-[#007AFF] hover:text-[#0051a8] transition-colors cursor-pointer shrink-0" />
                </div>

                <div className="w-full bg-[#f6f6f6] pb-1.5 flex items-center justify-center shrink-0">
                  <div className="w-32 h-1 bg-slate-900/60 rounded-full" />
                </div>

              </div>

              {/* Elevated SaaS Lead Card */}
              <AnimatePresence>
                {step >= 10 && (
                  <motion.div
                    key="wow-lead-card"
                    initial={{ opacity: 0, x: 100, scale: 0.9, y: 0 }}
                    animate={{ opacity: 1, x: 0, scale: 1, y: 0 }}
                    exit={{ opacity: 0, x: 60, scale: 0.9, transition: { duration: 0.25 } }}
                    transition={{ type: "spring", stiffness: 120, damping: 14 }}
                    className="absolute right-[-65px] top-[26%] w-[275px] bg-white/95 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200/80 rounded-2xl p-4.5 z-30"
                  >
                    <div className="flex items-center justify-between mb-3.5 pb-2 border-b border-slate-100">
                      <div className="flex items-center gap-1.5 text-accent">
                        <Sparkles className="w-4 h-4 text-[#0052FF]" />
                        <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-500">Lead Extracted</span>
                      </div>
                      <div className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                        <span className="text-[8.5px] font-extrabold uppercase">Confirmed</span>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between bg-slate-50/80 px-2.5 py-1.5 rounded-xl border border-slate-100/80">
                        <span className="text-[10px] font-medium text-slate-500">Customer</span>
                        <span className="text-xs font-semibold text-slate-800">Amit</span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50/80 px-2.5 py-1.5 rounded-xl border border-slate-100/80">
                        <span className="text-[10px] font-medium text-slate-500">Phone</span>
                        <span className="text-xs font-mono font-semibold text-slate-800">+1 555-0199</span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50/80 px-2.5 py-1.5 rounded-xl border border-slate-100/80">
                        <span className="text-[10px] font-medium text-slate-500">Vehicle</span>
                        <span className="text-xs font-semibold text-slate-800">Tesla Model Y</span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50/80 px-2.5 py-1.5 rounded-xl border border-slate-100/80">
                        <span className="text-[10px] font-medium text-slate-500">Service</span>
                        <span className="text-xs font-semibold text-slate-800">Ceramic Coating</span>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50/80 px-2.5 py-1.5 rounded-xl border border-slate-100/80">
                        <span className="text-[10px] font-medium text-slate-500">Urgency</span>
                        <div className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 text-[10px] font-extrabold rounded-full flex items-center gap-1 shadow-sm">
                          <Flame className="w-3.5 h-3.5 fill-red-500 text-red-500 animate-pulse" />
                          <span>HIGH</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-between text-[9px] text-slate-400 font-mono font-medium border-t border-slate-100">
                        <div className="flex items-center gap-1">
                          <Database className="w-3.5 h-3.5 text-slate-400" />
                          <span>confidence: 99.4%</span>
                        </div>
                        <span>v2.4_extract</span>
                      </div>
                    </div>

                    <div className="absolute bottom-0 inset-x-0 h-1 rounded-b-2xl bg-gradient-to-r from-accent to-accent-secondary" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-10 w-full max-w-7xl mx-auto px-6 py-28 border-t border-slate-200/50">
        <div className="flex flex-col items-start max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-mono font-bold tracking-wider text-accent uppercase mb-4">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            CORE CAPABILITIES
          </div>
          <h2 className="font-calistoga text-4xl md:text-5xl text-slate-900 tracking-tight leading-tight mb-4">
            Everything you need to automate your inbound pipeline.
          </h2>
          <p className="text-lg text-slate-600 font-sans leading-relaxed">
            Stop letting hot leads turn cold. LeadFlow works 24/7 to nurture, qualify, and convert every incoming WhatsApp conversation automatically.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="lg:col-span-6 group relative bg-white border border-slate-100/80 rounded-3xl p-8 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer min-h-[480px]"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center text-white mb-6 shadow-md shadow-accent/15 group-hover:scale-110 transition-transform duration-300">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="font-calistoga text-2xl text-slate-900 mb-3 group-hover:text-accent transition-colors duration-300">
                Zero-Touch Extraction
              </h3>
              <p className="text-slate-600 font-sans leading-relaxed text-sm mb-8">
                Automatically detects booking intent and extracts structured Lead JSON (Service & Urgency) straight to your database.
              </p>
            </div>

            <div className="relative mt-auto w-full bg-slate-950 rounded-2xl p-4.5 font-mono text-[11px] overflow-hidden border border-slate-900/60 shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-3">
                <span className="text-[10px] text-slate-500">extraction_pipeline_v2</span>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              
              <div className="space-y-3.5">
                <div>
                  <span className="text-slate-500 block mb-1.5">// WhatsApp Raw Payload</span>
                  <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-300 italic max-w-[90%] relative">
                    "I need a ceramic coating for my Tesla Y today, it's an emergency!"
                    <div className="absolute top-0 right-2 -translate-y-1/2 bg-accent/95 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-sm font-semibold tracking-wider">RAW</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 pl-4 text-accent text-xs">
                  <ArrowRight className="w-4 h-4 animate-pulse" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Extracting JSON Schema...</span>
                </div>

                <div className="bg-slate-900 border border-slate-800/80 rounded-lg p-3 text-slate-300 relative">
                  <div className="absolute top-0 right-2 -translate-y-1/2 bg-emerald-500 text-white font-mono text-[9px] px-1.5 py-0.5 rounded-sm font-semibold tracking-wider">EXTRACTED</div>
                  <div className="space-y-1 text-slate-300">
                    <div><span className="text-slate-500">{"{"}</span></div>
                    <div className="pl-4">
                      <span className="text-pink-400">"name"</span>: <span className="text-emerald-400">"Amit"</span>,
                    </div>
                    <div className="pl-4">
                      <span className="text-pink-400">"vehicle"</span>: <span className="text-emerald-400">"Tesla Model Y"</span>,
                    </div>
                    <div className="pl-4">
                      <span className="text-pink-400">"service"</span>: <span className="text-emerald-400">"Ceramic Coating"</span>,
                    </div>
                    <div className="pl-4">
                      <span className="text-pink-400">"urgency"</span>: <span className="text-red-400">"HIGH"</span>
                    </div>
                    <div><span className="text-slate-500">{"}"}</span></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="absolute inset-0 border border-accent/0 rounded-3xl group-hover:border-accent/10 pointer-events-none transition-colors duration-300" />
          </motion.div>

          {/* Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
            className="lg:col-span-6 group relative bg-white border border-slate-100/80 rounded-3xl p-8 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer min-h-[480px]"
          >
            <div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center text-white mb-6 shadow-md shadow-accent/15 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="font-calistoga text-2xl text-slate-900 mb-3 group-hover:text-accent transition-colors duration-300">
                Contextual Memory
              </h3>
              <p className="text-slate-600 font-sans leading-relaxed text-sm mb-8">
                Remembers the last 4 messages of conversation history, ensuring natural, human-like dialogue without frustrating repetition.
              </p>
            </div>

            <div className="relative mt-auto w-full bg-slate-50 border border-slate-100/80 rounded-2xl p-4.5 overflow-hidden flex flex-col gap-3 shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-200/50 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">Context buffer</span>
                </div>
                <span className="text-[9px] font-mono bg-accent/10 text-accent font-semibold px-2 py-0.5 rounded-full">4 / 4 Active</span>
              </div>

              <div className="space-y-2.5 relative">
                <div className="absolute left-[13px] top-4 bottom-4 w-[1px] bg-slate-200" />
                
                {[
                  { sender: "customer", text: "Can I book today?", label: "t-3" },
                  { sender: "agent", text: "Yes! Slot available at 4 PM.", label: "t-2" },
                  { sender: "customer", text: "Yes please, book it!", label: "t-1" },
                  { sender: "agent", text: "Confirmed! Team is on the way.", label: "t-0" }
                ].map((msg, index) => {
                  const isCust = msg.sender === "customer";
                  return (
                    <div key={index} className="flex gap-3 items-start relative">
                      <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center font-mono text-[9px] font-bold border z-10 ${
                        isCust ? "bg-slate-100 border-slate-200 text-slate-500" : "bg-accent/10 border-accent/20 text-accent"
                      }`}>
                        {msg.label}
                      </div>
                      
                      <div className={`text-[10.5px] px-3 py-1.5 rounded-xl font-sans max-w-[80%] ${
                        isCust ? "bg-slate-200/60 text-slate-800" : "bg-white border border-slate-100 text-slate-800 shadow-sm"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="absolute inset-0 border border-accent/0 rounded-3xl group-hover:border-accent/10 pointer-events-none transition-colors duration-300" />
          </motion.div>

          {/* Card 3 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.35, ease: "easeOut" }}
            className="lg:col-span-12 group relative bg-white border border-slate-100/80 rounded-3xl p-8 lg:p-10 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col lg:flex-row gap-8 lg:gap-12 justify-between items-stretch overflow-hidden cursor-pointer"
          >
            <div className="flex flex-col justify-center flex-1 max-w-xl">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent to-accent-secondary flex items-center justify-center text-white mb-6 shadow-md shadow-accent/15 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-calistoga text-2xl lg:text-3xl text-slate-900 mb-3 group-hover:text-accent transition-colors duration-300">
                Anti-Loop Architecture
              </h3>
              <p className="text-slate-600 font-sans leading-relaxed text-sm">
                Built-in webhook idempotency and caching ensures you never double-reply to Meta's aggressive retry algorithms. Keep system processes clean and cost-efficient.
              </p>
            </div>

            <div className="flex-1 w-full lg:max-w-md bg-slate-950 rounded-2xl p-6 font-mono text-[11px] border border-slate-900/60 shadow-inner flex flex-col justify-between min-h-[220px]">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-3">
                <span className="text-[10px] text-slate-500">webhook_guard_flow.go</span>
                <span className="text-[9px] text-slate-600">v1.1_guard</span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1.5 w-[42%]">
                    <span className="text-slate-500">// Meta Webhook retries</span>
                    <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-400 relative">
                      Retry #1 (ID: 9912)
                      <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full absolute -top-1 -right-1 animate-ping" />
                    </div>
                    <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-400 relative">
                      Retry #2 (ID: 9912)
                      <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full absolute -top-1 -right-1 animate-ping" />
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-1 text-slate-500 font-mono text-[9px] uppercase font-bold">
                    <span>Process</span>
                    <ArrowRight className="w-4 h-4 text-accent animate-pulse" />
                  </div>

                  <div className="w-[42%] bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col gap-2 items-center justify-center text-center relative overflow-hidden">
                    <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent mb-1 animate-pulse">
                      <Shield className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-white text-[10px]">LeadFlow Guard</span>
                    <div className="text-[9px] text-emerald-400 font-extrabold uppercase bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/40">
                      200 OK CACHED
                    </div>
                    <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-accent to-accent-secondary" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-900 text-[10px] text-slate-500 font-mono mt-3 shrink-0">
                <span>Prevented duplicate outbound messages</span>
              </div>
            </div>

            <div className="absolute inset-0 border border-accent/0 rounded-3xl group-hover:border-accent/10 pointer-events-none transition-colors duration-300" />
          </motion.div>

        </div>
      </section>

      {/* How It Works Section */}
      <section id="solutions" className="relative bg-[#0b0f19] py-32 overflow-hidden w-full">
        <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none" />
        
        <div className="absolute -top-40 -left-40 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] bg-accent-secondary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
          <div className="flex flex-col items-start max-w-3xl mb-24">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-mono font-bold tracking-wider text-accent uppercase mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
              IMPLEMENTATION ROADMAP
            </div>
            <h2 className="font-calistoga text-4xl md:text-5xl text-white tracking-tight leading-tight mb-4">
              Deploying LeadFlow in three simple steps.
            </h2>
            <p className="text-lg text-slate-400 font-sans leading-relaxed">
              No complex development cycles. Integrate your custom WhatsApp flows with your CRM instantly.
            </p>
          </div>

          <div className="space-y-24">
            {/* Step 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col items-start"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-accent font-mono text-lg font-bold">
                    01
                  </div>
                  <span className="text-sm font-mono font-bold uppercase tracking-wider text-accent">Phase One</span>
                </div>
                <h3 className="font-calistoga text-3xl md:text-4xl text-white mb-4 leading-tight">
                  Connect Your Number
                </h3>
                <p className="text-slate-400 font-sans leading-relaxed mb-6">
                  Simply scan the secure QR code using your Meta Developer dashboard or WhatsApp Business app. We coordinate the underlying Webhooks and API handshakes automatically.
                </p>
                <div className="flex flex-col gap-3 text-sm text-slate-300 font-sans">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Official Meta API connection</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-accent" />
                    <span>End-to-end security encryption</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl flex flex-col items-center justify-center min-h-[300px]"
              >
                <div className="absolute top-4 left-4 flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                  <QrCode className="w-4 h-4" />
                  <span>whatsapp_auth_flow.sh</span>
                </div>
                
                <div className="relative w-44 h-44 bg-white rounded-2xl p-3 shadow-inner flex items-center justify-center overflow-hidden mb-4 group cursor-pointer">
                  <div className="absolute inset-2 bg-[radial-gradient(#0f172a_3px,transparent_3px)] [background-size:8px_8px] opacity-80" />
                  <div className="absolute top-2 left-2 w-8 h-8 border-4 border-slate-900 rounded-sm bg-white" />
                  <div className="absolute top-2 right-2 w-8 h-8 border-4 border-slate-900 rounded-sm bg-white" />
                  <div className="absolute bottom-2 left-2 w-8 h-8 border-4 border-slate-900 rounded-sm bg-white" />
                  <div className="absolute bottom-6 right-6 w-4 h-4 border-2 border-slate-900 rounded-sm bg-white" />
                  
                  <div className="absolute w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md">
                    <div className="w-8 h-8 bg-whatsapp rounded-full flex items-center justify-center text-white text-[11px] font-bold">
                      WA
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-xs font-mono text-slate-400">Waiting for scan authentication...</span>
                </div>
              </motion.div>
            </div>

            {/* Step 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="lg:order-2 flex flex-col items-start"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-accent font-mono text-lg font-bold">
                    02
                  </div>
                  <span className="text-sm font-mono font-bold uppercase tracking-wider text-accent">Phase Two</span>
                </div>
                <h3 className="font-calistoga text-3xl md:text-4xl text-white mb-4 leading-tight">
                  Set Your Instructions
                </h3>
                <p className="text-slate-400 font-sans leading-relaxed mb-6">
                  Input custom business logic, frequently asked questions, and preferred conversational guidelines. Your AI agent learns how to sell and speak in your unique brand voice in seconds.
                </p>
                <div className="flex flex-col gap-3 text-sm text-slate-300 font-sans">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Dynamic FAQs updates</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Define specific qualification rules</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="lg:order-1 relative bg-slate-900/60 border border-slate-800 rounded-3xl p-6.5 backdrop-blur-md shadow-2xl flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-500/80" />
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80" />
                    <div className="w-3.5 h-3.5 rounded-full bg-green-500/80" />
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">system_instructions.txt</span>
                </div>

                <div className="font-mono text-xs text-slate-300 space-y-3 leading-relaxed">
                  <div className="text-slate-500">// Configure agent response properties</div>
                  <div>
                    <span className="text-accent-secondary">ROLE</span> = <span className="text-emerald-400">"Expert Sales Concierge"</span>
                  </div>
                  <div>
                    <span className="text-accent-secondary">TONE</span> = <span className="text-emerald-400">"Professional, warm, helpful"</span>
                  </div>
                  <div className="text-slate-500 pt-2">// Conversational Guardrails</div>
                  <div>
                    <span className="text-purple-400">RULE_1:</span> Qualify vehicle model & location early.
                  </div>
                  <div>
                    <span className="text-purple-400">RULE_2:</span> Offer available 4:00 PM booking slots.
                  </div>
                  <div>
                    <span className="text-purple-400">RULE_3:</span> Automatically capture and extract leads.
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Step 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col items-start"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-accent font-mono text-lg font-bold">
                    03
                  </div>
                  <span className="text-sm font-mono font-bold uppercase tracking-wider text-accent">Phase Three</span>
                </div>
                <h3 className="font-calistoga text-3xl md:text-4xl text-white mb-4 leading-tight">
                  Watch Leads Roll In
                </h3>
                <p className="text-slate-400 font-sans leading-relaxed mb-6">
                  The AI instantly assumes responsibility for incoming customer requests. Qualified prospects, custom service requests, and confirmed bookings flow directly to your dashboard.
                </p>
                <div className="flex flex-col gap-3 text-sm text-slate-300 font-sans">
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Real-time lead webhook streams</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-accent" />
                    <span>Zero-latency database synchronization</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative bg-slate-900/60 border border-slate-800 rounded-3xl p-6 backdrop-blur-md shadow-2xl flex flex-col h-[280px] justify-between overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-accent animate-pulse" />
                    <span className="text-xs font-semibold text-white">Live Activity Stream</span>
                  </div>
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                </div>

                <div className="flex-1 overflow-hidden relative space-y-3.5 py-2 font-mono text-[11px] text-slate-300">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-between bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400">✔</span>
                      <span>Lead captured: <strong>Amit</strong></span>
                    </div>
                    <span className="text-slate-500">Tesla Model Y</span>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center justify-between bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400">✔</span>
                      <span>Lead captured: <strong>Sarah</strong></span>
                    </div>
                    <span className="text-slate-500">Porsche 911</span>
                  </motion.div>

                  <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-500 font-mono shrink-0">
                  <span>Inbound Active</span>
                  <span>Sync: 100% Ok</span>
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 w-full max-w-7xl mx-auto px-6 py-28 border-t border-slate-200/50">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-xs font-mono font-bold tracking-wider text-accent uppercase mb-4 select-none">
            <Sparkles className="w-3.5 h-3.5" />
            PLANS & PRICING
          </div>
          <h2 className="font-calistoga text-4xl md:text-5xl text-slate-900 tracking-tight leading-tight mb-4">
            Simple, Transparent Pricing for Indian Businesses.
          </h2>
          <p className="text-lg text-slate-600 font-sans leading-relaxed">
            Choose a plan that fits your business stage. No hidden fees or onboarding costs.
          </p>
        </div>

        {/* 3-Column Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch mb-24">
          
          {/* Starter Tier */}
          <div className="flex flex-col bg-white border border-slate-200/80 rounded-3xl p-8 justify-between hover:shadow-xl transition-all duration-300 relative shadow-md group cursor-pointer hover:border-slate-300">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">Starter</span>
                <h3 className="font-calistoga text-2xl text-slate-900">Perfect for Solo Professionals</h3>
                <p className="text-sm text-slate-500 font-sans leading-relaxed">
                  Start automating your customer queries and booking notifications on WhatsApp.
                </p>
              </div>
              <div className="flex items-baseline gap-1 select-none py-2 border-y border-slate-100">
                <span className="text-4xl font-extrabold text-slate-900 font-sans">₹1,499</span>
                <span className="text-sm text-slate-400 font-medium font-sans">/ month</span>
              </div>
              <ul className="space-y-4 text-sm text-slate-600 font-sans">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-accent stroke-[3]" />
                  </div>
                  <span><strong>500 AI Credits</strong> / month</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-accent stroke-[3]" />
                  </div>
                  <span><strong>250 CRM Leads</strong></span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-accent stroke-[3]" />
                  </div>
                  <span>Unified Chat Inbox</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-accent stroke-[3]" />
                  </div>
                  <span><strong>1 Staff Seat</strong></span>
                </li>
              </ul>
            </div>
            <div className="mt-8">
              <Link 
                href="/register" 
                className="w-full py-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-sm font-semibold text-slate-900 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer shadow-xs"
              >
                Get Started
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Growth Tier [MOST POPULAR] */}
          <div className="flex flex-col bg-white border-2 border-indigo-500 rounded-3xl p-8 justify-between hover:shadow-2xl transition-all duration-300 scale-100 md:scale-105 shadow-xl relative z-10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-accent to-accent-secondary text-white text-[10px] font-extrabold uppercase tracking-widest shadow-md flex items-center gap-1 select-none">
              <Flame className="w-3.5 h-3.5 animate-pulse" />
              Most Popular Choice
            </div>
            <div className="space-y-6">
              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-accent uppercase font-mono tracking-wider">Growth</span>
                <h3 className="font-calistoga text-2xl text-slate-900">Highly Recommended for Scaling</h3>
                <p className="text-sm text-slate-500 font-sans leading-relaxed">
                  Unlock automatic campaigns and unlimited lead extractions to scale your customer outreach.
                </p>
              </div>
              <div className="flex items-baseline gap-1 select-none py-2 border-y border-slate-100">
                <span className="text-5xl font-black text-slate-900 font-sans">₹2,999</span>
                <span className="text-sm text-slate-400 font-medium font-sans">/ month</span>
              </div>
              <ul className="space-y-4 text-sm text-slate-600 font-sans">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-accent stroke-[3]" />
                  </div>
                  <span><strong>2,500 AI Credits</strong> / month</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-accent stroke-[3]" />
                  </div>
                  <span><strong>Unlimited CRM Leads</strong></span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-accent stroke-[3]" />
                  </div>
                  <span><strong>Outbound Campaigns Engine</strong></span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-accent stroke-[3]" />
                  </div>
                  <span><strong>3 Staff Seats</strong></span>
                </li>
              </ul>
            </div>
            <div className="mt-8">
              <Link 
                href="/register" 
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-accent to-accent-secondary hover:from-indigo-600 hover:to-indigo-700 text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 active:scale-[0.98] transition-all cursor-pointer"
              >
                Start 14-Day Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Domination Tier [DARK MODE] */}
          <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-3xl p-8 justify-between hover:shadow-2xl transition-all duration-300 relative shadow-xl text-slate-100 group cursor-pointer hover:border-slate-700">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">Domination</span>
                <h3 className="font-calistoga text-2xl text-white">Total Business Autopilot</h3>
                <p className="text-sm text-slate-400 font-sans leading-relaxed">
                  The ultimate suite for enterprise-level automation and custom AI brain configurations.
                </p>
              </div>
              <div className="flex items-baseline gap-1 select-none py-2 border-y border-slate-800">
                <span className="text-4xl font-extrabold text-white font-sans">₹4,999</span>
                <span className="text-sm text-slate-500 font-medium font-sans">/ month</span>
              </div>
              <ul className="space-y-4 text-sm text-slate-300 font-sans">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-accent stroke-[3]" />
                  </div>
                  <span><strong>10,000 AI Credits</strong> / month</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-accent stroke-[3]" />
                  </div>
                  <span><strong>Auto-Review Reputation Engine</strong></span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-accent stroke-[3]" />
                  </div>
                  <span>Zero-Touch Calendar Booking</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-accent stroke-[3]" />
                  </div>
                  <span><strong>Unlimited Seats</strong></span>
                </li>
              </ul>
            </div>
            <div className="mt-8">
              <Link 
                href="/register" 
                className="w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer border border-slate-800 hover:border-slate-700"
              >
                Get Started
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </Link>
            </div>
          </div>

        </div>

        {/* FAQ Accordion Section */}
        <div className="max-w-3xl mx-auto pt-16 border-t border-slate-200/50">
          <div className="text-center space-y-3 mb-12 select-none">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-semibold text-accent uppercase font-mono tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" />
              Got Questions?
            </div>
            <h3 className="font-calistoga text-3xl text-slate-900">
              Frequently Asked Questions
            </h3>
            <p className="text-sm text-slate-500 font-sans font-medium">
              Have questions about credits, billing, or WhatsApp integration? We've got answers.
            </p>
          </div>

          <div className="space-y-4">
            
            {/* FAQ 1 */}
            <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden transition-all duration-200 shadow-xs hover:border-slate-300">
              <button
                onClick={() => setActiveFaq(activeFaq === 0 ? null : 0)}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-sans font-bold text-slate-800 hover:text-slate-900 focus:outline-none cursor-pointer"
              >
                <span>What is an AI Credit?</span>
                <span className="p-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-500">
                  {activeFaq === 0 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {activeFaq === 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 pt-1 text-slate-600 text-sm font-sans leading-relaxed border-t border-slate-50">
                      An AI Credit covers one message exchange (incoming customer query processed + AI response generated and sent via WhatsApp). Simple conversations typically take 3-5 credits. You can monitor your credit usage in real time from your dashboard.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* FAQ 2 */}
            <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden transition-all duration-200 shadow-xs hover:border-slate-300">
              <button
                onClick={() => setActiveFaq(activeFaq === 1 ? null : 1)}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-sans font-bold text-slate-800 hover:text-slate-900 focus:outline-none cursor-pointer"
              >
                <span>Can I upgrade later?</span>
                <span className="p-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-500">
                  {activeFaq === 1 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {activeFaq === 1 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 pt-1 text-slate-600 text-sm font-sans leading-relaxed border-t border-slate-50">
                      Yes! You can upgrade, downgrade, or cancel your subscription plan at any time directly from your billing settings. Upgrades happen instantly, while downgrades take effect at the end of your billing cycle.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* FAQ 3 */}
            <div className="border border-slate-200/80 rounded-2xl bg-white overflow-hidden transition-all duration-200 shadow-xs hover:border-slate-300">
              <button
                onClick={() => setActiveFaq(activeFaq === 2 ? null : 2)}
                className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-sans font-bold text-slate-800 hover:text-slate-900 focus:outline-none cursor-pointer"
              >
                <span>Do you support UPI?</span>
                <span className="p-1 rounded-lg bg-slate-50 border border-slate-100 text-slate-500">
                  {activeFaq === 2 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {activeFaq === 2 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 pt-1 text-slate-600 text-sm font-sans leading-relaxed border-t border-slate-50">
                      Absolutely. We support all local Indian payment methods, including UPI (Google Pay, PhonePe, Paytm, BHIM), NetBanking, and credit/debit cards processed securely via Razorpay.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

      </section>

      {/* Global Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 border-t border-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 mt-auto">
        <span>&copy; {new Date().getFullYear()} LeadFlow. All rights reserved.</span>
        <div className="flex items-center gap-6">
          <a href="#terms" className="hover:text-slate-600 transition-colors">Terms of Service</a>
          <a href="#privacy" className="hover:text-slate-600 transition-colors">Privacy Policy</a>
          <a href="#security" className="hover:text-slate-600 transition-colors">Security</a>
        </div>
      </footer>
    </div>
  );
}
