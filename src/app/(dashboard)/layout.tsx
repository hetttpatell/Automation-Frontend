"use client";

import React from "react";
import { LayoutDashboard, MessageSquare, Settings, LogOut } from "lucide-react";
import { supabase } from "@/utils/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
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
      isActive: true, // Mocked as active for now
    },
    {
      name: "Inbox",
      href: "#inbox",
      icon: MessageSquare,
      isActive: false,
    },
    {
      name: "Settings",
      href: "#settings",
      icon: Settings,
      isActive: false,
    },
  ];

  return (
    <div className="min-h-screen flex bg-background/50 selection:bg-accent/20 selection:text-accent">
      {/* Sidebar Container */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 select-none">
          <span className="font-calistoga text-2xl text-accent tracking-tight">
            Saarthi
          </span>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                  item.isActive
                    ? "bg-accent/10 text-accent font-medium"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50/80"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="text-sm font-semibold font-sans">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-50/50 transition-all duration-200 cursor-pointer text-left"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold font-sans">Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <main className="flex-1 p-8 overflow-y-auto bg-background/50">
          {children}
        </main>
      </div>
    </div>
  );
}
