"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Loader2,
  ChevronDown,
  HelpCircle,
  MessageSquareText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

// ─── Interfaces ────────────────────────────────────────────────────
interface FAQ {
  id: string;
  question: string;
  answer: string;
  created_at?: string;
}

// ─── Skeleton Loader ───────────────────────────────────────────────
function KnowledgeSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-[#121214] rounded-xl border border-[#27272A] p-5 h-24 animate-shimmer"
        />
      ))}
    </div>
  );
}

// ─── Toast Notification ────────────────────────────────────────────
function Toast({
  show,
  message,
  variant = "success",
  onClose,
}: {
  show: boolean;
  message: string;
  variant?: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3500);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed bottom-8 right-8 z-50 flex items-center gap-3 pl-4 pr-5 py-3.5 rounded-xl shadow-2xl border ${
            variant === "success"
              ? "bg-[#1C1C1F] text-[#F4F4F5] border-[#27272A]"
              : "bg-rose-950 text-rose-200 border-rose-800/30"
          }`}
        >
          {variant === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span className="text-xs font-semibold font-sans">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── FAQ Card Component ────────────────────────────────────────────
function FAQCard({
  faq,
  onDelete,
  index,
}: {
  faq: FAQ;
  onDelete: (id: string) => void;
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{
        duration: 0.35,
        delay: index * 0.04,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="group bg-[#121214] rounded-xl border border-[#27272A] shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      {/* Question Row — Clickable */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left cursor-pointer select-none focus:outline-none rounded-xl transition-colors duration-200 hover:bg-white/[0.01]"
      >
        {/* Numbering Badge */}
        <span className="w-7 h-7 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center text-[10px] font-bold font-mono text-[#6366F1] shrink-0 tabular-nums">
          {index + 1}
        </span>

        {/* Question Text */}
        <span className="flex-1 text-xs font-semibold text-[#F4F4F5] font-sans leading-snug">
          {faq.question}
        </span>

        {/* Expand Chevron */}
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="text-[#71717A] shrink-0"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>

        {/* Delete Button */}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(faq.id);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              onDelete(faq.id);
            }
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1.5 rounded-lg hover:bg-rose-500/10 cursor-pointer focus:outline-none"
          aria-label={`Delete FAQ: ${faq.question}`}
        >
          <Trash2 className="w-4 h-4 text-[#71717A] hover:text-rose-400 transition-colors duration-200" />
        </span>
      </button>

      {/* Answer Collapsible Section */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 pt-0 ml-10 border-t border-[#27272A]/60">
              <p className="text-xs text-[#71717A] font-sans leading-relaxed mt-3 whitespace-pre-wrap select-text selection:bg-[#6366F1]/20">
                {faq.answer}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page Component ───────────────────────────────────────────
export default function KnowledgeBasePage() {
  const supabase = createClient();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    variant: "success" | "error";
  }>({ show: false, message: "", variant: "success" });

  useEffect(() => {
    document.title = "Knowledge Base | LeadFlow";
  }, []);

  // Fetch FAQs
  useEffect(() => {
    async function fetchFAQs() {
      setIsLoading(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("[KB Auth Error]:", authError?.message || "No user found");
        setIsLoading(false);
        return;
      }

      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .select("id")
        .eq("owner_email", user.email)
        .single();

      let resolvedTenantId = tenant?.id;

      if (tenantError && tenantError.code === "PGRST116") {
        const defaultBusinessName = user.email
          ? user.email.split("@")[0].charAt(0).toUpperCase() + user.email.split("@")[0].slice(1) + "'s Business"
          : "My Business";

        let { data: newTenant, error: createError } = await supabase
          .from("tenants")
          .insert({
            business_name: defaultBusinessName,
            owner_email: user.email,
            ai_system_instruction: "You are a helpful AI assistant. Answer questions truthfully and politely.",
            ai_tone: "Professional",
          })
          .select("id")
          .single();

        if (createError) {
          if (createError.code === "23505" || createError.message?.includes("unique constraint")) {
            // Swallow unique key constraint error and query existing row
            const { data: existingTenant, error: fetchError } = await supabase
              .from("tenants")
              .select("id")
              .eq("owner_email", user.email)
              .single();

            if (fetchError) {
              console.error("[KB Tenant Auto-creation Retry Error]:", fetchError.message);
              setIsLoading(false);
              return;
            }
            resolvedTenantId = existingTenant?.id;
          } else {
            console.error("[KB Tenant Auto-creation Error]:", createError.message);
            setIsLoading(false);
            return;
          }
        } else {
          resolvedTenantId = newTenant?.id;
        }
      } else if (tenantError || !tenant) {
        console.error("[KB Tenant Error]:", tenantError?.message || "No tenant found");
        setIsLoading(false);
        return;
      }

      if (resolvedTenantId) {
        setTenantId(resolvedTenantId);
        const { data, error } = await supabase
          .from("knowledge_base")
          .select("id, question, answer, created_at")
          .eq("tenant_id", resolvedTenantId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("[KB Fetch Error]:", error.message);
        } else {
          setFaqs((data as FAQ[]) || []);
        }
      }

      setIsLoading(false);
    }

    fetchFAQs();
  }, []);

  // Add Q&A Pair
  async function handleAdd() {
    if (!newQuestion.trim() || !newAnswer.trim() || !tenantId) return;

    setIsSubmitting(true);

    const { data, error } = await supabase
      .from("knowledge_base")
      .insert({
        tenant_id: tenantId,
        question: newQuestion.trim(),
        answer: newAnswer.trim(),
      })
      .select("id, question, answer, created_at")
      .single();

    if (error) {
      console.error("[KB Insert Error]:", error.message);
      setToast({
        show: true,
        message: "Failed to add entry. Please try again.",
        variant: "error",
      });
    } else if (data) {
      setFaqs((prev) => [data as FAQ, ...prev]);
      setNewQuestion("");
      setNewAnswer("");
      setToast({
        show: true,
        message: "Knowledge entry added successfully",
        variant: "success",
      });
    }

    setIsSubmitting(false);
  }

  // Delete Q&A Pair
  async function handleDelete(id: string) {
    const { error } = await supabase
      .from("knowledge_base")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[KB Delete Error]:", error.message);
      setToast({
        show: true,
        message: "Failed to delete entry. Please try again.",
        variant: "error",
      });
    } else {
      setFaqs((prev) => prev.filter((faq) => faq.id !== id));
      setToast({
        show: true,
        message: "Entry removed from knowledge base",
        variant: "success",
      });
    }
  }

  function handleFormKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleAdd();
    }
  }

  const isFormDirty = newQuestion.trim().length > 0 || newAnswer.trim().length > 0;
  const canSubmit = newQuestion.trim().length > 0 && newAnswer.trim().length > 0;

  return (
    <>
      <div className="max-w-7xl mx-auto py-2 flex flex-col gap-8 pb-24 select-none">
        
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-4"
        >
          {/* Section Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/20 text-[10px] font-mono font-bold tracking-wider text-[#6366F1] uppercase select-none self-start">
            <BookOpen className="w-3.5 h-3.5" />
            KNOWLEDGE BASE
          </div>

          <div className="space-y-1">
            <h1 className="font-calistoga text-4xl text-[#F4F4F5] leading-tight">
              Knowledge Repository
            </h1>
            <p className="font-sans text-sm text-[#71717A] font-medium max-w-lg">
              Feed custom trigger-response pairs directly into the AI live brain to automate WhatsApp customer success.
            </p>
          </div>
        </motion.div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* LEFT COLUMN: Add New Knowledge Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="lg:col-span-2"
          >
            <div
              className="sticky top-24 bg-[#121214] rounded-2xl border border-[#27272A] shadow-xl p-6 transition-all duration-300 hover:shadow-2xl"
              onKeyDown={handleFormKeyDown}
            >
              {/* Form Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-[#6366F1]" />
                </div>
                <div>
                  <h2 className="font-calistoga text-lg text-[#F4F4F5]">
                    Train Engine
                  </h2>
                  <p className="text-[10px] text-[#71717A] font-sans mt-0.5">
                    Define exact contextual Q&A structures
                  </p>
                </div>
              </div>

              {/* Question Input */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="kb-question"
                    className="flex items-center gap-2 text-[10px] font-mono font-semibold text-[#71717A] uppercase tracking-wider"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-[#71717A]" />
                    Trigger Question
                  </label>
                  <input
                    id="kb-question"
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder='e.g., "What are your standard opening hours?"'
                    className="w-full px-4 py-3 bg-[#09090B] border border-[#27272A] rounded-xl text-xs text-[#F4F4F5] placeholder-[#71717A] font-sans transition-all duration-200 focus:outline-none focus:border-[#6366F1] hover:border-[#71717A]/50"
                  />
                </div>

                {/* Answer Textarea */}
                <div className="space-y-2">
                  <label
                    htmlFor="kb-answer"
                    className="flex items-center gap-2 text-[10px] font-mono font-semibold text-[#71717A] uppercase tracking-wider"
                  >
                    <MessageSquareText className="w-3.5 h-3.5 text-[#71717A]" />
                    AI Response Payload
                  </label>
                  <div className="relative">
                    <textarea
                      id="kb-answer"
                      value={newAnswer}
                      onChange={(e) => setNewAnswer(e.target.value)}
                      placeholder="Input standard company replies, Objections, or pricing targets..."
                      rows={6}
                      className="w-full px-4 py-3 bg-[#09090B] border border-[#27272A] rounded-xl text-xs text-[#F4F4F5] placeholder-[#71717A] font-sans leading-relaxed resize-none transition-all duration-200 focus:outline-none focus:border-[#6366F1] hover:border-[#71717A]/50 min-h-[150px]"
                    />
                    <span className="absolute bottom-3 right-4 text-[9px] font-mono text-[#71717A] tabular-nums select-none">
                      {newAnswer.length.toLocaleString()} chars
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileTap={canSubmit ? { scale: 0.98 } : {}}
                  type="button"
                  onClick={handleAdd}
                  disabled={isSubmitting || !canSubmit}
                  className={`w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-xs font-semibold font-sans transition-all duration-200 cursor-pointer select-none ${
                    canSubmit && !isSubmitting
                      ? "bg-[#6366F1] text-white hover:bg-[#4F46E5] hover:shadow-lg"
                      : "bg-[#1C1C1F] text-[#71717A] cursor-not-allowed border border-[#27272A]"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      SYNCHRONIZING ATOMS…
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Deploy to Live Brain
                    </>
                  )}
                </motion.button>

                <p className="text-center text-[9px] text-[#71717A] font-mono select-none">
                  Press ⌘ + Enter to queue parameters
                </p>
              </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: Active FAQ Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.2,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="lg:col-span-3 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h2 className="font-mono text-[10px] font-semibold text-[#71717A] tracking-wider uppercase">
                  ACTIVE DEPLOYED KNOWLEDGE
                </h2>
                {faqs.length > 0 && (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#121214] text-[#71717A] border border-[#27272A] tabular-nums">
                    {faqs.length}
                  </span>
                )}
              </div>
            </div>

            {/* List View */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="skeleton"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <KnowledgeSkeleton />
                </motion.div>
              ) : faqs.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35 }}
                  className="flex flex-col items-center justify-center py-20 px-8 text-center bg-[#121214] rounded-2xl border border-dashed border-[#27272A] select-none"
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#09090B] border border-[#27272A] flex items-center justify-center text-[#71717A] mb-5 shadow-inner">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <h3 className="text-[#F4F4F5] font-semibold text-xs font-sans">
                    No active parameters found
                  </h3>
                  <p className="text-[#71717A] text-[11px] mt-1 max-w-[320px] leading-relaxed mx-auto">
                    Submit your first trigger-response pair on the left to teach LeadFlow how to navigate customer inquiries.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  <AnimatePresence initial={false}>
                    {faqs.map((faq, idx) => (
                      <FAQCard
                        key={faq.id}
                        faq={faq}
                        onDelete={handleDelete}
                        index={idx}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Floating Bottom Action Banner */}
      <AnimatePresence>
        {isFormDirty && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
            className="fixed bottom-6 inset-x-0 md:left-72 md:right-8 z-40 flex items-center justify-center px-4"
          >
            <div className="bg-[#1C1C1F] border border-amber-500/20 shadow-2xl rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-3xl w-full">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#F4F4F5]">
                    ⚠️ Unsaved parameter modifications detected
                  </h3>
                  <p className="text-[10px] text-[#71717A] font-sans mt-0.5">
                    You have entered trigger details that are not yet committed to live database vectors.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setNewQuestion("");
                    setNewAnswer("");
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-[#27272A] text-[11px] text-[#71717A] hover:bg-white/[0.02] hover:text-[#F4F4F5] transition-colors duration-150 cursor-pointer"
                >
                  Discard
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAdd}
                  disabled={!canSubmit || isSubmitting}
                  className={`px-3.5 py-1.5 rounded-xl text-[11px] font-semibold transition-colors duration-150 cursor-pointer ${
                    canSubmit && !isSubmitting
                      ? "bg-[#6366F1] text-white hover:bg-[#4F46E5]"
                      : "bg-[#27272A] text-[#71717A] cursor-not-allowed"
                  }`}
                >
                  Deploy to Live Agent
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast
        show={toast.show}
        message={toast.message}
        variant={toast.variant}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </>
  );
}
