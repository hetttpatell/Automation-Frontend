"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Brain,
  Upload,
  Trash2,
  Loader2,
  ChevronDown,
  Clock,
  Database,
  Check,
  HelpCircle,
  MessageSquareText,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/Toast";

// ─── Interfaces ────────────────────────────────────────────────────
interface FAQ {
  id: string;
  question: string;
  answer: string;
  created_at?: string;
}

// ─── Loading Skeletons ───────────────────────────────────────────────
function KnowledgeSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-[var(--bg-surface)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] h-14 animate-shimmer"
        />
      ))}
    </div>
  );
}

// ─── FAQ Accordion Card Component ──────────────────────────
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

  // Format index as two digit (01, 02...)
  const formattedIndex = String(index + 1).padStart(2, "0");

  return (
    <div
      className="bg-[var(--bg-surface)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] hover:border-[var(--border-brand)] hover:shadow-[var(--shadow-sm)] overflow-hidden relative group"
      style={{
        borderColor: isExpanded ? "var(--border-brand)" : undefined,
        boxShadow: isExpanded ? "var(--shadow-sm)" : "none",
        transition: "border-color 150ms ease, box-shadow 150ms ease"
      }}
    >
      {/* Question Collapsed Header Row (56px tall) */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full h-14 px-4 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-[var(--bg-subtle)]"
        style={{ transition: "background-color 150ms ease" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Index Badge */}
          <span className="font-mono text-[11px] font-bold text-[var(--brand-primary)] bg-[var(--brand-subtle)] min-w-[26px] h-[22px] flex items-center justify-center rounded-[var(--radius-sm)] select-none">
            {formattedIndex}
          </span>
          {/* Question Title */}
          <span className="text-[14px] font-sans font-medium text-[var(--text-primary)] truncate pr-4">
            {faq.question}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Trash Action */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(faq.id);
            }}
            className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1.5 rounded-md hover:bg-rose-500/10 text-[var(--text-tertiary)] hover:text-[var(--danger-icon)] cursor-pointer"
            style={{ transition: "opacity 150ms ease, color 150ms ease, background-color 150ms ease" }}
            aria-label="Delete FAQ"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          
          <ChevronDown 
            className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" 
            style={{
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 200ms ease"
            }}
          />
        </div>
      </div>

      {/* Expanded body (Framer Motion spring transition) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="overflow-hidden border-t border-[var(--border-subtle)]"
          >
            <div className="p-3.5 bg-transparent space-y-3 select-text">
              <div className="space-y-1">
                <p className="text-[10px] font-mono font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Trigger Question</p>
                <div className="bg-[var(--bg-subtle)] px-3 py-2.5 rounded-[var(--radius-sm)]">
                  <p className="text-[13px] font-sans font-medium text-[var(--text-primary)] leading-relaxed select-text">
                    {faq.question}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono font-bold text-[var(--text-tertiary)] uppercase tracking-wider">AI Response Payload</p>
                <div className="bg-[var(--bg-subtle)] px-3 py-2.5 rounded-[var(--radius-sm)] font-mono text-[13px] leading-[1.6] select-text text-[var(--text-secondary)] whitespace-pre-wrap">
                  {faq.answer}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page Component ───────────────────────────────────────────
export default function KnowledgeBasePage() {
  const supabase = createClient();
  const { success: toastSuccess, error: toastError } = useToast();

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);
  
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"deployed" | "train">("deployed");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.title = "Knowledge Base | LeadFlow";
  }, []);

  // Fetch FAQ arrays on mount
  useEffect(() => {
    async function fetchFAQs() {
      setIsLoading(true);

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user || !user.email) {
        console.error("[KB Auth Error]:", authError?.message || "No user or email found");
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
          toastError("Failed to load knowledge entries");
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
    if (!newQuestion.trim() || !newAnswer.trim() || !tenantId || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("knowledge_base")
        .insert({
          tenant_id: tenantId,
          question: newQuestion.trim(),
          answer: newAnswer.trim(),
        })
        .select("id, question, answer, created_at")
        .single();

      if (error) throw error;

      if (data) {
        setFaqs((prev) => [data as FAQ, ...prev]);
        setNewQuestion("");
        setNewAnswer("");
        
        // Trigger deploy success animation and toast success
        setDeploySuccess(true);
        toastSuccess("Knowledge deployed successfully");
        setTimeout(() => setDeploySuccess(false), 1500);
      }
    } catch (err: any) {
      console.error("[KB Insert Error]:", err.message);
      toastError("Failed to deploy knowledge entry");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Delete Q&A Pair
  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from("knowledge_base")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setFaqs((prev) => prev.filter((faq) => faq.id !== id));
      toastSuccess("Knowledge entry removed");
    } catch (err: any) {
      console.error("[KB Delete Error]:", err.message);
      toastError("Failed to delete entry");
    }
  }

  const isFormDirty = newQuestion.trim().length > 0 || newAnswer.trim().length > 0;
  const canSubmit = newQuestion.trim().length > 0 && newAnswer.trim().length > 0;

  return (
    <div className="h-[calc(100vh-7rem)] lg:h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden bg-[var(--bg-canvas)]">
      {/* Segmented Control for Mobile */}
      {isMobile && (
        <div className="p-3 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] shrink-0 select-none">
          <div className="flex bg-[var(--bg-subtle)] p-1 rounded-lg border border-[var(--border-subtle)]">
            <button
              onClick={() => setActiveTab("deployed")}
              className={`flex-1 py-2 text-center text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${
                activeTab === "deployed"
                  ? "bg-[var(--bg-surface)] text-[var(--brand-primary)] shadow-sm font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Deployed Knowledge ({faqs.length})
            </button>
            <button
              onClick={() => setActiveTab("train")}
              className={`flex-1 py-2 text-center text-xs font-medium rounded-md transition-all duration-200 cursor-pointer ${
                activeTab === "train"
                  ? "bg-[var(--bg-surface)] text-[var(--brand-primary)] shadow-sm font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Train AI
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* ─── LEFT PANEL: Training Form (420px) ────────────────────────── */}
        <aside className={`${
          isMobile 
            ? activeTab === "train" ? "flex w-full" : "hidden" 
            : "w-[420px] flex"
        } border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] flex-col h-full shrink-0 select-none relative`}>
          
          {/* Header Form (52px tall) */}
          <div className="h-[52px] px-5 flex flex-col justify-center border-b border-[var(--border-subtle)] shrink-0">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)] font-display">
            Train the AI Brain
          </h2>
          <p className="text-[12px] text-[var(--text-secondary)] font-sans mt-0.5 leading-none">
            Inject precise Q&A context
          </p>
        </div>

        {/* Form Body Fields (padding 20px, gap 20px) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Question Trigger Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between select-none">
              <label
                htmlFor="kb-question"
                className="text-[11px] font-mono font-bold text-[var(--text-tertiary)] uppercase tracking-[0.6px] flex items-center gap-1.5"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                Customer Trigger Question
              </label>
              <span 
                className="text-[11px] font-mono select-none"
                style={{
                  color: newQuestion.length > 180 ? "var(--danger-icon)" : "var(--text-tertiary)"
                }}
              >
                {newQuestion.length} / 200
              </span>
            </div>
            <input
              id="kb-question"
              type="text"
              maxLength={200}
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder='e.g. "Where are you located?"'
              className="w-full h-10 px-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[14px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] font-sans focus:outline-none focus:border-[var(--brand-primary)] focus:shadow-[var(--shadow-focus)] hover:border-[var(--border-strong)]"
              style={{ transition: "border-color 150ms ease, box-shadow 150ms ease" }}
            />
          </div>

          {/* AI Response Textarea Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between select-none">
              <label
                htmlFor="kb-answer"
                className="text-[11px] font-mono font-bold text-[var(--text-tertiary)] uppercase tracking-[0.6px] flex items-center gap-1.5"
              >
                <MessageSquareText className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                AI Response Payload
              </label>
              <span className="text-[11px] font-mono text-[var(--text-tertiary)] select-none">
                {newAnswer.length} chars
              </span>
            </div>
            <textarea
              id="kb-answer"
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="Write the exact response the AI should give..."
              rows={6}
              maxLength={1000}
              className="w-full px-3 py-[10px] bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[13px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] font-mono leading-[1.55] resize-none focus:outline-none focus:border-[var(--brand-primary)] focus:shadow-[var(--shadow-focus)] hover:border-[var(--border-strong)]"
              style={{ height: "130px", transition: "border-color 150ms ease, box-shadow 150ms ease" }}
            />
          </div>

          {/* Render Actions in Layout Header Portal (Desktop) or Inline (Mobile) */}
          {mounted && typeof document !== "undefined" ? (
            !isMobile ? (
              document.getElementById("header-cta-portal") ? (
                createPortal(
                  <button
                    onClick={handleAdd}
                    disabled={isSubmitting || !canSubmit}
                    className={`h-9 px-4 rounded-[var(--radius-md)] text-[13px] font-display font-medium flex items-center justify-center gap-1.5 select-none active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed transition-all duration-150 ${
                      deploySuccess 
                        ? "bg-[var(--success-icon)] text-white" 
                        : canSubmit && !isSubmitting
                          ? "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] shadow-[var(--shadow-sm)]"
                          : "bg-[var(--bg-muted)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]"
                    }`}
                    style={{
                      pointerEvents: isSubmitting ? "none" : "auto"
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="dual-ring-spinner shrink-0" />
                        <span>Deploying...</span>
                      </>
                    ) : deploySuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>Deployed!</span>
                      </>
                    ) : (
                      <>
                        <Brain className="w-3.5 h-3.5 shrink-0" />
                        <span>Deploy to Live Brain</span>
                      </>
                    )}
                  </button>,
                  document.getElementById("header-cta-portal")!
                )
              ) : null
            ) : (
              <div className="pt-2">
                <button
                  onClick={handleAdd}
                  disabled={isSubmitting || !canSubmit}
                  className={`w-full h-11 rounded-[var(--radius-md)] text-[14px] font-display font-medium flex items-center justify-center gap-1.5 select-none active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed transition-all duration-150 ${
                    deploySuccess 
                      ? "bg-[var(--success-icon)] text-white" 
                      : canSubmit && !isSubmitting
                        ? "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] shadow-[var(--shadow-sm)]"
                        : "bg-[var(--bg-muted)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]"
                  }`}
                  style={{
                    pointerEvents: isSubmitting ? "none" : "auto"
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <span className="dual-ring-spinner shrink-0" />
                      <span>Deploying...</span>
                    </>
                  ) : deploySuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Deployed!</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-3.5 h-3.5 shrink-0" />
                      <span>Deploy to Live Brain</span>
                    </>
                  )}
                </button>
              </div>
            )
          ) : null}
        </div>

        {/* Sticky Unsaved Changes Banner */}
        <AnimatePresence>
          {isFormDirty && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className="absolute bottom-0 inset-x-0 bg-[var(--warning-bg)] border-t border-[var(--warning-border)] p-4 flex items-center justify-between z-20 shadow-md select-none"
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[var(--warning-icon)] shrink-0" />
                <span className="text-[13px] font-medium text-[var(--warning-text)]">
                  Unsaved changes
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setNewQuestion("");
                    setNewAnswer("");
                  }}
                  className="px-3 h-8 rounded-[var(--radius-md)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] cursor-pointer outline-none font-sans"
                  style={{ transition: "color 150ms ease, background-color 150ms ease" }}
                >
                  Discard
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!canSubmit || isSubmitting}
                  className="px-3 h-8 rounded-[var(--radius-md)] text-[13px] font-medium cursor-pointer outline-none font-sans bg-[var(--warning-icon)] hover:bg-[var(--warning-text)] text-white disabled:bg-[var(--bg-muted)] disabled:text-[var(--text-tertiary)] disabled:cursor-not-allowed"
                  style={{ transition: "background-color 150ms ease" }}
                >
                  Deploy
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>

      {/* ─── RIGHT PANEL: Active Catalog List ─────────────────────────── */}
      <section className={`${
        isMobile
          ? activeTab === "deployed" ? "flex w-full" : "hidden"
          : "flex-1 flex"
      } flex-col h-full bg-[var(--bg-canvas)] select-none`}>
        
        {/* Header Deployed Catalog (52px tall) */}
        <div className="h-[52px] px-5 flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0 shadow-sm z-10">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)] font-display">
            Deployed Knowledge
          </h2>
          {faqs.length > 0 && (
            <span className="text-[12px] font-medium px-[10px] py-1.5 rounded-full bg-[var(--brand-subtle)] text-[var(--brand-primary)] border border-[var(--brand-border)]">
              {faqs.length} entries
            </span>
          )}
        </div>

        {/* Accordions Stack */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 select-none">
          {isLoading ? (
            <KnowledgeSkeleton />
          ) : faqs.length === 0 ? (
            /* Empty Catalog state */
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center h-full select-none">
              <Brain className="w-12 h-12 text-[var(--text-tertiary)] mb-2" />
              <h3 className="text-[16px] font-semibold text-[var(--text-primary)] font-display">
                No knowledge deployed yet
              </h3>
              <p className="text-[14px] text-[var(--text-secondary)] mt-1 max-w-[280px] leading-relaxed mx-auto">
                Train the AI brain using the form on the left.
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {faqs.map((faq, index) => (
                <FAQCard
                  key={faq.id}
                  faq={faq}
                  onDelete={handleDelete}
                  index={index}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </section>

      </div>
    </div>
  );
}
