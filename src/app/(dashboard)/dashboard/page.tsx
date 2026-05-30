"use client";

import React from "react";
import { Sparkles, Database, Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function LeadsDashboard() {
  return (
    <>
      <title>Leads Dashboard | Saarthi</title>
      <meta
        name="description"
        content="Real-time AI extracted leads dashboard. View and manage customer booking requests."
      />

      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        
        {/* Header Section */}
        <div className="flex flex-col items-start gap-4">
          
          {/* Signature Section Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-xs font-mono font-bold tracking-wider text-accent uppercase select-none">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            LIVE EXTRACTION
          </div>

          {/* Titles */}
          <div className="space-y-1.5">
            <h1 className="font-calistoga text-4xl text-slate-900 leading-tight">
              Leads Dashboard
            </h1>
            <p className="font-sans text-sm text-slate-500 font-medium">
              Real-time AI extracted booking requests.
            </p>
          </div>
        </div>

        {/* Empty State / Placeholder Container */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full bg-white rounded-3xl p-12 border border-slate-200/60 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center text-center group hover:shadow-[0_15px_40px_rgba(0,0,0,0.04)] hover:border-slate-300/80 transition-all duration-300 min-h-[400px]"
        >
          {/* Decorative Dashed Inner Box */}
          <div className="w-full max-w-md border-2 border-dashed border-slate-200 rounded-2xl p-8 flex flex-col items-center gap-4 transition-colors duration-200 group-hover:border-slate-300">
            {/* Visual Icon with subtle glow */}
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-accent group-hover:bg-accent/5 group-hover:border-accent/10 transition-all duration-300 shadow-inner">
              <Database className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-sans text-base font-semibold text-slate-800">
                Data table will go here
              </h3>
              <p className="font-sans text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                Connect your WhatsApp API to start receiving and extracting leads in real time.
              </p>
            </div>

            {/* Quick action button for high UX standard */}
            <button className="mt-2 cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 font-sans text-xs font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5">
              <Plus className="w-3.5 h-3.5" />
              Add Manual Lead
            </button>
          </div>
        </motion.div>
        
      </div>
    </>
  );
}
