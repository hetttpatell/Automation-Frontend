"use client";

import React, { useState, useEffect } from "react";
import { Check, Loader2, Sparkles, CreditCard, Flame, Zap, Shield, HelpCircle } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { useTheme } from "@/components/ui/ThemeProvider";
import { motion } from "framer-motion";

export const dynamic = "force-dynamic";

// Load Razorpay Script dynamically helper
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PricingPage() {
  const supabase = createClient();
  const { theme } = useTheme();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [currentTier, setCurrentTier] = useState<string>("free");
  const [creditsBalance, setCreditsBalance] = useState<number>(50);
  const [userEmail, setUserEmail] = useState<string>("");

  // Fetch current user and subscription context
  useEffect(() => {
    async function loadUserContext() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        setUserEmail(user.email);
        const { data: tenant } = await supabase
          .from("tenants")
          .select("subscription_tier, ai_credits_balance")
          .eq("owner_email", user.email)
          .single();

        if (tenant) {
          setCurrentTier(tenant.subscription_tier || "free");
          setCreditsBalance(tenant.ai_credits_balance ?? 50);
        }
      }
    }
    loadUserContext();
  }, [supabase]);

  // Handle Subscription Purchase (Razorpay Checkout)
  const handleSubscribe = async (tier: string) => {
    setLoadingStates((prev) => ({ ...prev, [tier]: true }));

    try {
      // 1. Create subscription on the backend
      const res = await fetch("/api/razorpay/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: tier }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create subscription order.");
      }

      // 2. Load client Razorpay Checkout SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check network connection.");
      }

      // 3. Configure Checkout Options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_dummy",
        subscription_id: data.id,
        name: "LeadFlow SaaS",
        description: `Upgrade to ${tier.toUpperCase()} Plan`,
        image: "/Logo-2.png",
        handler: async function (response: any) {
          toastSuccess(`Payment Successful! Signature: ${response.razorpay_signature.slice(0, 10)}...`);
          toastInfo("Your plan will be updated in a few seconds as the webhook processes.");
          
          // Refresh context
          setTimeout(async () => {
            const { data: tenant } = await supabase
              .from("tenants")
              .select("subscription_tier, ai_credits_balance")
              .eq("owner_email", userEmail)
              .single();
            if (tenant) {
              setCurrentTier(tenant.subscription_tier || "free");
              setCreditsBalance(tenant.ai_credits_balance ?? 50);
            }
          }, 3000);
        },
        prefill: {
          name: userEmail.split("@")[0],
          email: userEmail,
        },
        theme: {
          color: theme === "dark" ? "#6366F1" : "#4F46E5", // Brand primary theme color
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error(err);
      toastError(err.message || "Failed to initialize checkout.");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [tier]: false }));
    }
  };

  // Handle Credit Top-up Purchase (Razorpay Checkout)
  const handleTopUp = async (packId: string) => {
    setLoadingStates((prev) => ({ ...prev, [packId]: true }));

    try {
      // 1. Create order on the backend
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create top-up order.");
      }

      // 2. Load client Razorpay Checkout SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check network connection.");
      }

      // 3. Configure Checkout Options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_dummy",
        amount: data.amount,
        currency: "INR",
        name: "LeadFlow SaaS",
        description: `Purchase credits Top-Up: +${data.credits} Credits`,
        image: "/Logo-2.png",
        order_id: data.orderId,
        handler: async function (response: any) {
          toastSuccess(`Payment Captured! ID: ${response.razorpay_payment_id}`);
          toastInfo("Your credits will be updated shortly.");
          
          // Refresh context
          setTimeout(async () => {
            const { data: tenant } = await supabase
              .from("tenants")
              .select("subscription_tier, ai_credits_balance")
              .eq("owner_email", userEmail)
              .single();
            if (tenant) {
              setCreditsBalance(tenant.ai_credits_balance ?? 50);
            }
          }, 3000);
        },
        prefill: {
          name: userEmail.split("@")[0],
          email: userEmail,
        },
        theme: {
          color: theme === "dark" ? "#6366F1" : "#4F46E5", // Brand primary theme color
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error(err);
      toastError(err.message || "Failed to initialize checkout.");
    } finally {
      setLoadingStates((prev) => ({ ...prev, [packId]: false }));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="h-full overflow-y-auto bg-[var(--bg-canvas)] scrollbar-thin"
    >
      <div className="px-6 py-10 space-y-12 max-w-[1200px] mx-auto">
        
        {/* Header Section */}
        <div className="text-center flex flex-col items-center space-y-4 select-none">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--brand-subtle)] border border-[var(--brand-border)] text-xs font-mono font-bold tracking-wider text-[var(--brand-primary)] uppercase select-none">
            <Sparkles className="w-3.5 h-3.5" />
            Pricing & Upgrades
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight text-[var(--text-primary)]">
            Simple, Transparent Billing
          </h2>
          <p className="text-sm text-[var(--text-secondary)] font-medium max-w-xl mx-auto">
            Choose the right plan to scale your WhatsApp marketing and automatic customer scheduling.
          </p>

          {/* Current Tier & Balance Card */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-6 bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-5 py-3 rounded-[var(--radius-xl)] shadow-sm text-xs text-[var(--text-secondary)] mt-2">
            <div className="flex items-center gap-2">
              <span>Active Plan:</span>
              <span className="font-bold text-[var(--brand-primary)] bg-[var(--brand-subtle)] px-2.5 py-1 rounded-[var(--radius-md)] border border-[var(--brand-border)] capitalize">
                {currentTier}
              </span>
            </div>
            <div className="hidden sm:block w-[1px] h-4 bg-[var(--border-subtle)]" />
            <div className="flex items-center gap-2">
              <span>AI Credits Balance:</span>
              <span className="font-mono font-bold text-[var(--text-primary)] bg-[var(--bg-subtle)] px-2.5 py-1 rounded-[var(--radius-md)] border border-[var(--border-subtle)] flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                {creditsBalance} Credits
              </span>
            </div>
          </div>
        </div>

        {/* 3-Column Plan Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-2">
          
          {/* Card: Starter */}
          <motion.div 
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex flex-col bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-7 justify-between relative shadow-sm hover:shadow-md transition-all group"
          >
            {currentTier === "starter" && (
              <span className="absolute top-4 right-4 px-2.5 py-1 rounded bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--success-border)] text-[10px] font-bold uppercase tracking-wider select-none font-mono">
                Active Plan
              </span>
            )}
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase font-mono tracking-wider">Starter Plan</span>
                <h3 className="text-xl font-display font-bold text-[var(--text-primary)] leading-tight">Perfect for Solo Professionals</h3>
                <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                  Start automating your customer queries and booking notifications on WhatsApp.
                </p>
              </div>

              <div className="flex items-baseline gap-1 select-none border-y border-[var(--border-subtle)] py-3">
                <span className="text-3xl font-extrabold text-[var(--text-primary)]">₹1,499</span>
                <span className="text-xs text-[var(--text-tertiary)] font-medium">/ month</span>
              </div>

              <ul className="space-y-3.5 text-xs text-[var(--text-secondary)] font-sans">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[var(--brand-subtle)] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-[var(--brand-primary)] stroke-[3]" />
                  </div>
                  <span><strong>500 AI Credits</strong> / month</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[var(--brand-subtle)] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-[var(--brand-primary)] stroke-[3]" />
                  </div>
                  <span><strong>250 CRM Leads</strong></span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[var(--brand-subtle)] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-[var(--brand-primary)] stroke-[3]" />
                  </div>
                  <span>Unified Chat Inbox</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[var(--brand-subtle)] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-[var(--brand-primary)] stroke-[3]" />
                  </div>
                  <span><strong>1 Staff Seat</strong></span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe("starter")}
              disabled={loadingStates["starter"] || currentTier === "starter"}
              className={`mt-8 w-full h-11 rounded-[var(--radius-lg)] border text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed select-none ${
                currentTier === "starter"
                  ? "bg-[var(--color-success-bg)] text-[var(--color-success-text)] border-[var(--success-border)] opacity-90"
                  : "bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]"
              }`}
            >
              {loadingStates["starter"] ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : currentTier === "starter" ? (
                <>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  Your Active Plan
                </>
              ) : (
                "Subscribe Starter"
              )}
            </button>
          </motion.div>

          {/* Card: Pro Plan [THE HONEY TRAP - MAIN FOCUS] */}
          <motion.div 
            whileHover={{ y: -6, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative flex flex-col p-[2px] rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] shadow-xl shadow-indigo-500/10 dark:shadow-indigo-500/5 md:scale-105 transition-all group"
          >
            {/* Spotlight Gradient Background Blur */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-[var(--brand-primary)]/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-all duration-500" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[var(--brand-secondary)]/10 rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-all duration-500" />

            <div className="flex-1 flex flex-col bg-[var(--bg-surface)] rounded-[var(--radius-xl)] p-7 justify-between relative overflow-hidden">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white text-[10px] font-bold uppercase tracking-wider shadow-md flex items-center gap-1 select-none font-mono">
                <Flame className="w-3.5 h-3.5 animate-pulse text-amber-300" />
                Recommended Plan
              </span>

              {currentTier === "growth" && (
                <span className="absolute top-4 right-4 px-2.5 py-1 rounded bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--success-border)] text-[10px] font-bold uppercase tracking-wider select-none font-mono">
                  Active Plan
                </span>
              )}

              <div className="space-y-6 pt-2">
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-[var(--brand-primary)] uppercase font-mono tracking-wider">Pro Plan</span>
                  <h3 className="text-xl font-display font-extrabold text-[var(--text-primary)] leading-tight">Highly Recommended for Scaling</h3>
                  <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                    Unlock automatic campaigns and unlimited lead extractions to scale your customer outreach.
                  </p>
                </div>

                <div className="flex items-baseline gap-1 select-none border-y border-[var(--border-subtle)] py-3">
                  <span className="text-4xl font-extrabold text-[var(--text-primary)]">₹2,999</span>
                  <span className="text-xs text-[var(--text-tertiary)] font-medium">/ month</span>
                </div>

                <ul className="space-y-3.5 text-xs text-[var(--text-secondary)] font-sans">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[var(--brand-subtle)] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-[var(--brand-primary)] stroke-[3]" />
                    </div>
                    <span><strong className="text-[var(--text-primary)]">2,500 AI Credits</strong> / month</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[var(--brand-subtle)] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-[var(--brand-primary)] stroke-[3]" />
                    </div>
                    <span><strong className="text-[var(--text-primary)]">Unlimited CRM Leads</strong></span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[var(--brand-subtle)] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-[var(--brand-primary)] stroke-[3]" />
                    </div>
                    <span><strong>Outbound Campaigns Engine</strong></span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[var(--brand-subtle)] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 text-[var(--brand-primary)] stroke-[3]" />
                    </div>
                    <span><strong>3 Staff Seats</strong></span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => handleSubscribe("growth")}
                disabled={loadingStates["growth"] || currentTier === "growth"}
                className={`mt-8 w-full h-11 rounded-[var(--radius-lg)] text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed select-none ${
                  currentTier === "growth"
                    ? "bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--success-border)] opacity-90"
                    : "bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] hover:from-[var(--brand-primary-hover)] hover:to-[var(--brand-secondary)] text-white shadow-md shadow-indigo-500/10"
                }`}
              >
                {loadingStates["growth"] ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : currentTier === "growth" ? (
                  <>
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    Your Active Plan
                  </>
                ) : (
                  "Subscribe Pro"
                )}
              </button>
            </div>
          </motion.div>

          {/* Card: Domination (Adaptive Theme UI) */}
          <motion.div 
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex flex-col bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-7 justify-between relative shadow-sm hover:shadow-md transition-all group"
          >
            {currentTier === "domination" && (
              <span className="absolute top-4 right-4 px-2.5 py-1 rounded bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--success-border)] text-[10px] font-bold uppercase tracking-wider select-none font-mono">
                Active Plan
              </span>
            )}
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase font-mono tracking-wider">Domination Plan</span>
                <h3 className="text-xl font-display font-bold text-[var(--text-primary)] leading-tight">Total Business Autopilot</h3>
                <p className="text-xs text-[var(--text-secondary)] font-sans leading-relaxed">
                  The ultimate suite for enterprise-level automation and custom AI brain configurations.
                </p>
              </div>

              <div className="flex items-baseline gap-1 select-none border-y border-[var(--border-subtle)] py-3">
                <span className="text-3xl font-extrabold text-[var(--text-primary)]">₹4,999</span>
                <span className="text-xs text-[var(--text-tertiary)] font-medium">/ month</span>
              </div>

              <ul className="space-y-3.5 text-xs text-[var(--text-secondary)] font-sans">
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[var(--brand-subtle)] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-[var(--brand-primary)] stroke-[3]" />
                  </div>
                  <span><strong>10,000 AI Credits</strong> / month</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[var(--brand-subtle)] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-[var(--brand-primary)] stroke-[3]" />
                  </div>
                  <span><strong>Auto-Review Reputation Engine</strong></span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[var(--brand-subtle)] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-[var(--brand-primary)] stroke-[3]" />
                  </div>
                  <span>Zero-Touch Calendar Booking</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[var(--brand-subtle)] flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 text-[var(--brand-primary)] stroke-[3]" />
                  </div>
                  <span><strong>Unlimited Seats</strong></span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleSubscribe("domination")}
              disabled={loadingStates["domination"] || currentTier === "domination"}
              className={`mt-8 w-full h-11 rounded-[var(--radius-lg)] border text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed select-none ${
                currentTier === "domination"
                  ? "bg-[var(--color-success-bg)] text-[var(--color-success-text)] border-[var(--success-border)] opacity-90"
                  : "bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]"
              }`}
            >
              {loadingStates["domination"] ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : currentTier === "domination" ? (
                <>
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  Your Active Plan
                </>
              ) : (
                "Subscribe Domination"
              )}
            </button>
          </motion.div>

        </div>

        {/* Top-Up Quick Purchase Block */}
        <div className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] rounded-[var(--radius-xl)] p-6 sm:p-8 space-y-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--brand-primary)]/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-2 select-none">
            <h3 className="text-lg font-display font-extrabold text-[var(--text-primary)] flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500/20" />
              Need Extra AI Credits?
            </h3>
            <p className="text-xs text-[var(--text-secondary)] font-medium max-w-xl leading-relaxed">
              Top up your balance instantly with a one-time purchase. No monthly commitments or hidden parameters.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* Pack: Mini */}
            <motion.div 
              whileHover={{ scale: 1.015 }}
              className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5 flex flex-col justify-between space-y-4 hover:border-[var(--brand-primary)] hover:bg-[var(--bg-surface)] transition-all duration-300 shadow-inner hover:shadow-sm"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-[var(--brand-primary)] uppercase tracking-wider bg-[var(--brand-subtle)] px-2 py-0.5 rounded">Mini Pack</span>
                <h4 className="text-sm font-bold text-[var(--text-primary)] font-display pt-1">+500 AI Credits</h4>
              </div>
              <div className="flex justify-between items-center select-none pt-2">
                <span className="text-base font-extrabold text-[var(--text-primary)] font-mono">₹499</span>
                <button
                  onClick={() => handleTopUp("mini")}
                  disabled={loadingStates["mini"]}
                  className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-[var(--radius-md)] text-xs font-semibold flex items-center justify-center min-w-[64px] active:scale-[0.97] cursor-pointer disabled:opacity-50 transition-all select-none"
                >
                  {loadingStates["mini"] ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Buy Pack"
                  )}
                </button>
              </div>
            </motion.div>

            {/* Pack: Pro (Featured Top-Up) */}
            <motion.div 
              whileHover={{ scale: 1.015 }}
              className="bg-[var(--bg-subtle)] border-2 border-[var(--brand-primary)] rounded-[var(--radius-lg)] p-5 flex flex-col justify-between space-y-4 hover:bg-[var(--bg-surface)] transition-all duration-300 relative shadow-sm hover:shadow-md"
            >
              <span className="absolute -top-2.5 right-4 px-2 py-0.5 rounded-full bg-[var(--brand-primary)] text-white text-[9px] font-bold uppercase tracking-wider select-none font-mono">
                Best Value
              </span>
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-[var(--brand-primary)] uppercase tracking-wider bg-[var(--brand-subtle)] px-2 py-0.5 rounded">Pro Pack</span>
                <h4 className="text-sm font-bold text-[var(--text-primary)] font-display pt-1">+1,000 AI Credits</h4>
              </div>
              <div className="flex justify-between items-center select-none pt-2">
                <span className="text-base font-extrabold text-[var(--text-primary)] font-mono">₹899</span>
                <button
                  onClick={() => handleTopUp("pro")}
                  disabled={loadingStates["pro"]}
                  className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-[var(--radius-md)] text-xs font-semibold flex items-center justify-center min-w-[64px] active:scale-[0.97] cursor-pointer disabled:opacity-50 transition-all select-none"
                >
                  {loadingStates["pro"] ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Buy Pack"
                  )}
                </button>
              </div>
            </motion.div>

            {/* Pack: Mega */}
            <motion.div 
              whileHover={{ scale: 1.015 }}
              className="bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5 flex flex-col justify-between space-y-4 hover:border-[var(--brand-primary)] hover:bg-[var(--bg-surface)] transition-all duration-300 shadow-inner hover:shadow-sm"
            >
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-[var(--brand-primary)] uppercase tracking-wider bg-[var(--brand-subtle)] px-2 py-0.5 rounded">Mega Pack</span>
                <h4 className="text-sm font-bold text-[var(--text-primary)] font-display pt-1">+2,500 AI Credits</h4>
              </div>
              <div className="flex justify-between items-center select-none pt-2">
                <span className="text-base font-extrabold text-[var(--text-primary)] font-mono">₹1,999</span>
                <button
                  onClick={() => handleTopUp("mega")}
                  disabled={loadingStates["mega"]}
                  className="px-4 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-[var(--radius-md)] text-xs font-semibold flex items-center justify-center min-w-[64px] active:scale-[0.97] cursor-pointer disabled:opacity-50 transition-all select-none"
                >
                  {loadingStates["mega"] ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Buy Pack"
                  )}
                </button>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Security & Support Footnote */}
        <div className="flex items-start gap-2.5 p-4 rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] font-sans leading-relaxed select-none justify-center shadow-xs">
          <Shield className="w-4 h-4 text-[var(--brand-primary)] shrink-0" />
          <span>
            Payments are processed securely via <strong>Razorpay</strong>. We support UPI (Google Pay, PhonePe, Paytm), NetBanking, and credit/debit cards.
          </span>
        </div>

      </div>
    </motion.div>
  );
}
