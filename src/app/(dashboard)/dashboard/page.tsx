"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  BarChart,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

// ─── Types ──────────────────────────────────────────────────────────
interface Lead {
  id: string;
  customer_name: string;
  customer_phone: string;
  service_requested: string | null;
  urgency: "low" | "medium" | "high";
  kanban_stage: "new" | "contacted" | "converted" | "lost";
  created_at: string;
  isNew?: boolean;
}

// ─── Helpers ────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  }) +
    " · " +
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
}

// Urgency badge configuration
const urgencyConfig = {
  high: {
    bg: "var(--color-danger-bg)",
    text: "var(--color-danger-text)",
    label: "High",
  },
  medium: {
    bg: "var(--color-warning-bg)",
    text: "var(--color-warning-text)",
    label: "Medium",
  },
  low: {
    bg: "var(--color-success-bg)",
    text: "var(--color-success-text)",
    label: "Low",
  },
};

// Stage badge configuration (border-only style)
const stageConfig = {
  new: {
    border: "var(--brand-primary)",
    text: "var(--brand-primary)",
    label: "New",
  },
  contacted: {
    border: "var(--warning-icon)",
    text: "var(--warning-text)",
    label: "Contacted",
  },
  converted: {
    border: "var(--success-icon)",
    text: "var(--color-success-text)",
    label: "Converted",
  },
  lost: {
    border: "var(--border-default)",
    text: "var(--text-tertiary)",
    label: "Lost",
  },
};

// ─── Row Skeleton Loader ─────────────────────────────────────────────
function SkeletonRow({ index }: { index: number }) {
  const rowWidths = [
    ["w-20", "w-24", "w-28", "w-32", "w-16", "w-20"],
    ["w-24", "w-20", "w-32", "w-24", "w-16", "w-16"],
    ["w-16", "w-28", "w-24", "w-28", "w-20", "w-20"],
  ];
  const widths = rowWidths[index % rowWidths.length];

  return (
    <tr className="border-b border-[var(--border-subtle)] h-[52px] bg-[var(--bg-surface)]">
      {widths.map((w, idx) => (
        <td key={idx} className="px-3 py-3.5">
          <div className={`h-3 rounded-[var(--radius-sm)] bg-[var(--bg-muted)] animate-pulse ${w}`} />
        </td>
      ))}
    </tr>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function LeadsDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const { info } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncTime, setSyncTime] = useState<string>("0s");
  const [lastSyncSeconds, setLastSyncSeconds] = useState(0);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  const handleUpdateStage = async (id: string, nextStage: "new" | "contacted" | "converted" | "lost") => {
    setLeads((current) =>
      current.map((l) => (l.id === id ? { ...l, kanban_stage: nextStage } : l))
    );
    const { error } = await supabase
      .from("leads")
      .update({ kanban_stage: nextStage })
      .eq("id", id);
    if (error) {
      console.error("[Stage Update Error]:", error.message);
      info("Failed to update status");
    } else {
      info(`Lead moved to ${nextStage}`);
    }
  };

  // Stats
  const totalLeads = leads.length;
  const highUrgencyCount = leads.filter((l) => l.urgency === "high").length;

  const newThisWeek = leads.filter((l) => {
    const createdDate = new Date(l.created_at);
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return createdDate >= oneWeekAgo;
  }).length;

  const conversionRate = totalLeads > 0
    ? Math.round((leads.filter((l) => l.kanban_stage === "converted").length / totalLeads) * 100)
    : 0;

  // Sync time counter
  useEffect(() => {
    const timer = setInterval(() => {
      setLastSyncSeconds((prev) => {
        const next = prev + 1;
        setSyncTime(`${next}s ago`);
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    document.title = "Leads Dashboard | LeadFlow";

    async function fetchLeads() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching leads:", error.message);
      } else {
        setLeads((data as Lead[]) || []);
      }
      setIsLoading(false);
      setLastSyncSeconds(0);
      setSyncTime("Just now");
    }

    fetchLeads();

    // Supabase realtime subscriptions
    const channel = supabase
      .channel("realtime-leads-crm")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload) => {
          const newLead = { ...payload.new as Lead, isNew: true };
          setLeads((current) => [newLead, ...current]);
          setLastSyncSeconds(0);
          setSyncTime("Just now");
          info(`New prospect captured: ${newLead.customer_name}`);
          setTimeout(() => {
            setLeads((current) =>
              current.map((l) => l.id === newLead.id ? { ...l, isNew: false } : l)
            );
          }, 4000);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads" },
        (payload) => {
          setLeads((current) =>
            current.map((lead) =>
              lead.id === payload.new.id ? (payload.new as Lead) : lead
            )
          );
          setLastSyncSeconds(0);
          setSyncTime("Just now");
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "leads" },
        (payload) => {
          setLeads((current) => current.filter((l) => l.id !== payload.old.id));
          setLastSyncSeconds(0);
          setSyncTime("Just now");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ─── Stat Card Component ──────────────────────
  const StatCard = ({ icon: Icon, label, value, iconColor }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    iconColor: string;
  }) => (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-4 hover:shadow-[var(--shadow-md)] hover:border-[var(--border-strong)]" style={{ transition: "box-shadow 200ms ease, border-color 200ms ease" }}>
      <div className="flex items-center justify-between mb-3 select-none">
        <span className="text-[12px] font-sans font-medium text-[var(--text-secondary)] uppercase tracking-[0.5px]">
          {label}
        </span>
        <Icon className="w-5 h-5 shrink-0" style={{ color: iconColor }} />
      </div>
      <h2 className="font-display text-[28px] font-semibold text-[var(--text-primary)] leading-none select-text">
        {isLoading ? "..." : value}
      </h2>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto px-6 py-6 bg-[var(--bg-canvas)] select-none space-y-4">

      {/* ─── Stats Header Row ────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total Captured" value={totalLeads} iconColor="var(--brand-primary)" />
        <StatCard icon={TrendingUp} label="New This Week" value={newThisWeek} iconColor="var(--brand-primary)" />
        <StatCard icon={AlertTriangle} label="High Urgency" value={highUrgencyCount} iconColor="var(--danger-icon)" />
        <StatCard icon={BarChart} label="Converted" value={`${conversionRate}%`} iconColor="var(--success-icon)" />
      </div>

      {/* ─── LIVE ENGINE STATUS BAR ────────────────────── */}
      <div className="h-9 bg-[var(--bg-subtle)] rounded-[var(--radius-md)] px-4 flex items-center justify-between select-none border border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success-icon)] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--success-icon)]"></span>
          </span>
          <span className="text-[11px] font-mono font-bold text-[var(--color-success-text)] tracking-[1px] uppercase">
            LIVE ENGINE ACTIVE
          </span>
        </div>
        <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
          Auto-updating · Last sync {syncTime}
        </span>
      </div>

      {/* ─── View Toggle ─────────────────────────── */}
      <div className="flex items-center justify-between shrink-0 select-none pb-1 pt-1">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] font-display flex items-center gap-1.5">
          Prospects CRM
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--brand-subtle)] text-[var(--brand-primary)] border border-[var(--brand-border)] select-none">
            {leads.length} captured
          </span>
        </h3>

        <div className="flex bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-0.5">
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1 text-xs font-semibold rounded-[var(--radius-sm)] cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--brand-primary)] ${
              viewMode === "table"
                ? "bg-[var(--brand-primary)] text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Data Table
          </button>
          <button
            onClick={() => setViewMode("kanban")}
            className={`px-3 py-1 text-xs font-semibold rounded-[var(--radius-sm)] cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--brand-primary)] ${
              viewMode === "kanban"
                ? "bg-[var(--brand-primary)] text-white shadow-xs"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Kanban Board
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        /* ─── TABLE VIEW ─────────────────────────────── */
        <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] overflow-hidden select-none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr className="h-10 bg-[var(--bg-subtle)]">
                  <th className="px-3 text-left font-sans text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] w-[140px] border-b border-[var(--border-subtle)]">
                    Date / Time
                  </th>
                  <th className="px-3 text-left font-sans text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] w-[180px] border-b border-[var(--border-subtle)]">
                    Customer
                  </th>
                  <th className="px-3 text-left font-sans text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] border-b border-[var(--border-subtle)]">
                    Service Requested
                  </th>
                  <th className="px-3 text-left font-sans text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] w-[100px] border-b border-[var(--border-subtle)]">
                    Urgency
                  </th>
                  <th className="px-3 text-left font-sans text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] w-[120px] border-b border-[var(--border-subtle)]">
                    Status
                  </th>
                  <th className="px-3 text-left font-sans text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] w-[80px] border-b border-[var(--border-subtle)]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="select-text">
                {isLoading ? (
                  [...Array(4)].map((_, i) => <SkeletonRow key={i} index={i} />)
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center select-none">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="w-12 h-12 text-[var(--text-tertiary)] mb-4" />
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] font-sans">
                          No leads captured yet
                        </h3>
                        <p className="text-[var(--text-secondary)] text-xs mt-1 max-w-[280px] leading-relaxed mx-auto">
                          The AI will automatically extract and list leads from WhatsApp conversations here.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence initial={false}>
                    {leads.map((lead) => {
                      const urg = urgencyConfig[lead.urgency] || urgencyConfig.medium;
                      const stage = stageConfig[lead.kanban_stage] || stageConfig.new;

                      return (
                        <motion.tr
                          key={lead.id}
                          layout
                          initial={{ opacity: 0, y: -8 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{
                            opacity: { duration: 0.3 },
                            y: { type: "spring", stiffness: 350, damping: 25 },
                          }}
                          className={`h-[52px] hover:bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] group relative ${
                            lead.isNew ? "animate-row-highlight" : ""
                          }`}
                          style={{ backgroundColor: "var(--bg-surface)" }}
                        >
                          <td className="px-3 py-2">
                            <span className="font-mono text-[13px] text-[var(--text-secondary)] whitespace-nowrap">
                              {formatDate(lead.created_at)}
                            </span>
                          </td>

                          <td className="px-3 py-2">
                            <div className="min-w-0 pr-2">
                              <p className="text-[14px] font-sans font-medium text-[var(--text-primary)] truncate">
                                {lead.customer_name || "Prospect User"}
                              </p>
                              <p className="text-[12px] text-[var(--text-tertiary)] font-mono truncate mt-0.5">
                                {lead.customer_phone}
                              </p>
                            </div>
                          </td>

                          <td className="px-3 py-2">
                            <span className="text-[13px] text-[var(--text-primary)] font-sans leading-relaxed">
                              {lead.service_requested || (
                                <span className="text-[var(--text-tertiary)] italic font-mono select-none">—</span>
                              )}
                            </span>
                          </td>

                          <td className="px-3 py-2 select-none">
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-full font-sans text-[11px] font-semibold"
                              style={{
                                backgroundColor: urg.bg,
                                color: urg.text,
                              }}
                            >
                              {urg.label}
                            </span>
                          </td>

                          <td className="px-3 py-2 select-none">
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-full font-sans text-[11px] font-medium bg-transparent"
                              style={{
                                border: `1.5px solid ${stage.border}`,
                                color: stage.text,
                              }}
                            >
                              {stage.label}
                            </span>
                          </td>

                          <td className="px-3 py-2 select-none">
                            <button
                              onClick={() => {
                                info(`Navigating to conversation for ${lead.customer_name}`);
                                router.push(`/inbox`);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-[var(--bg-subtle)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer outline-none focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-[var(--brand-primary)]"
                              aria-label="Open conversation"
                            >
                              <ExternalLink className="w-[16px] h-[16px]" />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ─── KANBAN VIEW ─────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none pb-6">
          {(["new", "contacted", "converted", "lost"] as const).map((stageKey) => {
            const columnLeads = leads.filter((l) => l.kanban_stage === stageKey);
            const colConfig = {
              new: { title: "New Leads", color: "var(--brand-primary)" },
              contacted: { title: "Contacted", color: "var(--warning-icon)" },
              converted: { title: "Converted", color: "var(--success-icon)" },
              lost: { title: "Lost", color: "var(--text-tertiary)" },
            }[stageKey];

            return (
              <div
                key={stageKey}
                className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-3 flex flex-col min-h-[450px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3.5 px-1 shrink-0">
                  <h4 className="text-xs font-semibold text-[var(--text-primary)] uppercase tracking-wide font-display flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colConfig.color }} />
                    {colConfig.title}
                  </h4>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                    {columnLeads.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5 select-text">
                  {isLoading ? (
                    [...Array(2)].map((_, idx) => (
                      <div key={idx} className="h-32 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] animate-shimmer" />
                    ))
                  ) : columnLeads.length === 0 ? (
                    <div className="border border-dashed border-[var(--border-subtle)] rounded-[var(--radius-md)] py-8 text-center text-[10px] font-sans text-[var(--text-tertiary)] select-none">
                      No prospects in this stage
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {columnLeads.map((lead) => {
                        const urg = urgencyConfig[lead.urgency] || urgencyConfig.medium;
                        const stagesArray = ["new", "contacted", "converted", "lost"] as const;
                        const currentIdx = stagesArray.indexOf(lead.kanban_stage);

                        return (
                          <motion.div
                            key={lead.id}
                            layout
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-3.5 relative group flex flex-col gap-2.5 hover:shadow-[var(--shadow-md)] hover:border-[var(--border-strong)]"
                          >
                            <div className="flex items-center justify-between shrink-0 select-none">
                              <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                                {formatDate(lead.created_at).split(" · ")[0]}
                              </span>
                              <span
                                className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide uppercase"
                                style={{ backgroundColor: urg.bg, color: urg.text }}
                              >
                                {urg.label}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <h5 className="text-[13px] font-semibold font-sans text-[var(--text-primary)] truncate">
                                {lead.customer_name || "Prospect User"}
                              </h5>
                              <p className="text-[11px] font-mono text-[var(--text-secondary)] mt-0.5">
                                {lead.customer_phone}
                              </p>
                            </div>

                            {lead.service_requested ? (
                              <div className="bg-[var(--bg-subtle)] px-2 py-1.5 rounded-[var(--radius-sm)] text-[11px] font-sans text-[var(--text-secondary)] leading-relaxed border border-[var(--border-subtle)]">
                                {lead.service_requested}
                              </div>
                            ) : (
                              <div className="text-[11px] italic font-sans text-[var(--text-tertiary)] select-none">
                                No service specified
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-1 pt-2 border-t border-[var(--border-subtle)] shrink-0 select-none">
                              <button
                                onClick={() => {
                                  info(`Navigating to conversation for ${lead.customer_name}`);
                                  router.push(`/inbox`);
                                }}
                                className="text-[11px] font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] flex items-center gap-1 cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--brand-primary)]"
                              >
                                <MessageSquareIcon className="w-3 h-3" />
                                Open Chat
                              </button>

                              <div className="flex gap-1">
                                {currentIdx > 0 && (
                                  <button
                                    onClick={() => handleUpdateStage(lead.id, stagesArray[currentIdx - 1])}
                                    title="Move stage back"
                                    className="w-5 h-5 flex items-center justify-center bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded text-xs cursor-pointer font-bold text-[var(--text-secondary)]"
                                    aria-label="Move stage back"
                                  >
                                    ←
                                  </button>
                                )}
                                {currentIdx < stagesArray.length - 1 && (
                                  <button
                                    onClick={() => handleUpdateStage(lead.id, stagesArray[currentIdx + 1])}
                                    title="Promote stage"
                                    className="w-5 h-5 flex items-center justify-center bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded text-xs cursor-pointer font-bold text-[var(--text-secondary)]"
                                    aria-label="Promote stage"
                                  >
                                    →
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

// Small inline icon for Kanban chat button
function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
