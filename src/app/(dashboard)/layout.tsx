"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  MessageSquare,
  BookOpen,
  Megaphone,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  ChevronsUpDown,
  CreditCard
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ui/ThemeProvider";
import { useToast } from "@/components/ui/Toast";
import Avatar from "@/components/ui/Avatar";

export const dynamic = "force-dynamic";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// ─── Page Title Map ─────────────────────────────────────────────
const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": { title: "Leads", subtitle: "AI-extracted prospect database" },
  "/inbox": { title: "Inbox", subtitle: "Live WhatsApp conversations" },
  "/knowledge-base": { title: "Knowledge", subtitle: "Train the AI brain" },
  "/campaigns": { title: "Campaigns", subtitle: "Blast reactivation messages" },
  "/settings": { title: "Settings", subtitle: "Business profile & AI config" },
  "/pricing": { title: "Pricing", subtitle: "SaaS Plan & Credit Upgrades" },
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);
  const { theme, toggleTheme } = useTheme();
  const { success, error: toastError, info } = useToast();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("LeadFlow");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const [creditsBalance, setCreditsBalance] = useState<number | null>(null);
  const [creditsLimit, setCreditsLimit] = useState<number | null>(null);

  // Realtime credits synchronization
  useEffect(() => {
    let isCancelled = false;
    let channel: any = null;

    async function setupRealtimeCredits() {
      const { data: { user } } = await supabase.auth.getUser();
      if (isCancelled || !user || !user.email) return;

      // Initial query for credits
      const { data: tenant } = await supabase
        .from("tenants")
        .select("id, ai_credits_balance, ai_credits_limit")
        .eq("owner_email", user.email)
        .single();

      if (isCancelled || !tenant) return;

      setCreditsBalance(tenant.ai_credits_balance ?? 50);
      setCreditsLimit(tenant.ai_credits_limit ?? 50);

      // Realtime Subscription with a unique channel name to prevent cache collision
      const channelName = `realtime-credits-${tenant.id}-${Math.random().toString(36).substring(2, 11)}`;
      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "tenants",
            filter: `id=eq.${tenant.id}`,
          },
          (payload) => {
            const updated = payload.new as any;
            setCreditsBalance(updated.ai_credits_balance ?? 50);
            setCreditsLimit(updated.ai_credits_limit ?? 50);
          }
        )
        .subscribe();
    }

    setupRealtimeCredits();

    return () => {
      isCancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [supabase]);

  // Auto-collapse on laptop sizes (width < 1280px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function checkOnboardingAndFetchUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
          setUserEmail(user.email);

          const { data: tenant } = await supabase
            .from("tenants")
            .select("business_name, services_text")
            .eq("owner_email", user.email)
            .single();

          if (tenant && tenant.business_name) {
            setBusinessName(tenant.business_name);
          }

          const isIncomplete = !tenant || 
                               !tenant.services_text || 
                               tenant.services_text.trim() === "" || 
                               tenant.business_name === "My Business";

          const redirectKey = `leadflow_redirected_${user.id}`;
          const hasRedirected = typeof window !== "undefined" ? localStorage.getItem(redirectKey) === "true" : true;

          if (isIncomplete && !hasRedirected && pathname !== "/settings") {
            if (typeof window !== "undefined") {
              localStorage.setItem(redirectKey, "true");
            }
            router.push("/settings");
            info("Welcome to LeadFlow! Please complete your Business Profile to activate your AI engine.");
          }
        }
      } catch (err) {
        console.error("[Auth/Onboarding Fetch Error]:", err);
      }
    }
    checkOnboardingAndFetchUser();
  }, [pathname, router, info, supabase]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      success("Logged out successfully");
      router.refresh();
      router.push("/login");
    } catch (err: any) {
      toastError(err.message || "Logout failed");
    }
  };

  const navItems = [
    {
      name: "Leads",
      href: "/dashboard",
      icon: Users,
      isActive: pathname === "/dashboard",
    },
    {
      name: "Inbox",
      href: "/inbox",
      icon: MessageSquare,
      isActive: pathname === "/inbox" || pathname?.startsWith("/inbox/"),
    },
    {
      name: "Knowledge",
      href: "/knowledge-base",
      icon: BookOpen,
      isActive: pathname === "/knowledge-base" || pathname?.startsWith("/knowledge-base/"),
    },
    {
      name: "Campaigns",
      href: "/campaigns",
      icon: Megaphone,
      isActive: pathname === "/campaigns" || pathname?.startsWith("/campaigns/"),
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      isActive: pathname === "/settings",
    },
    {
      name: "Pricing",
      href: "/pricing",
      icon: CreditCard,
      isActive: pathname === "/pricing",
    },
  ];

  // Resolve page info
  const currentPage = PAGE_TITLES[pathname || ""] || { title: "Dashboard", subtitle: "" };

  return (
    <div className="min-h-screen flex bg-[var(--bg-canvas)] text-[var(--text-primary)]">

      {/* ─── SIDEBAR (visible on >= 1024px) ─────────────────────── */}
      <aside
        style={{ width: isCollapsed ? "64px" : "220px" }}
        className="hidden lg:flex bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] flex-col shrink-0 z-40 relative select-none"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Collapse Toggle Chevron */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-[68px] w-6 h-6 rounded-full bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        <div className="h-20 flex items-center px-4 border-b border-[var(--border-subtle)] gap-3 overflow-hidden shrink-0">
          {isCollapsed ? (
            <div className="w-full flex justify-center">
              <img src="/Logo-2.png" alt="LeadFlow" className="h-[48px] w-[48px] object-contain select-none pointer-events-none" />
            </div>
          ) : (
            <>
              <img src="/Logo.png" alt="LeadFlow" className="h-[48px] w-[48px] object-contain select-none pointer-events-none shrink-0" />
              <span className="font-display text-[23px] font-extrabold tracking-tight text-[var(--text-primary)] select-none">
                LeadFlow
              </span>
            </>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="block outline-none"
                title={isCollapsed ? item.name : undefined}
              >
                <div
                  className={`flex items-center gap-2.5 px-3 h-10 rounded-[var(--radius-md)] cursor-pointer relative group select-none mx-1 ${
                    item.isActive
                      ? "text-[var(--brand-primary)] font-semibold bg-[var(--color-ai-bg)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                  }`}
                  style={{
                    borderLeft: item.isActive ? "3px solid var(--brand-primary)" : "3px solid transparent",
                  }}
                >
                  <Icon className={`w-[20px] h-[20px] shrink-0 ${
                    item.isActive ? "text-[var(--brand-primary)]" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"
                  }`} />
                  {!isCollapsed && (
                    <span className="text-[14px] font-display font-medium">{item.name}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-[var(--border-subtle)] space-y-3 flex flex-col shrink-0">

          {/* Pill Theme Toggle */}
          <div className="flex justify-center py-2 select-none">
            <button
              onClick={toggleTheme}
              className="w-[44px] h-[24px] rounded-full p-[2px] cursor-pointer bg-[var(--bg-muted)] relative flex items-center border border-[var(--border-subtle)] hover:border-[var(--brand-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
              role="switch"
              aria-checked={theme === "dark"}
              aria-label="Toggle visual theme"
            >
              {/* Sun icon */}
              <div className="absolute left-1 w-4 h-4 flex items-center justify-center pointer-events-none z-20">
                <Sun
                  className="w-3 h-3"
                  style={{
                    opacity: theme === "light" ? 1 : 0.4,
                    color: theme === "light" ? "#F59E0B" : "var(--text-tertiary)",
                  }}
                />
              </div>

              {/* Moon icon */}
              <div className="absolute right-1 w-4 h-4 flex items-center justify-center pointer-events-none z-20">
                <Moon
                  className="w-3 h-3"
                  style={{
                    opacity: theme === "dark" ? 1 : 0.4,
                    color: theme === "dark" ? "#60A5FA" : "var(--text-tertiary)",
                  }}
                />
              </div>

              {/* Knob */}
              <motion.div
                layout
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-[20px] h-[20px] rounded-full bg-white shadow-[var(--shadow-sm)] z-10"
                style={{
                  marginLeft: theme === "dark" ? "auto" : "0",
                  marginRight: theme === "light" ? "auto" : "0"
                }}
              />
            </button>
          </div>

          {/* Tenant Row */}
          <div className="relative">
            <button
              onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
              className="w-full flex items-center gap-2 p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--bg-subtle)] text-left cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            >
              <Avatar name={businessName} size="sm" />
              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0 pr-1">
                    <p className="text-[13px] font-medium text-[var(--text-primary)] truncate font-sans">
                      {businessName}
                    </p>
                  </div>
                  <ChevronsUpDown className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
                </>
              )}
            </button>

            {/* Dropdown */}
            {isUserDropdownOpen && (
              <div
                className={`absolute bottom-12 bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] p-1 z-50 min-w-[160px] ${
                  isCollapsed ? "left-2" : "left-0 right-0"
                }`}
              >
                <div className="px-3 py-1.5 border-b border-[var(--border-subtle)] pb-1.5 mb-1 select-text">
                  <p className="text-[10px] uppercase font-mono font-bold text-[var(--text-tertiary)]">Signed in as</p>
                  <p className="text-xs font-medium text-[var(--text-primary)] truncate">{userEmail || "operator"}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] text-xs text-rose-500 hover:bg-rose-500/10 cursor-pointer text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden relative bg-[var(--bg-canvas)]">

        {/* Top Bar (56px) */}
        <header className="h-[56px] bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] flex items-center justify-between px-6 z-30 select-none shrink-0 sticky top-0">
          {/* Left: Page title + subtitle */}
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-display font-semibold text-[var(--text-primary)] leading-none">
              {currentPage.title}
            </h1>
            {currentPage.subtitle && (
              <span className="text-[13px] text-[var(--text-secondary)] font-sans hidden sm:inline">
                — {currentPage.subtitle}
              </span>
            )}
          </div>

          {/* Right: Portal target for module-specific CTAs */}
          <div className="flex items-center gap-4">
            {creditsBalance !== null && creditsLimit !== null && (
              <Link href="/pricing" className="outline-none">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:bg-[var(--bg-muted)] hover:border-[var(--brand-primary)] cursor-pointer select-none transition-all duration-200 ${
                    creditsBalance < 0.1 * creditsLimit
                      ? "text-red-500 animate-pulse border-red-500/30 bg-red-500/10"
                      : "text-[var(--text-primary)]"
                  }`}
                  title="Click to upgrade or buy credits"
                >
                  <span>⚡</span>
                  <span className="font-mono">{creditsBalance}</span>
                  <span className="text-[var(--text-tertiary)] font-normal">/</span>
                  <span className="text-[var(--text-tertiary)] font-mono">{creditsLimit}</span>
                  <span className="text-[10px] text-[var(--text-secondary)] font-normal ml-0.5">Credits</span>
                </div>
              </Link>
            )}
            <div id="header-cta-portal" className="flex items-center gap-3 min-h-10" />
          </div>
        </header>

        {/* Module Content */}
        <main className="flex-1 overflow-hidden relative pb-14 lg:pb-0">
          {children}
        </main>
      </div>

      {/* ─── BOTTOM MOBILE NAVIGATION (< 1024px) ─────────────────── */}
      <nav className="flex lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] z-40 items-center justify-around select-none shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg ${
                item.isActive ? "text-[var(--brand-primary)]" : "text-[var(--text-secondary)]"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-[10px] font-sans font-medium mt-0.5">{item.name}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}
