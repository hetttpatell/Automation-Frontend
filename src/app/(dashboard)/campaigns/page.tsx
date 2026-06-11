"use client";


// Backend API URL — routes to our dedicated Node.js server
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Megaphone,
  ChevronDown,
  Sparkles,
  Target,
  X,
  AlertTriangle,
  Check,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

// ─── Types ──────────────────────────────────────────────────────────
interface Lead {
  id: string;
  customer_name: string;
  customer_phone: string;
  kanban_stage: "new" | "contacted" | "converted" | "lost" | "completed";
}

type TargetStage = "lost" | "contacted";

// ─── Variable Pills Config ──────────────────────────────────────────
const VARIABLE_PILLS = [
  { label: "{customer_name}", value: "{customer_name}" },
  { label: "{business_name}", value: "{business_name}" },
];

// ─── Main Component ─────────────────────────────────────────────────
export default function CampaignsPage() {
  const supabase = createClient();
  const { success, error: toastError, warning, info } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ─── State ────────────────────────────────────────────────────────
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [businessName, setBusinessName] = useState("My Business");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionTier, setSubscriptionTier] = useState<string>("free");

  // Composer state
  const [campaignName, setCampaignName] = useState("");
  const [targetStage, setTargetStage] = useState<TargetStage>("lost");
  const [customMessage, setCustomMessage] = useState("");
  const [sendMode, setSendMode] = useState<"text" | "template">("text");
  const [templateName, setTemplateName] = useState("");
  const [templateLang, setTemplateLang] = useState("en");

  // Action state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // ─── Fetch user + leads ───────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.email) {
        setUser(user);

        // Fetch business name AND subscription tier
        const { data: tenant } = await supabase
          .from("tenants")
          .select("business_name, subscription_tier")
          .eq("owner_email", user.email)
          .single();

        if (tenant) {
          if (tenant.business_name) {
            setBusinessName(tenant.business_name);
          }
          if (tenant.subscription_tier) {
            setSubscriptionTier(tenant.subscription_tier);
          }
        }

        // Fetch leads
        const { data: leadsData, error } = await supabase
          .from("leads")
          .select("id, customer_name, customer_phone, kanban_stage")
          .eq("tenant_id", user.id);

        if (!error && leadsData) {
          setLeads(leadsData as Lead[]);
        }
      }
      setIsLoading(false);
    }
    init();
  }, []);

  // ─── Computed values ──────────────────────────────────────────────
  const targetLeads = leads.filter((l) => l.kanban_stage === targetStage);
  const targetCount = targetLeads.length;
  const stageLabel = targetStage === "lost" ? "Lost" : "Contacted";

  const isFormValid =
    campaignName.trim().length > 0 &&
    customMessage.trim().length > 0 &&
    targetCount > 0 &&
    (sendMode === "text" || templateName.trim().length > 0);

  // ─── Preview text renderer ────────────────────────────────────────
  const getPreviewText = useCallback(
    (text: string) => {
      if (!text.trim()) return "Your message preview will appear here…";
      return text
        .replace(/\{customer_name\}/g, "Grahak ")
        .replace(/\{business_name\}/g, businessName);
    },
    [businessName]
  );

  // ─── Insert variable at cursor ────────────────────────────────────
  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = customMessage.substring(0, start);
    const after = customMessage.substring(end);
    const newText = before + variable + after;

    setCustomMessage(newText);

    // Restore cursor position after the inserted variable
    requestAnimationFrame(() => {
      textarea.focus();
      const newPos = start + variable.length;
      textarea.setSelectionRange(newPos, newPos);
    });
  };

  // ─── Launch blast ─────────────────────────────────────────────────
  const handleLaunchBlast = async () => {
    if (!user || !isFormValid) return;
    setIsSending(true);

    try {
      // Get current session token for backend auth
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || "";

      const res = await fetch(`${API_URL}/api/campaigns/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          campaign_name: campaignName.trim(),
          custom_message_body: customMessage.trim(),
          target_stage: targetStage,
          template_name: sendMode === "template" ? templateName.trim() : "",
          template_lang: sendMode === "template" ? templateLang.trim() : "en",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Complete failure — server error or zero messages delivered
        toastError(data.message || "Failed to send campaign.");
        return;
      }

      // Check delivery results for partial vs full success
      const totalSent = data.total_sent ?? 0;
      const totalFailed = data.total_failed ?? 0;

      if (totalFailed > 0 && totalSent > 0) {
        // Partial delivery — some succeeded, some failed
        warning(data.message || `⚠️ ${totalSent} sent, ${totalFailed} failed.`);
      } else {
        // Full success — all messages delivered
        success(data.message || "🚀 Blast campaign successfully sent!");
      }

      // Reset form on any successful deliveries
      if (totalSent > 0) {
        setCampaignName("");
        setCustomMessage("");
        setTargetStage("lost");
      }
    } catch (err: any) {
      console.error("[Campaign Send Error]:", err);
      toastError("Network error. Please try again.");
    } finally {
      setIsSending(false);
      setIsConfirmOpen(false);
    }
  };

  // ─── Current time for preview ─────────────────────────────────────
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // ─── Render ───────────────────────────────────────────────────────
  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-canvas)] relative">
      {(subscriptionTier === "free" || subscriptionTier === "starter") && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-40 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface-raised)]/95 backdrop-blur-xl border border-[var(--border-subtle)] rounded-[var(--radius-xl)] shadow-2xl p-8 max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center mx-auto text-[var(--brand-primary)]">
              <Megaphone className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-display font-extrabold text-[var(--text-primary)]">
                Upgrade to Pro
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Upgrade to the Pro Plan to instantly build outbound marketing campaigns.
              </p>
            </div>
            <button
              onClick={() => router.push("/pricing")}
              className="w-full h-11 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] hover:brightness-110 text-white rounded-[var(--radius-lg)] text-sm font-semibold transition-all active:scale-[0.98] shadow-md cursor-pointer flex items-center justify-center"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}
      <div className="px-6 py-6 space-y-5 max-w-[1400px] mx-auto">
        {/* ─── Page Header ──────────────────────────────── */}
        <div className="flex items-center gap-3 select-none">
          <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center shadow-[var(--shadow-md)] overflow-hidden">
            <motion.svg
              viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"
              animate={{ rotate: [0, -3, 3, 0], scale: [1, 1.03, 1.03, 1] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <path d="M11.66 18H2v-6h9.66" />
              <path d="M16 18l5 3v-18l-5 3z" />
              <motion.path d="M22 10a4 4 0 0 1 0 4" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2 }} />
              <motion.path d="M23 8a8 8 0 0 1 0 8" animate={{ opacity: [0.1, 1, 0.1] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} />
            </motion.svg>
          </div>
          <div>
            <h2 className="text-lg font-display font-semibold text-[var(--text-primary)] leading-tight">
              Campaign Blast
            </h2>
            <p className="text-xs text-[var(--text-secondary)] font-sans">
              Draft and launch reactivation messages to your pipeline
            </p>
          </div>
        </div>

        {/* ─── Main Grid: Composer + Preview ──────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* ═══ LEFT PANEL — THE COMPOSER ═══ */}
          <div className="space-y-4">
            {/* Campaign Name */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5 space-y-4">
              <div>
                <label
                  htmlFor="campaign-name"
                  className="block text-[11px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] mb-1.5"
                >
                  Campaign Name
                </label>
                <input
                  id="campaign-name"
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Monsoon Ceramic Coating Offer"
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] px-3.5 py-2.5 text-sm font-sans text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--brand-primary)] focus:shadow-[var(--shadow-focus)] transition-all duration-200"
                />
              </div>

              {/* Target Audience Dropdown */}
              <div>
                <label
                  htmlFor="target-stage"
                  className="block text-[11px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] mb-1.5"
                >
                  Target Audience Pipeline Stage
                </label>
                <div className="relative">
                  <select
                    id="target-stage"
                    value={targetStage}
                    onChange={(e) =>
                      setTargetStage(e.target.value as TargetStage)
                    }
                    className="w-full appearance-none bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] px-3.5 py-2.5 text-sm font-sans text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] focus:shadow-[var(--shadow-focus)] cursor-pointer transition-all duration-200 pr-10"
                  >
                    <option value="lost">Lost Leads Only</option>
                    <option value="contacted">Contacted Leads Only</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
                </div>
              </div>

              {/* Dispatch Method Selection */}
              <div className="space-y-2">
                <label className="block text-[11px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px]">
                  Dispatch Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Standard Text Mode Option */}
                  <button
                    type="button"
                    id="mode-text-btn"
                    onClick={() => setSendMode("text")}
                    className={`flex flex-col items-start p-3.5 rounded-[var(--radius-lg)] border text-left cursor-pointer transition-all duration-200 relative overflow-hidden ${
                      sendMode === "text"
                        ? "bg-gradient-to-br from-[var(--brand-subtle)] to-[var(--bg-surface)] dark:from-[var(--brand-subtle)] dark:to-transparent border-[var(--brand-primary)] text-[var(--text-primary)] shadow-sm scale-[1.01]"
                        : "bg-[var(--bg-subtle)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                    }`}
                  >
                    {sendMode === "text" && (
                      <motion.div
                        layoutId="active-dispatch-indicator"
                        className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--brand-primary)] shadow-[0_0_8px_var(--brand-primary)]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      <Send className={`w-3.5 h-3.5 ${sendMode === "text" ? "text-[var(--brand-primary)]" : "text-[var(--text-secondary)]"}`} />
                      <span className="text-xs font-semibold">Standard Text</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-tertiary)] leading-normal">
                      Only works if leads messaged in 24h. Free/Session.
                    </span>
                  </button>

                  {/* Template Mode Option */}
                  <button
                    type="button"
                    id="mode-template-btn"
                    onClick={() => setSendMode("template")}
                    className={`flex flex-col items-start p-3.5 rounded-[var(--radius-lg)] border text-left cursor-pointer transition-all duration-200 relative overflow-hidden ${
                      sendMode === "template"
                        ? "bg-gradient-to-br from-[var(--brand-subtle)] to-[var(--bg-surface)] dark:from-[var(--brand-subtle)] dark:to-transparent border-[var(--brand-primary)] text-[var(--text-primary)] shadow-sm scale-[1.01]"
                        : "bg-[var(--bg-subtle)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                    }`}
                  >
                    {sendMode === "template" && (
                      <motion.div
                        layoutId="active-dispatch-indicator"
                        className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--brand-primary)] shadow-[0_0_8px_var(--brand-primary)]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className={`w-3.5 h-3.5 ${sendMode === "template" ? "text-[var(--brand-primary)]" : "text-[var(--text-secondary)]"}`} />
                      <span className="text-xs font-semibold">Approved Template</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-tertiary)] leading-normal">
                      Required for cold/lost leads. Bypasses 24h limit.
                    </span>
                  </button>
                </div>
              </div>

              {/* Template Configuration Fields (Conditional) */}
              <AnimatePresence>
                {sendMode === "template" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-3 bg-[var(--bg-subtle)] p-4 rounded-[var(--radius-lg)] border border-[var(--border-default)]"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="template-name"
                          className="block text-[10px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] mb-1"
                        >
                          Template Name
                        </label>
                        <input
                          id="template-name"
                          type="text"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          placeholder="e.g. campaign_blast"
                          className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs font-sans text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--brand-primary)]"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="template-lang"
                          className="block text-[10px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] mb-1"
                        >
                          Language Code
                        </label>
                        <input
                          id="template-lang"
                          type="text"
                          value={templateLang}
                          onChange={(e) => setTemplateLang(e.target.value)}
                          placeholder="e.g. en"
                          className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs font-sans text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--brand-primary)]"
                        />
                      </div>
                    </div>
                    <div className="text-[10px] text-[var(--text-tertiary)] leading-normal flex items-start gap-1 select-none">
                      <span>💡</span>
                      <span>
                        Make sure this template is pre-approved in Meta Business Suite before launching.
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Custom Message */}
              <div>
                <label
                  htmlFor="custom-message"
                  className="block text-[11px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] mb-1.5"
                >
                  Custom Message
                </label>
                <textarea
                  ref={textareaRef}
                  id="custom-message"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Hi {customer_name}, we have an exciting offer for you from {business_name}! ✨"
                  rows={6}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] px-3.5 py-2.5 text-sm font-sans text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--brand-primary)] focus:shadow-[var(--shadow-focus)] transition-all duration-200 resize-none leading-relaxed"
                />
                <div className="flex items-center justify-between mt-2">
                  {/* Variable Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-sans text-[var(--text-tertiary)] font-medium mr-0.5 select-none">
                      Insert:
                    </span>
                    {VARIABLE_PILLS.map((pill) => (
                      <button
                        key={pill.value}
                        type="button"
                        onClick={() => insertVariable(pill.value)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-[var(--brand-subtle)] text-[var(--brand-primary)] border border-[var(--brand-border)] hover:bg-[var(--brand-muted)] active:scale-[0.97] cursor-pointer transition-all select-none"
                      >
                        <Sparkles className="w-3 h-3" />
                        {pill.label}
                      </button>
                    ))}
                  </div>
                  {/* Character count */}
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)] select-none tabular-nums">
                    {customMessage.length} chars
                  </span>
                </div>
              </div>
            </div>

            {/* ─── Audience Audit Counter (Bento-style) ─────────────────── */}
            <motion.div
              layout
              className={`rounded-[var(--radius-xl)] border p-4 flex items-center gap-4 select-none shadow-[var(--shadow-xs)] transition-all duration-300 ${
                targetCount > 0
                  ? "bg-gradient-to-br from-[var(--color-info-bg)] via-[var(--bg-surface)] to-[var(--color-info-bg)] dark:from-[var(--color-info-bg)]/20 dark:via-zinc-900/10 dark:to-[var(--color-info-bg)]/20 border-[var(--info-border)]"
                  : "bg-gradient-to-br from-[var(--color-warning-bg)] via-[var(--bg-surface)] to-[var(--color-warning-bg)] dark:from-[var(--color-warning-bg)]/20 dark:via-zinc-900/10 dark:to-[var(--color-warning-bg)]/20 border-[var(--warning-border)]"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-105 ${
                  targetCount > 0
                    ? "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                    : "bg-[var(--warning-icon)]/10 text-[var(--warning-icon)]"
                }`}
              >
                {targetCount > 0 ? (
                  <div className="relative">
                    <span className="absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75 animate-ping -top-0.5 -right-0.5" />
                    <motion.svg
                      viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" fill="currentColor" />
                    </motion.svg>
                  </div>
                ) : (
                  <motion.svg
                    viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    animate={{ rotate: [-4, 4, -4] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <motion.line x1="12" y1="17" x2="12.01" y2="17" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} />
                  </motion.svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {isLoading ? (
                  <div className="h-4 w-48 bg-[var(--bg-muted)] rounded animate-pulse" />
                ) : targetCount > 0 ? (
                  <p className="text-[13.5px] font-sans text-[var(--text-primary)] leading-relaxed">
                    Targeting{" "}
                    <span className="font-bold text-[var(--brand-primary)] tabular-nums bg-[var(--brand-subtle)] px-1.5 py-0.5 rounded-md border border-[var(--brand-border)]">
                      {targetCount}
                    </span>{" "}
                    lead{targetCount !== 1 ? "s" : ""} in the{" "}
                    <span className="font-semibold text-[var(--brand-primary)] bg-[var(--brand-subtle)] px-1.5 py-0.5 rounded-md border border-[var(--brand-border)]">&lsquo;{stageLabel}&rsquo;</span>{" "}
                    pipeline stage.
                  </p>
                ) : (
                  <p className="text-[13.5px] font-sans text-[var(--color-warning-text)] leading-relaxed">
                    No leads found in the{" "}
                    <span className="font-semibold bg-[var(--color-warning-bg)] px-1.5 py-0.5 rounded-md border border-[var(--warning-border)]">&lsquo;{stageLabel}&rsquo;</span>{" "}
                    stage. This blast will have zero recipients.
                  </p>
                )}
              </div>
              {!isLoading && (
                <div
                  className={`text-3xl font-display font-black tracking-tight tabular-nums shrink-0 ${
                    targetCount > 0
                      ? "text-[var(--brand-primary)]"
                      : "text-[var(--warning-icon)]"
                  }`}
                >
                  {targetCount}
                </div>
              )}
            </motion.div>

            {/* ─── Launch Button ──────────────────────────── */}
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              disabled={!isFormValid || isSending}
              className={`w-full flex items-center justify-center gap-2.5 h-12 rounded-[var(--radius-lg)] text-sm font-display font-semibold tracking-wide transition-all duration-200 select-none ${isFormValid && !isSending
                ? "bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] hover:brightness-110 active:scale-[0.98] cursor-pointer"
                : "bg-[var(--bg-muted)] text-[var(--text-disabled)] cursor-not-allowed"
                }`}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  Launching…
                </>
              ) : (
                <>
                  <Send className="w-4.5 h-4.5" />
                  Launch Blast Campaign
                </>
              )}
            </button>
          </div>

          {/* ═══ RIGHT PANEL — LIVE WHATSAPP PREVIEW ═══ */}
          <div className="space-y-3">
            <div className="flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--success-icon)] animate-pulse" />
                <span className="text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-[1px]">
                  Live Message Preview
                </span>
              </div>
              <span className={`px-2 py-0.5 rounded-[var(--radius-sm)] text-[9px] font-mono font-bold uppercase tracking-[0.5px] border ${
                sendMode === "template"
                  ? "bg-purple-100 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/30"
                  : "bg-blue-100 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30"
              }`}>
                {sendMode === "template" ? `Template: ${templateName || "unnamed"}` : "Text (24h Window)"}
              </span>
            </div>

            {/* WhatsApp Premium Glass Mockup (Desktop) */}
            <div className="hidden md:block relative mx-auto max-w-[365px] rounded-[36px] border-[8px] border-slate-900 bg-slate-950 p-1.5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] overflow-hidden">
              {/* Phone Speaker & Camera Bezel Notch */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-40 flex items-center justify-center gap-1.5 px-3">
                <div className="w-8 h-1 bg-slate-800 rounded-full" />
                <div className="w-2.5 h-2.5 bg-slate-850 rounded-full border border-slate-750" />
              </div>

              {/* Gloss highlight reflex shine (diagonal line overlay) */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent rotate-12 pointer-events-none z-30" />

              <div className="rounded-[28px] overflow-hidden border border-slate-800/20 bg-[#0B141A]">
                {/* WA Header */}
                <div className="bg-[#1F2C33] px-4 pt-5 pb-3 flex items-center gap-3 select-none">
                  <div className="w-8 h-8 rounded-full bg-[#2A3942] flex items-center justify-center shrink-0">
                    <svg
                      className="w-4.5 h-4.5 text-[#8696A0]"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-sans font-medium text-[#E9EDEF] leading-tight truncate">
                      Customer-Name
                    </p>
                    <p className="text-[10px] font-sans text-[#8696A0] leading-tight mt-0.5">
                      online
                    </p>
                  </div>
                </div>

                {/* WA Chat Area */}
                <div
                  className="relative min-h-[340px] p-4 flex flex-col justify-end"
                  style={{
                    backgroundColor: "#0B141A",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23131d25' fill-opacity='0.6'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  }}
                >
                  {/* System date chip */}
                  <div className="flex justify-center mb-4">
                    <span className="px-3 py-0.5 rounded-md text-[10px] font-sans text-[#8696A0] bg-[#182229] shadow-sm select-none">
                      Today
                    </span>
                  </div>

                  {/* Outgoing message bubble (green) */}
                  <div className="flex justify-end">
                    <motion.div
                      key={customMessage}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative max-w-[85%] rounded-lg px-3 pt-2 pb-1.5 shadow-sm"
                      style={{
                        backgroundColor: "#005C4B",
                        borderTopRightRadius: "2px",
                      }}
                    >
                      {/* Tail */}
                      <div
                        className="absolute -right-1.5 top-0 w-0 h-0"
                        style={{
                          borderLeft: "6px solid #005C4B",
                          borderTop: "0px solid transparent",
                          borderBottom: "6px solid transparent",
                        }}
                      />
                      <p className="text-[13px] font-sans text-[#E9EDEF] leading-[1.45] whitespace-pre-wrap break-words pr-12">
                        {getPreviewText(customMessage)}
                      </p>
                      {/* Timestamp + Read receipt */}
                      <div className="flex items-center justify-end gap-0.5 -mt-0.5">
                        <span className="text-[9.5px] font-sans text-[#8696A0]/80 tabular-nums">
                          {currentTime}
                        </span>
                        {/* Double-check read receipt */}
                        <svg
                          className="w-3.5 h-3.5 text-[#53BDEB]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M18 6L7 17l-5-5" />
                          <path d="M22 6L11 17" />
                        </svg>
                      </div>
                    </motion.div>
                  </div>
                </div>

                {/* WA Bottom input bar */}
                <div className="bg-[#1F2C33] px-3 py-3 flex items-center gap-2 select-none">
                  <div className="flex-1 bg-[#2A3942] rounded-full px-4 py-1.5">
                    <span className="text-[12px] font-sans text-[#8696A0] select-none">
                      Type a message
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#00A884] flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 cursor-pointer transition-all duration-150">
                    <svg
                      className="w-4 h-4 text-white"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile WhatsApp Chat Preview (No dummy phone frame) */}
            <div className="block md:hidden rounded-[var(--radius-lg)] overflow-hidden border border-slate-800/20 bg-[#0B141A] shadow-md">
              {/* WA Chat Area */}
              <div
                className="relative min-h-[160px] p-4 flex flex-col justify-center"
                style={{
                  backgroundColor: "#0B141A",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23131d25' fill-opacity='0.6'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              >
                {/* Outgoing message bubble (green) */}
                <div className="flex justify-end">
                  <motion.div
                    key={customMessage}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative max-w-[90%] rounded-lg px-3 pt-2 pb-1.5 shadow-sm"
                    style={{
                      backgroundColor: "#005C4B",
                      borderTopRightRadius: "2px",
                    }}
                  >
                    {/* Tail */}
                    <div
                      className="absolute -right-1.5 top-0 w-0 h-0"
                      style={{
                        borderLeft: "6px solid #005C4B",
                        borderTop: "0px solid transparent",
                        borderBottom: "6px solid transparent",
                      }}
                    />
                    <p className="text-[13px] font-sans text-[#E9EDEF] leading-[1.45] whitespace-pre-wrap break-words pr-12">
                      {getPreviewText(customMessage)}
                    </p>
                    {/* Timestamp + Read receipt */}
                    <div className="flex items-center justify-end gap-0.5 -mt-0.5">
                      <span className="text-[9.5px] font-sans text-[#8696A0]/80 tabular-nums">
                        {currentTime}
                      </span>
                      {/* Double-check read receipt */}
                      <svg
                        className="w-3.5 h-3.5 text-[#53BDEB]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 6L7 17l-5-5" />
                        <path d="M22 6L11 17" />
                      </svg>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Preview note */}
            <div className="flex items-center gap-2 px-1 select-none">
              <Sparkles className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
              <span className="text-[11px] font-sans text-[var(--text-tertiary)] leading-relaxed">
                Variables like <code className="font-mono text-[var(--brand-primary)] bg-[var(--brand-subtle)] px-1 py-0.5 rounded text-[10px]">{"{customer_name}"}</code> are dynamically replaced with real lead data at send time.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ CONFIRMATION DIALOG OVERLAY ═══ */}
      <AnimatePresence>
        {isConfirmOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-[var(--bg-overlay)] z-50"
              onClick={() => !isSending && setIsConfirmOpen(false)}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none"
            >
              <div className="pointer-events-auto w-full max-w-md bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] overflow-hidden">
                {/* Dialog header */}
                <div className="p-5 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-warning-bg)] flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5 text-[var(--warning-icon)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-display font-semibold text-[var(--text-primary)] leading-tight mb-1">
                        Confirm Blast Launch
                      </h3>
                      <p className="text-[13px] font-sans text-[var(--text-secondary)] leading-relaxed">
                        Are you sure you want to blast this custom message to{" "}
                        <span className="font-bold text-[var(--text-primary)] tabular-nums">
                          {targetCount}
                        </span>{" "}
                        recipient{targetCount !== 1 ? "s" : ""}? This action
                        cannot be reversed.
                      </p>
                    </div>
                    <button
                      onClick={() => !isSending && setIsConfirmOpen(false)}
                      className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded-[var(--radius-md)] hover:bg-[var(--bg-subtle)] cursor-pointer transition-colors"
                      aria-label="Close dialog"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* Campaign summary */}
                <div className="mx-5 mb-4 p-3 bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-sans">
                    <div>
                      <span className="text-[var(--text-tertiary)] uppercase tracking-[0.5px] font-semibold">
                        Campaign
                      </span>
                      <p className="text-[var(--text-primary)] font-medium mt-0.5 truncate">
                        {campaignName}
                      </p>
                    </div>
                    <div>
                      <span className="text-[var(--text-tertiary)] uppercase tracking-[0.5px] font-semibold">
                        Target
                      </span>
                      <p className="text-[var(--text-primary)] font-medium mt-0.5">
                        {stageLabel} Leads ({targetCount})
                      </p>
                    </div>
                    <div>
                      <span className="text-[var(--text-tertiary)] uppercase tracking-[0.5px] font-semibold">
                        Mode
                      </span>
                      <p className="text-[var(--text-primary)] font-medium mt-0.5 truncate">
                        {sendMode === "template" ? `Template (${templateName || "unnamed"})` : "Standard Text"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dialog actions */}
                <div className="px-5 pb-5 flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => !isSending && setIsConfirmOpen(false)}
                    disabled={isSending}
                    className="px-4 py-2 rounded-[var(--radius-md)] text-[13px] font-sans font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLaunchBlast}
                    disabled={isSending}
                    className="px-5 py-2 rounded-[var(--radius-md)] text-[13px] font-display font-semibold text-white bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] hover:brightness-110 shadow-[var(--shadow-sm)] cursor-pointer transition-all active:scale-[0.98] flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Confirm & Launch
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
