"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";

export interface TenantData {
  id: string;
  business_name?: string;
  owner_email?: string;
  services_text?: string;
  hours_text?: string;
  rules_text?: string;
  ai_model?: string;
  ai_tone?: string;
  system_prompt?: string;
  subscription_tier?: string;
  plan_type?: string;
  ai_credits_balance?: number;
  ai_credits_limit?: number;
  tokens_used_this_month?: number;
  max_token_allowance?: number;
  is_calendar_connected?: boolean;
  whatsapp_phone_number_id?: string;
  waba_id?: string;
}

interface DashboardContextType {
  user: any;
  tenant: TenantData | null;
  userEmail: string | null;
  businessName: string;
  creditsBalance: number;
  creditsLimit: number;
  isLoading: boolean;
  refreshTenant: () => Promise<void>;
  updateCredits: (balance: number, limit?: number) => void;
}

const DashboardContext = createContext<DashboardContextType>({
  user: null,
  tenant: null,
  userEmail: null,
  businessName: "LeadFlow",
  creditsBalance: 50,
  creditsLimit: 50,
  isLoading: true,
  refreshTenant: async () => {},
  updateCredits: () => {},
});

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<any>(null);
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initial fast load: use getSession first (instant local cache), with localStorage backup
  const fetchUserData = useCallback(async () => {
    try {
      // Check localStorage first for instant initial render
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("leadflow_user_session");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed?.id && parsed?.email) {
              setUser(parsed);
            }
          } catch {}
        }
      }

      // 1. Get current valid session
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      if (currentUser && currentUser.email) {
        setUser(currentUser);
        if (typeof window !== "undefined") {
          localStorage.setItem("leadflow_user_session", JSON.stringify(currentUser));
        }

        // Fetch tenant details
        const { data: tenantData } = await supabase
          .from("tenants")
          .select("*")
          .eq("owner_email", currentUser.email)
          .single();

        if (tenantData) {
          setTenant(tenantData as TenantData);
        }
      }
    } catch (err) {
      console.error("[DashboardContext] Error loading user/tenant:", err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUserData();

    // Listen to auth state changes (login, logout, token refresh)
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
          if (typeof window !== "undefined") {
            localStorage.setItem("leadflow_user_session", JSON.stringify(session.user));
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setTenant(null);
          if (typeof window !== "undefined") {
            localStorage.removeItem("leadflow_user_session");
          }
        }
      }
    );

    return () => {
      authSub.unsubscribe();
    };
  }, [fetchUserData, supabase]);

  // Realtime subscription for tenant changes (e.g. credits, subscription)
  useEffect(() => {
    if (!tenant?.id) return;

    const channelName = `tenant-realtime-${tenant.id}`;
    const channel = supabase
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
          const updated = payload.new as TenantData;
          setTenant((prev) => (prev ? { ...prev, ...updated } : updated));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant?.id, supabase]);

  const updateCredits = useCallback((balance: number, limit?: number) => {
    setTenant((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        ai_credits_balance: balance,
        ...(limit !== undefined ? { ai_credits_limit: limit } : {}),
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      tenant,
      userEmail: user?.email ?? null,
      businessName: tenant?.business_name || "LeadFlow",
      creditsBalance: tenant?.ai_credits_balance ?? 50,
      creditsLimit: tenant?.ai_credits_limit ?? 50,
      isLoading,
      refreshTenant: fetchUserData,
      updateCredits,
    }),
    [user, tenant, isLoading, fetchUserData, updateCredits]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export const useDashboard = () => useContext(DashboardContext);
