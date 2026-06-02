"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  toast: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const success = useCallback((message: string) => toast(message, "success"), [toast]);
  const error = useCallback((message: string) => toast(message, "error"), [toast]);
  const info = useCallback((message: string) => toast(message, "info"), [toast]);
  const warning = useCallback((message: string) => toast(message, "warning"), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-[320px] w-full pointer-events-none select-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

const variantConfig = {
  success: {
    icon: CheckCircle2,
    borderClass: "border-l-[4px] border-l-[var(--success-icon)]",
    iconClass: "text-[var(--success-icon)]",
    barClass: "bg-[var(--success-icon)]",
  },
  error: {
    icon: AlertCircle,
    borderClass: "border-l-[4px] border-l-[var(--danger-icon)]",
    iconClass: "text-[var(--danger-icon)]",
    barClass: "bg-[var(--danger-icon)]",
  },
  info: {
    icon: Info,
    borderClass: "border-l-[4px] border-l-[var(--info-icon)]",
    iconClass: "text-[var(--info-icon)]",
    barClass: "bg-[var(--info-icon)]",
  },
  warning: {
    icon: AlertTriangle,
    borderClass: "border-l-[4px] border-l-[var(--warning-icon)]",
    iconClass: "text-[var(--warning-icon)]",
    barClass: "bg-[var(--warning-icon)]",
  },
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  const config = variantConfig[toast.variant];
  const Icon = config.icon;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`pointer-events-auto relative w-full overflow-hidden bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] ${config.borderClass} rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] p-4 flex gap-3 items-start select-text`}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${config.iconClass}`} />
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-xs font-medium text-[var(--text-primary)] font-sans leading-relaxed break-words">
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] shrink-0 transition-colors duration-150 cursor-pointer"
        aria-label="Dismiss toast"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: 4, ease: "linear" }}
        className={`absolute bottom-0 left-0 h-0.5 ${config.barClass}`}
      />
    </motion.div>
  );
}
