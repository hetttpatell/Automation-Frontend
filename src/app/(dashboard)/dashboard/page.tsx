"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
import Avatar from "@/components/ui/Avatar";

// ─── Types ──────────────────────────────────────────────────────────
interface Lead {
  id: string;
  customer_name: string;
  customer_phone: string;
  service_requested: string | null;
  urgency: "low" | "medium" | "high";
  kanban_stage: "new" | "contacted" | "converted" | "lost" | "completed";
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

function formatPhoneNumber(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    return `+91 ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  if (cleaned.startsWith("1") && cleaned.length === 11) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length > 10) {
    return `+${cleaned.slice(0, cleaned.length - 10)} ${cleaned.slice(cleaned.length - 10, cleaned.length - 5)} ${cleaned.slice(cleaned.length - 5)}`;
  }
  return phone;
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
  completed: {
    border: "#8B5CF6",
    text: "#8B5CF6",
    label: "Completed",
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
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncTime, setSyncTime] = useState<string>("0s");
  const [lastSyncSeconds, setLastSyncSeconds] = useState(0);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  
  // New interactive and filtering states
  const [urgencyFilter, setUrgencyFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [draggedOverStage, setDraggedOverStage] = useState<string | null>(null);

  // Custom portal dropdown states
  const [activeDropdownLead, setActiveDropdownLead] = useState<Lead | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const handleClose = () => {
      setActiveDropdownLead(null);
      setDropdownPosition(null);
    };
    window.addEventListener("resize", handleClose);
    window.addEventListener("scroll", handleClose, true);
    return () => {
      window.removeEventListener("resize", handleClose);
      window.removeEventListener("scroll", handleClose, true);
    };
  }, []);

  const handleToggleDropdown = (e: React.MouseEvent<HTMLButtonElement>, lead: Lead) => {
    e.stopPropagation();
    if (activeDropdownLead?.id === lead.id) {
      setActiveDropdownLead(null);
      setDropdownPosition(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setActiveDropdownLead(lead);
      setDropdownPosition({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  const handleUpdateStage = async (id: string, nextStage: "new" | "contacted" | "converted" | "lost" | "completed") => {
    const leadToUpdate = leads.find((l) => l.id === id);
    if (!leadToUpdate || !user) return;
    const originalStage = leadToUpdate.kanban_stage;

    // Optimistic update on the UI
    setLeads((current) =>
      current.map((l) => (l.id === id ? { ...l, kanban_stage: nextStage } : l))
    );

    const { error } = await supabase
      .from("leads")
      .update({ kanban_stage: nextStage })
      .eq("id", id)
      .eq("tenant_id", user.id);

    if (error) {
      console.error("[Stage Update Error]:", error.message);
      info("Failed to update status");
      // Rollback to original stage if database mutation fails
      setLeads((current) =>
        current.map((l) => (l.id === id ? { ...l, kanban_stage: originalStage } : l))
      );
    } else {
      info(`Lead moved to ${nextStage}`);
    }
  };

  // Filter leads based on selected urgency
  const filteredLeads = urgencyFilter === "all"
    ? leads
    : leads.filter((l) => l.urgency === urgencyFilter);

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
    async function initUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
      } else {
        setIsLoading(false);
      }
    }
    initUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    document.title = "Leads Dashboard | LeadFlow";

    async function fetchLeads() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("tenant_id", user.id)
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
        { event: "INSERT", schema: "public", table: "leads", filter: `tenant_id=eq.${user.id}` },
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
        { event: "UPDATE", schema: "public", table: "leads", filter: `tenant_id=eq.${user.id}` },
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
  }, [user]);

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

      {/* ─── View Toggle & Filter Row ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0 select-none pb-1 pt-1">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] font-display flex items-center gap-1.5">
          Prospects CRM
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[var(--brand-subtle)] text-[var(--brand-primary)] border border-[var(--brand-border)] select-none">
            {filteredLeads.length} {filteredLeads.length !== leads.length ? `of ${leads.length}` : ""} captured
          </span>
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter by Urgency */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--text-secondary)] font-sans">
              Filter by Urgency:
            </span>
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value as "all" | "high" | "medium" | "low")}
              className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] cursor-pointer hover:border-[var(--border-strong)] transition-all"
            >
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* View Toggle */}
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
      </div>

      {viewMode === "table" ? (
        /* ─── TABLE VIEW ─────────────────────────────── */
        <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] overflow-hidden select-none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] table-fixed" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr className="h-10 bg-[var(--bg-subtle)]">
                  <th className="px-3 text-left font-sans text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] w-[140px] border-b border-[var(--border-subtle)]">
                    Date / Time
                  </th>
                  <th className="px-3 text-left font-sans text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] w-[200px] border-b border-[var(--border-subtle)]">
                    Lead
                  </th>
                  <th className="px-3 text-left font-sans text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] border-b border-[var(--border-subtle)]">
                    Service Requested
                  </th>
                  <th className="px-3 text-left font-sans text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] w-[90px] border-b border-[var(--border-subtle)]">
                    Urgency
                  </th>
                  <th className="px-3 text-left font-sans text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] w-[110px] border-b border-[var(--border-subtle)]">
                    Status
                  </th>
                  <th className="px-3 text-left font-sans text-[12px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] w-[100px] border-b border-[var(--border-subtle)]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="select-text">
                {isLoading ? (
                  [...Array(4)].map((_, i) => <SkeletonRow key={i} index={i} />)
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center select-none">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="w-12 h-12 text-[var(--text-tertiary)] mb-4" />
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] font-sans">
                          {leads.length === 0 ? "No leads captured yet" : "No matching leads"}
                        </h3>
                        <p className="text-[var(--text-secondary)] text-xs mt-1 max-w-[280px] leading-relaxed mx-auto">
                          {leads.length === 0 
                            ? "The AI will automatically extract and list leads from WhatsApp conversations here."
                            : "No leads found matching the selected urgency filter."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <AnimatePresence initial={false}>
                    {filteredLeads.map((lead) => {
                      const urg = urgencyConfig[lead.urgency] || urgencyConfig.medium;
                      const stage = stageConfig[lead.kanban_stage] || stageConfig.new;

                      return (
                        <motion.tr
                          key={lead.id}
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
                          <td className="px-3 py-2 w-[140px]">
                            <span className="font-mono text-[13px] text-[var(--text-secondary)] whitespace-nowrap">
                              {formatDate(lead.created_at)}
                            </span>
                          </td>

                          <td className="px-3 py-2 w-[200px]">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar name={lead.customer_name || lead.customer_phone} size="sm" />
                              <div className="min-w-0">
                                <p className="text-[14px] font-sans font-medium text-[var(--text-primary)] truncate">
                                  {lead.customer_name || "Prospect User"}
                                </p>
                                <p className="text-[12px] text-[var(--text-tertiary)] font-mono truncate mt-0.5">
                                  {formatPhoneNumber(lead.customer_phone)}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-3 py-2">
                            <span className="text-[13px] text-[var(--text-primary)] font-sans leading-relaxed truncate block">
                              {lead.service_requested || (
                                <span className="text-[var(--text-tertiary)] italic font-mono select-none">—</span>
                              )}
                            </span>
                          </td>

                          <td className="px-3 py-2 select-none w-[90px]">
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

                          <td className="px-3 py-2 w-[110px]">
                            <button
                              onClick={(e) => handleToggleDropdown(e, lead)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-sans text-[11px] font-medium bg-transparent hover:bg-[var(--bg-subtle)] border transition-all active:scale-[0.98] cursor-pointer"
                              style={{
                                borderColor: stage.border,
                                color: stage.text,
                              }}
                              aria-haspopup="true"
                              aria-expanded={activeDropdownLead?.id === lead.id}
                            >
                              <span>{stage.label}</span>
                              <svg
                                className="w-2.5 h-2.5 opacity-70 transition-transform duration-200"
                                style={{ transform: activeDropdownLead?.id === lead.id ? "rotate(180deg)" : "rotate(0)" }}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth="2.5"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </td>

                          <td className="px-3 py-2 select-none w-[100px]">
                            <button
                              onClick={() => {
                                info(`Navigating to conversation for ${lead.customer_name || lead.customer_phone}`);
                                router.push(`/inbox?phone=${lead.customer_phone}`);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-[var(--brand-primary)] hover:bg-[var(--brand-subtle)] cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[var(--brand-primary)] transition-all active:scale-[0.97]"
                              aria-label="Open conversation"
                            >
                              <MessageSquareIcon className="w-3.5 h-3.5" />
                              <span>Open Chat</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 select-none pb-6">
          {(["new", "contacted", "converted", "lost", "completed"] as const).map((stageKey) => {
            const columnLeads = filteredLeads.filter((l) => l.kanban_stage === stageKey);
            const colConfig = {
              new: { title: "New Leads", color: "var(--brand-primary)" },
              contacted: { title: "Contacted", color: "var(--warning-icon)" },
              converted: { title: "Converted", color: "var(--success-icon)" },
              lost: { title: "Lost", color: "var(--text-tertiary)" },
              completed: { title: "Completed", color: "#8B5CF6" },
            }[stageKey];

            return (
              <div
                key={stageKey}
                onDragEnter={(e: React.DragEvent<HTMLDivElement>) => {
                  e.preventDefault();
                  setDraggedOverStage(stageKey);
                }}
                onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
                  e.preventDefault();
                }}
                onDragLeave={() => {
                  setDraggedOverStage(null);
                }}
                onDrop={(e: React.DragEvent<HTMLDivElement>) => {
                  e.preventDefault();
                  setDraggedOverStage(null);
                  const leadId = e.dataTransfer.getData("text/plain");
                  if (leadId) {
                    handleUpdateStage(leadId, stageKey);
                  }
                }}
                className={`bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border p-3 flex flex-col min-h-[450px] transition-all duration-200 ${
                  draggedOverStage === stageKey
                    ? "border-[var(--brand-primary)] bg-[var(--brand-subtle)]/20 shadow-inner"
                    : "border-[var(--border-subtle)]"
                }`}
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
                        const stagesArray = ["new", "contacted", "converted", "lost", "completed"] as const;
                        const currentIdx = stagesArray.indexOf(lead.kanban_stage);

                        return (
                          <motion.div
                            key={lead.id}
                            layout
                            draggable
                            onDragStart={(e: any) => {
                              const dragEvent = e as React.DragEvent<HTMLDivElement>;
                              dragEvent.dataTransfer.setData("text/plain", lead.id);
                              dragEvent.currentTarget.classList.add("opacity-50");
                            }}
                            onDragEnd={(e: any) => {
                              const dragEvent = e as React.DragEvent<HTMLDivElement>;
                              dragEvent.currentTarget.classList.remove("opacity-50");
                            }}
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-3.5 relative group flex flex-col gap-2.5 hover:shadow-[var(--shadow-md)] hover:border-[var(--border-strong)] cursor-grab active:cursor-grabbing"
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

                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar name={lead.customer_name || lead.customer_phone} size="sm" />
                              <div className="min-w-0 flex-1">
                                <h5 className="text-[13px] font-semibold font-sans text-[var(--text-primary)] truncate">
                                  {lead.customer_name || "Prospect User"}
                                </h5>
                                <p className="text-[11px] font-mono text-[var(--text-secondary)] mt-0.5">
                                  {formatPhoneNumber(lead.customer_phone)}
                                </p>
                              </div>
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
                                  info(`Navigating to conversation for ${lead.customer_name || lead.customer_phone}`);
                                  router.push(`/inbox?phone=${lead.customer_phone}`);
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

      {/* React Portal for Custom Dropdown Menu */}
      {isMounted && activeDropdownLead && dropdownPosition && createPortal(
        <>
          {/* Overlay to close dropdown when clicking outside */}
          <div
            className="fixed inset-0 z-[9998] bg-transparent cursor-default"
            onClick={(e) => {
              e.stopPropagation();
              setActiveDropdownLead(null);
              setDropdownPosition(null);
            }}
          />
          {/* Custom dropdown option menu list */}
          <div
            className="fixed bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] z-[9999] py-1 flex flex-col min-w-[120px]"
            style={{
              top: `${dropdownPosition.top + 6}px`, // Slight offset below the badge button
              left: `${dropdownPosition.left}px`,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.15)",
            }}
          >
            {(["new", "contacted", "converted", "lost", "completed"] as const).map((stageKey) => {
              const itemStage = stageConfig[stageKey];
              const isSelected = activeDropdownLead.kanban_stage === stageKey;
              return (
                <button
                  key={stageKey}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateStage(activeDropdownLead.id, stageKey);
                    setActiveDropdownLead(null);
                    setDropdownPosition(null);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-[11px] font-medium flex items-center gap-2 cursor-pointer transition-colors hover:bg-[var(--bg-subtle)] ${
                    isSelected ? "bg-[var(--bg-muted)] font-semibold" : ""
                  }`}
                  style={{ color: itemStage.text }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: itemStage.border }}
                  />
                  {itemStage.label}
                </button>
              );
            })}
          </div>
        </>,
        document.body
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
