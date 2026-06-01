"use client";

import React, { useState, useEffect } from "react";
import { Database, Plus, Loader2, Phone, Clock, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

// ─── Types ──────────────────────────────────────────────────────────
interface Lead {
  id: string;
  customer_name: string;
  customer_phone: string;
  service_requested: string | null;
  urgency: "low" | "medium" | "high";
  kanban_stage: "new" | "contacted" | "converted" | "lost";
  created_at: string;
}

// ─── Helpers ────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  }) +
    ", " +
    date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
}

const urgencyConfig: Record<
  Lead["urgency"],
  { bg: string; text: string; border: string; label: string }
> = {
  high: {
    bg: "bg-red-500/10",
    text: "text-red-400",
    border: "border-red-500/20",
    label: "High",
  },
  medium: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
    label: "Medium",
  },
  low: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    label: "Low",
  },
};

const stageConfig: Record<
  Lead["kanban_stage"],
  { bg: string; text: string; border: string; label: string }
> = {
  new: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    border: "border-indigo-500/20",
    label: "New",
  },
  contacted: {
    bg: "bg-[#6366F1]/10",
    text: "text-[#6366F1]",
    border: "border-[#6366F1]/20",
    label: "Contacted",
  },
  converted: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    label: "Converted",
  },
  lost: {
    bg: "bg-zinc-500/10",
    text: "text-zinc-400",
    border: "border-zinc-500/20",
    label: "Lost",
  },
};

// ─── Skeleton Loader ────────────────────────────────────────────────
function SkeletonRow({ rowIdx }: { rowIdx: number }) {
  const widths = [
    ["75%", "85%", "65%", "80%", "70%", "90%"],
    ["80%", "70%", "90%", "75%", "85%", "65%"],
    ["65%", "90%", "75%", "80%", "70%", "85%"],
    ["90%", "65%", "80%", "70%", "85%", "75%"],
    ["70%", "80%", "85%", "95%", "60%", "80%"]
  ];
  const rowWidths = widths[rowIdx % widths.length];

  return (
    <tr className="border-b border-[#27272A] last:border-none">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div
            className="h-4 rounded-md animate-shimmer"
            style={{ width: rowWidths[i] }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Component ──────────────────────────────────────────────────────
export default function LeadsDashboard() {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.title = "Leads Dashboard | Saarthi";

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
    }

    fetchLeads();

    const channel = supabase
      .channel("realtime-leads")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leads" },
        (payload) => {
          setLeads((currentLeads) => [...currentLeads, payload.new as Lead]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leads" },
        (payload) => {
          setLeads((currentLeads) =>
            currentLeads.map((lead) =>
              lead.id === payload.new.id ? (payload.new as Lead) : lead
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-12 select-none">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex flex-col items-start gap-4">
          
          {/* Status Indicator Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/20 text-[10px] font-mono font-semibold tracking-wider text-[#6366F1] uppercase select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
            </span>
            LIVE ENGINE ACTIVE
          </div>

          {/* Titles */}
          <div className="space-y-1">
            <h1 className="font-calistoga text-4xl text-[#F4F4F5] leading-tight">
              Leads Dashboard
            </h1>
            <p className="font-sans text-sm text-[#71717A] font-medium">
              Real-time AI-extracted prospects and booking requests.
            </p>
          </div>
        </div>

        {/* Lead count pill */}
        {!isLoading && leads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="font-mono text-xs text-[#71717A] bg-[#121214] border border-[#27272A] px-3.5 py-2 rounded-xl self-start sm:self-auto shadow-inner"
          >
            {leads.length} lead{leads.length !== 1 ? "s" : ""} total
          </motion.div>
        )}
      </div>

      {/* Data Table / States */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          /* ─── Loading Skeleton ─────────────────────────────── */
          <motion.div
            key="skeleton"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="w-full bg-[#121214] rounded-2xl border border-[#27272A] overflow-hidden"
          >
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#121214] border-b border-[#27272A]">
                  {["Date / Time", "Customer Name", "Phone", "Service", "Urgency", "Status"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-6 py-4 text-left font-mono text-[10px] text-[#71717A] uppercase tracking-wider font-semibold"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272A]">
                {[...Array(5)].map((_, i) => (
                  <SkeletonRow key={i} rowIdx={i} />
                ))}
              </tbody>
            </table>

            {/* Subtle loading indicator */}
            <div className="flex items-center justify-center gap-2 py-4 border-t border-[#27272A] bg-[#09090B]/50 select-none">
              <Loader2 className="w-4 h-4 text-[#6366F1] animate-spin" />
              <span className="font-mono text-[11px] text-[#71717A]">
                SYNCHRONIZING REPOSITORY...
              </span>
            </div>
          </motion.div>
        ) : leads.length === 0 ? (
          /* ─── Empty State ──────────────────────────────────── */
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full bg-[#121214] rounded-3xl p-12 border border-[#27272A] flex flex-col items-center justify-center text-center group min-h-[400px] shadow-2xl relative"
          >
            <div className="w-full max-w-md border border-[#27272A] bg-[#09090B] rounded-2xl p-8 flex flex-col items-center gap-4 transition-colors duration-200">
              <div className="w-12 h-12 rounded-2xl bg-[#1C1C1F] border border-[#27272A] flex items-center justify-center text-[#71717A] group-hover:text-[#6366F1] transition-all duration-300 shadow-inner">
                <Database className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="font-sans text-sm font-semibold text-[#F4F4F5]">
                  No leads extracted yet
                </h3>
                <p className="font-sans text-xs text-[#71717A] max-w-[280px] mx-auto leading-relaxed">
                  Connect your WhatsApp API to start receiving and extracting
                  leads in real time.
                </p>
              </div>

              <motion.button
                whileTap={{ scale: 0.98 }}
                className="mt-2 cursor-pointer inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#6366F1] text-white hover:bg-[#4F46E5] font-sans text-xs font-semibold shadow-sm transition-all duration-200"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Manual Lead
              </motion.button>
            </div>
          </motion.div>
        ) : (
          /* ─── Data Table ───────────────────────────────────── */
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-full bg-[#121214] rounded-2xl border border-[#27272A] overflow-hidden shadow-xl"
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse">
                <thead>
                  <tr className="bg-[#121214] border-b border-[#27272A]">
                    <th className="px-6 py-4.5 text-left font-mono text-[10px] text-[#71717A] uppercase tracking-wider font-semibold select-none">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-[#6366F1]" />
                        Date / Time
                      </span>
                    </th>
                    <th className="px-6 py-4.5 text-left font-mono text-[10px] text-[#71717A] uppercase tracking-wider font-semibold select-none">
                      <span className="inline-flex items-center gap-1.5">
                        <User className="w-3 h-3 text-[#6366F1]" />
                        Customer Name
                      </span>
                    </th>
                    <th className="px-6 py-4.5 text-left font-mono text-[10px] text-[#71717A] uppercase tracking-wider font-semibold select-none">
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-[#6366F1]" />
                        Phone
                      </span>
                    </th>
                    <th className="px-6 py-4.5 text-left font-mono text-[10px] text-[#71717A] uppercase tracking-wider font-semibold select-none">
                      <span className="inline-flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#6366F1]" />
                        Service
                      </span>
                    </th>
                    <th className="px-6 py-4.5 text-left font-mono text-[10px] text-[#71717A] uppercase tracking-wider font-semibold select-none">
                      Urgency
                    </th>
                    <th className="px-6 py-4.5 text-left font-mono text-[10px] text-[#71717A] uppercase tracking-wider font-semibold select-none">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#27272A]">
                  <AnimatePresence initial={false}>
                    {leads.map((lead) => {
                      const urg = urgencyConfig[lead.urgency] ?? urgencyConfig.medium;
                      const stage = stageConfig[lead.kanban_stage] ?? stageConfig.new;
                      return (
                        <motion.tr
                          key={lead.id}
                          layout
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          whileHover={{ x: 2 }}
                          transition={{
                            duration: 0.25,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          className="bg-[#121214] border-b border-[#27272A] last:border-b-0 border-l-2 border-l-transparent hover:border-l-[#6366F1] hover:bg-white/[0.01] transition-all duration-200 cursor-default select-text"
                        >
                          {/* Date / Time */}
                          <td className="px-6 py-4.5">
                            <span className="font-mono text-xs text-[#71717A] tabular-nums whitespace-nowrap">
                              {formatDate(lead.created_at)}
                            </span>
                          </td>

                          {/* Customer Name */}
                          <td className="px-6 py-4.5">
                            <span className="font-sans text-sm font-semibold text-[#F4F4F5]">
                              {lead.customer_name}
                            </span>
                          </td>

                          {/* Phone */}
                          <td className="px-6 py-4.5">
                            <span className="font-mono text-xs text-[#71717A] tracking-tight">
                              {lead.customer_phone}
                            </span>
                          </td>

                          {/* Service */}
                          <td className="px-6 py-4.5">
                            <span className="font-sans text-sm text-[#F4F4F5]">
                              {lead.service_requested || (
                                <span className="text-[#71717A] italic select-none">—</span>
                              )}
                            </span>
                          </td>

                          {/* Urgency Badge */}
                          <td className="px-6 py-4.5 select-none">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold border ${urg.bg} ${urg.text} ${urg.border}`}
                            >
                              {urg.label}
                            </span>
                          </td>

                          {/* Status Badge */}
                          <td className="px-6 py-4.5 select-none">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold border ${stage.bg} ${stage.text} ${stage.border}`}
                            >
                              {stage.label}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
