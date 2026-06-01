"use client";

import React, { useEffect, useState } from "react";
import { LayoutDashboard, MessageSquare, BookOpen, Settings, LogOut, ChevronDown, Search, User, Globe } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserEmail(user.email ?? null);
        }
      } catch (error) {
        console.error("[Auth User Fetch Error]:", error);
      }
    }
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.refresh();
      router.push("/login");
    } catch (error) {
      console.error("[Logout Error]:", error);
    }
  };

  const navItems = [
    {
      name: "Leads",
      href: "/dashboard",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      name: "Inbox",
      href: "/inbox",
      icon: MessageSquare,
      isActive: pathname === "/inbox" || pathname?.startsWith("/inbox/"),
    },
    {
      name: "Knowledge Base",
      href: "/knowledge-base",
      icon: BookOpen,
      isActive: pathname === "/knowledge-base" || pathname?.startsWith("/knowledge-base/"),
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Settings,
      isActive: pathname === "/settings",
    },
  ];

  return (
    <div className="min-h-screen flex bg-[#09090B] text-[#F4F4F5] selection:bg-[#6366F1]/20 selection:text-[#6366F1]">
      {/* Sidebar Container */}
      <aside className="w-64 bg-[#121214] border-r border-[#27272A] flex flex-col shrink-0 z-40">
        
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-[#27272A] select-none gap-2.5">
          <img src="/Logo.png" alt="LeadFlow Logo" className="h-8 w-8 object-contain" />
          <span className="font-sans text-2xl font-extrabold tracking-tight select-none">
            <span className="text-[#F4F4F5]">Lead</span><span className="text-[#6366F1]">Flow</span>
          </span>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="block relative group outline-none"
              >
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 380, damping: 35 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer relative z-10 ${
                    item.isActive
                      ? "text-[#6366F1] font-semibold bg-[#6366F1]/5 border-l-2 border-[#6366F1]"
                      : "text-[#71717A] hover:text-[#F4F4F5] hover:bg-white/[0.02]"
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 transition-colors duration-200 ${
                    item.isActive ? "text-[#6366F1]" : "text-[#71717A] group-hover:text-[#F4F4F5]"
                  }`} />
                  <span className="text-sm font-sans">{item.name}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#27272A]">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[#71717A] hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all duration-200 cursor-pointer text-left font-sans text-sm font-medium"
          >
            <LogOut className="w-5 h-5 shrink-0 text-red-500/80" />
            <span>Log Out</span>
          </motion.button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
        
        {/* Glassmorphic Top Header */}
        <header className="h-16 bg-[#121214]/80 backdrop-blur-md border-b border-[#27272A] flex items-center justify-between px-8 z-30 select-none shrink-0">
          
          {/* Workspace selector dropdown */}
          <div className="relative">
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#09090B] border border-[#27272A] text-sm text-[#F4F4F5] hover:border-[#6366F1]/50 transition-colors duration-200 cursor-pointer font-sans"
            >
              <Globe className="w-4 h-4 text-[#6366F1]" />
              <span className="font-semibold">Default Workspace</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#71717A]" />
            </motion.button>

            {isWorkspaceOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-[#1C1C1F] border border-[#27272A] rounded-xl shadow-xl p-1.5 z-50">
                <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-[#F4F4F5] hover:bg-[#6366F1]/10 hover:text-[#6366F1] transition-colors duration-150">
                  Default Workspace
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg text-xs text-[#71717A] hover:bg-white/[0.02] hover:text-[#F4F4F5] transition-colors duration-150">
                  + Add Workspace
                </button>
              </div>
            )}
          </div>

          {/* Dummy Command Search Input */}
          <div className="w-80 relative hidden md:block">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-[#71717A]" />
            </span>
            <input
              type="text"
              readOnly
              placeholder="Search system... ⌘K"
              className="w-full pl-9 pr-4 py-1.5 bg-[#09090B] border border-[#27272A] rounded-lg text-xs text-[#71717A] placeholder-[#71717A] focus:outline-none cursor-default font-sans select-none"
            />
          </div>

          {/* User Context Node */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-[#F4F4F5]">Operator</p>
              <p className="text-[10px] text-[#71717A] font-mono leading-none mt-0.5">{userEmail || "loading..."}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#1C1C1F] border border-[#27272A] flex items-center justify-center text-[#F4F4F5] shadow-inner relative shrink-0">
              <User className="w-4 h-4 text-[#71717A]" />
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#10B981] rounded-full border border-[#121214]" />
            </div>
          </div>

        </header>

        {/* Child Workspace Panels */}
        <main className="flex-1 p-8 overflow-y-auto bg-[#09090B] relative">
          {children}
        </main>
      </div>
    </div>
  );
}
