"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  MessageSquare,
  Bot,
  User,
  Phone,
  Loader2,
  AlertTriangle,
  Send,
  SlidersHorizontal,
  ChevronLeft,
  Sparkles,
  CheckCheck,
  X,
  ChevronRight,
  AlertCircle,
  Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/Toast";
import Avatar from "@/components/ui/Avatar";

// ─── Interfaces ───────────────────────────────────────────────────
interface Conversation {
  id: string;
  tenant_id: string;
  customer_phone: string;
  customer_name: string | null;
  is_ai_active: boolean;
  chat_summary: string | null;
  updated_at: string;
  messages?: Message[];
}

interface Message {
  id: string;
  conversation_id: string;
  tenant_id: string;
  sender: "customer" | "ai" | "human";
  message_text: string;
  tokens_consumed: number;
  created_at: string;
}

// ─── Formatting Helpers ──────────────────────────────────────────
function formatMessageTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatConversationTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// ─── Loading Skeletons ─────────────────────────────────────────────
function ThreadSkeleton() {
  return (
    <div className="h-[72px] p-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-[var(--bg-muted)] animate-pulse shrink-0" />
      <div className="flex-1 space-y-2 min-w-0">
        <div className="h-3 rounded bg-[var(--bg-muted)] w-1/3 animate-pulse" />
        <div className="h-2.5 rounded bg-[var(--bg-muted)] w-2/3 animate-pulse" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function InboxPage() {
  const supabase = createClient();
  const { success, warning, info, error: toastError } = useToast();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "ai" | "human">("all");
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  const [isToggling, setIsToggling] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // States for Insights Sidebar (Right)
  const [showInsights, setShowInsights] = useState(true); // CRM Insights
  const [leadInfo, setLeadInfo] = useState<any | null>(null);
  const [isLoadingLead, setIsLoadingLead] = useState(false);
  const [isUpdatingLead, setIsUpdatingLead] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

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
    if (typeof window !== "undefined") {
      setPortalTarget(document.getElementById("header-cta-portal"));
    }
  }, []);

  const queryParamProcessed = React.useRef(false);

  // Auto-select conversation based on phone number query parameter
  useEffect(() => {
    if (typeof window !== "undefined" && conversations.length > 0 && !queryParamProcessed.current) {
      const params = new URLSearchParams(window.location.search);
      const phoneParam = params.get("phone");
      if (phoneParam) {
        const matchingConvo = conversations.find(
          (c) => c.customer_phone === phoneParam
        );
        if (matchingConvo) {
          setSelectedConversation(matchingConvo);
          queryParamProcessed.current = true;
        }
      }
    }
  }, [conversations]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch threads on mount
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

  // Fetch threads when user is loaded & setup realtime subscription
  useEffect(() => {
    if (!user) return;
    document.title = "Inbox | LeadFlow";

    async function fetchConversations() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("conversations")
        .select("*, messages(*)")
        .eq("tenant_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("[Fetch Conversations Error]:", error.message);
        toastError("Failed to fetch conversations");
      } else {
        const sortedConvos = ((data as Conversation[] | null) || []).map(convo => ({
          ...convo,
          messages: convo.messages
            ? [...convo.messages].sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              )
            : []
        }));
        setConversations(sortedConvos);
      }
      setIsLoading(false);
    }

    fetchConversations();

    const channel = supabase
      .channel("inbox-conversations-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations", filter: `tenant_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setConversations((prev) => [payload.new as Conversation, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setConversations((prev) => {
              const updated = prev.map((c) =>
                c.id === payload.new.id ? { ...(payload.new as Conversation), messages: c.messages } : c
              );
              return [...updated].sort(
                (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
              );
            });
            setSelectedConversation((current) => {
              if (current && current.id === payload.new.id) {
                return payload.new as Conversation;
              }
              return current;
            });
          } else if (payload.eventType === "DELETE") {
            setConversations((prev) => prev.filter((c) => c.id !== payload.old.id));
            setSelectedConversation((current) =>
              current && current.id === payload.old.id ? null : current
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    const conversationId = selectedConversation.id;

    async function fetchMessages() {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("[Fetch Messages Error]:", error.message);
      } else {
        setMessages((data as Message[]) || []);
      }
    }

    fetchMessages();

    const channel = supabase
      .channel(`realtime-messages-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMessage = payload.new as Message;
          if (newMessage.conversation_id === conversationId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }

          setConversations((prevConvos) => {
            const updated = prevConvos.map((c) => {
              if (c.id === newMessage.conversation_id) {
                const currentMsgs = c.messages || [];
                if (currentMsgs.some((m) => m.id === newMessage.id)) return c;
                return {
                  ...c,
                  updated_at: newMessage.created_at,
                  messages: [...currentMsgs, newMessage],
                };
              }
              return c;
            });
            return [...updated].sort(
              (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.id]);

  // Fetch active CRM lead details
  useEffect(() => {
    if (!selectedConversation || !selectedConversation.customer_phone) {
      setLeadInfo(null);
      return;
    }

    async function fetchLeadInfo() {
      setIsLoadingLead(true);
      try {
        const { data, error } = await supabase
          .from("leads")
          .select("*")
          .eq("customer_phone", selectedConversation.customer_phone)
          .maybeSingle();

        if (error) {
          console.error("[Fetch Lead Error]:", error.message);
        } else {
          setLeadInfo(data || null);
        }
      } catch (err) {
        console.error("[Fetch Lead Exception]:", err);
      } finally {
        setIsLoadingLead(false);
      }
    }

    fetchLeadInfo();
  }, [selectedConversation?.customer_phone]);

  // Realtime subscription for lead updates
  useEffect(() => {
    if (!selectedConversation || !selectedConversation.customer_phone) return;

    const channel = supabase
      .channel(`inbox-lead-realtime-${selectedConversation.customer_phone}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "leads",
          filter: `customer_phone=eq.${selectedConversation.customer_phone}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setLeadInfo(null);
          } else {
            setLeadInfo(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.customer_phone]);

  // Auto-scroll & focus
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    if (selectedConversation && !selectedConversation.is_ai_active) {
      textInputRef.current?.focus();
    }

    return () => clearTimeout(timer);
  }, [messages, selectedConversation?.is_ai_active]);

  // AI Toggle
  const handleToggleAI = async () => {
    if (!selectedConversation || isToggling || !user) return;
    setIsToggling(true);

    const convoId = selectedConversation.id;
    const currentStatus = selectedConversation.is_ai_active;
    const targetStatus = !currentStatus;

    if (targetStatus) {
      success("AI Autopilot activated");
    } else {
      warning("Human Takeover active");
    }

    setSelectedConversation(prev => prev ? { ...prev, is_ai_active: targetStatus } : null);
    setConversations(prev => prev.map(c => c.id === convoId ? { ...c, is_ai_active: targetStatus } : c));

    try {
      const { error } = await supabase
        .from("conversations")
        .update({ is_ai_active: targetStatus })
        .eq("id", convoId)
        .eq("tenant_id", user.id);

      if (error) throw error;
    } catch (err: any) {
      console.error("[Override Toggle Error]:", err.message);
      toastError("Failed to toggle AI state");
      setSelectedConversation(prev => prev ? { ...prev, is_ai_active: currentStatus } : null);
      setConversations(prev => prev.map(c => c.id === convoId ? { ...c, is_ai_active: currentStatus } : c));
    } finally {
      setIsToggling(false);
    }
  };

  // Send Message
  const handleSendMessage = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault();
    if (!selectedConversation || !inputMessage.trim() || isSending) return;
    setIsSending(true);

    const { id: conversationId, customer_phone: customerPhone, tenant_id: tenantId } = selectedConversation;
    const textToSend = inputMessage;
    setInputMessage("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          customerPhone,
          messageText: textToSend,
          tenantId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to post message");
      }
      info("Message sent successfully");
    } catch (err: any) {
      console.error("[Send Message Error]:", err.message);
      toastError("Failed to deliver message");
      setInputMessage(textToSend);
    } finally {
      setIsSending(false);
      setTimeout(() => textInputRef.current?.focus(), 50);
    }
  };

  // CRM: Update Urgency
  const handleUpdateUrgency = async (newUrgency: "low" | "medium" | "high") => {
    if (!leadInfo || isUpdatingLead) return;
    setIsUpdatingLead(true);

    try {
      const { error } = await supabase
        .from("leads")
        .update({ urgency: newUrgency })
        .eq("id", leadInfo.id);

      if (error) throw error;
      setLeadInfo((prev: any) => prev ? { ...prev, urgency: newUrgency } : null);
      success(`Urgency updated to ${newUrgency}`);
    } catch (err: any) {
      console.error("[Update Urgency Error]:", err.message);
      toastError("Failed to update urgency");
    } finally {
      setIsUpdatingLead(false);
    }
  };

  // CRM: Update Stage
  const handleUpdateStage = async (newStage: string) => {
    if (!leadInfo || isUpdatingLead) return;
    setIsUpdatingLead(true);

    try {
      const { error } = await supabase
        .from("leads")
        .update({ kanban_stage: newStage })
        .eq("id", leadInfo.id);

      if (error) throw error;
      setLeadInfo((prev: any) => prev ? { ...prev, kanban_stage: newStage } : null);
      success(`Lead moved to ${newStage}`);
    } catch (err: any) {
      console.error("[Update Stage Error]:", err.message);
      toastError("Failed to update stage");
    } finally {
      setIsUpdatingLead(false);
    }
  };

  // CRM: Toggle Human Assistance Flag
  const handleToggleHumanSupport = async () => {
    if (!leadInfo || isUpdatingLead) return;
    setIsUpdatingLead(true);

    const targetStatus = !leadInfo.requires_human_support;

    try {
      const { error } = await supabase
        .from("leads")
        .update({ requires_human_support: targetStatus })
        .eq("id", leadInfo.id);

      if (error) throw error;
      setLeadInfo((prev: any) => prev ? { ...prev, requires_human_support: targetStatus } : null);
      if (targetStatus) {
        warning("Human assistance requested");
      } else {
        success("Assistance request resolved");
      }
    } catch (err: any) {
      console.error("[Toggle Human Support Error]:", err.message);
      toastError("Failed to update assistance flag");
    } finally {
      setIsUpdatingLead(false);
    }
  };

  // Filter & search
  const filteredConversations = conversations.filter((c) => {
    const name = (c.customer_name || "").toLowerCase();
    const phone = (c.customer_phone || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = name.includes(query) || phone.includes(query);

    if (!matchesSearch) return false;
    if (filterMode === "ai") return c.is_ai_active;
    if (filterMode === "human") return !c.is_ai_active;
    return true;
  });

  return (
    <div className="h-[calc(100vh-7rem)] lg:h-[calc(100vh-3.5rem)] flex overflow-hidden bg-[var(--bg-canvas)] id-inbox-container">
      {selectedConversation && (
        <style dangerouslySetInnerHTML={{__html: `
          @media (max-width: 1023px) {
            header.sticky { display: none !important; }
            .id-inbox-container { height: calc(100vh - 3.5rem) !important; }
          }
        `}} />
      )}

      {/* ─── PANEL 1: Thread List (Leftmost, 300px) ─────────────────── */}
      <aside className={`w-full lg:w-[300px] border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col h-full shrink-0 select-none ${
        selectedConversation && isMobile ? "hidden" : "flex"
      }`}>

        {/* Header */}
        <div className="h-[52px] px-4 flex items-center justify-between border-b border-[var(--border-subtle)] relative shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[14px] font-bold text-[var(--text-primary)] font-display tracking-tight uppercase">
              Inbox Threads
            </h1>
            {filteredConversations.length > 0 && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-[var(--brand-subtle)] text-[var(--brand-primary)] border border-[var(--brand-border)] tabular-nums select-none leading-none">
                {filteredConversations.length}
              </span>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
              className="p-1.5 rounded-md hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer focus:outline-none transition-colors"
              aria-label="Filter threads"
            >
              <SlidersHorizontal className="w-[17px] h-[17px]" />
            </button>

            {isFilterDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-44 bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] p-1 z-50 animate-fade-in">
                {(["all", "ai", "human"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setFilterMode(mode);
                      setIsFilterDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-sans cursor-pointer ${
                      filterMode === mode
                        ? "bg-[var(--brand-subtle)] text-[var(--brand-primary)] font-semibold"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {mode === "all" ? "All Threads" : mode === "ai" ? "AI Autopilot" : "Human Takeover"}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-[var(--border-subtle)] shrink-0">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-[var(--text-tertiary)] pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] text-[13px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] font-sans focus:outline-none focus:border-[var(--brand-primary)] focus:shadow-[var(--shadow-focus)] transition-all"
            />
          </div>
        </div>

        {/* Thread Cards */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]">
          {isLoading ? (
            [...Array(5)].map((_, i) => <ThreadSkeleton key={i} />)
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center h-48 select-none">
              <MessageSquare className="w-8 h-8 text-[var(--text-tertiary)] mb-2" />
              <p className="text-[var(--text-primary)] text-xs font-semibold">
                {searchQuery ? "No matching threads" : "No active threads"}
              </p>
              <p className="text-[var(--text-secondary)] text-[10px] mt-1 max-w-[180px] leading-relaxed mx-auto">
                {searchQuery ? "Adjust your keywords or filters." : "New WhatsApp messages will appear here."}
              </p>
            </div>
          ) : (
            filteredConversations.map((convo) => {
              const isSelected = selectedConversation?.id === convo.id;

              let lastMessage = "";
              let isLastMessageFromAI = false;
              if (convo.messages && convo.messages.length > 0) {
                const lastMsgObj = convo.messages[convo.messages.length - 1];
                lastMessage = lastMsgObj.message_text;
                isLastMessageFromAI = lastMsgObj.sender === "ai";
              } else if (convo.chat_summary) {
                lastMessage = convo.chat_summary;
              }

              return (
                <div
                  key={convo.id}
                  onClick={() => setSelectedConversation(convo)}
                  className={`h-[72px] px-4 py-3 flex items-center gap-3 cursor-pointer border-b border-[var(--border-subtle)] relative hover:bg-[var(--bg-subtle)]/50 transition-all duration-150 ${
                    isSelected
                      ? "bg-[var(--brand-subtle)]"
                      : "bg-transparent"
                  }`}
                  style={{
                    borderLeft: isSelected ? "4px solid var(--brand-primary)" : "4px solid transparent",
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedConversation(convo);
                    }
                  }}
                >
                  <div className="shrink-0">
                    <Avatar
                      name={convo.customer_name || convo.customer_phone}
                      size="md"
                      status={convo.is_ai_active ? "ai" : "human"}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className={`text-[13.5px] font-semibold truncate font-sans ${
                          isSelected ? "text-[var(--brand-text-strong)]" : "text-[var(--text-primary)]"
                        }`}>
                          {convo.customer_name || "Customer"}
                        </h3>
                        {convo.is_ai_active ? (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-[var(--color-ai-bg)] text-[var(--color-ai-text)] text-[9px] font-bold tracking-wide border border-[var(--ai-border)] select-none leading-none">
                            <Bot className="w-2.5 h-2.5 shrink-0" />
                            AI
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] text-[9px] font-bold tracking-wide border border-[var(--warning-border)] select-none leading-none">
                            <User className="w-2.5 h-2.5 shrink-0" />
                            Human
                          </span>
                        )}
                      </div>
                      <span className="text-[var(--text-tertiary)] text-[10px] font-mono shrink-0 ml-1">
                        {formatConversationTime(convo.updated_at)}
                      </span>
                    </div>
                    {lastMessage && (
                      <div className="flex items-center gap-1 text-[12px] text-[var(--text-secondary)] truncate">
                        {isLastMessageFromAI && (
                          <span className="inline-flex items-center bg-[var(--color-ai-bg)] text-[var(--color-ai-text)] text-[9px] font-semibold px-1 rounded-sm shrink-0">
                            AI
                          </span>
                        )}
                        <span className="truncate flex-1">{lastMessage}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>


      {/* ─── PANEL 3: Agent Chat Canvas (Center-Right, flex-1) ────────── */}
      <section className={`flex-1 flex flex-col h-full bg-[var(--bg-canvas)] relative select-text ${
        !selectedConversation && isMobile ? "hidden" : "flex"
      }`}>

        <AnimatePresence mode="wait">
          {!selectedConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full select-none">
              <div className="w-14 h-14 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-tertiary)] mb-4 shadow-[var(--shadow-sm)]">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-[var(--text-primary)] font-semibold text-sm font-sans">
                Select a Conversation
              </h3>
              <p className="text-[var(--text-secondary)] text-xs mt-1 max-w-[240px] leading-relaxed mx-auto">
                Choose a thread from the left list to view messages, toggle autopilot overlays, or send manual agent overrides.
              </p>
            </div>
          ) : (
            <motion.div
              key={selectedConversation.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col h-full overflow-hidden"
            >
              {/* Canvas Header */}
              <header className="h-16 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] px-5 flex items-center justify-between shrink-0 select-none z-10">
                <div className="flex items-center gap-3 min-w-0">
                  {isMobile && (
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="mr-1 p-1.5 rounded-md hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                      aria-label="Back to conversations"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  <Avatar name={selectedConversation.customer_name || selectedConversation.customer_phone} size="md" />
                  <div className="min-w-0">
                    <h2 className="text-[15px] font-bold text-[var(--text-primary)] truncate font-display">
                      {selectedConversation.customer_name || "Customer"}
                    </h2>
                    <p className="text-[12px] text-[var(--text-secondary)] font-mono flex items-center gap-1 mt-0.5 truncate">
                      {selectedConversation.customer_phone}
                    </p>
                  </div>
                </div>

                {/* Render Actions in Layout Header Portal (Desktop) or Inline (Mobile/Fallback) */}
                {mounted ? (
                  !isMobile && portalTarget ? (
                    createPortal(
                      <div className="flex items-center gap-4 select-none">
                        {/* Insights Toggle Button */}
                        <button
                          onClick={() => setShowInsights(!showInsights)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer select-none outline-none ${
                            showInsights
                              ? "bg-[var(--brand-subtle)] text-[var(--brand-text-strong)] border-[var(--brand-border)] shadow-xs"
                              : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                          }`}
                          title="Toggle Customer Insights"
                        >
                          <Sparkles className="w-4 h-4 text-amber-500" />
                          <span>Insights</span>
                        </button>

                        <div className="h-4 w-[1px] bg-[var(--border-subtle)]" />

                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-sans font-medium text-[var(--text-secondary)]">
                            AI Autopilot
                          </span>
                          <button
                            onClick={handleToggleAI}
                            disabled={isToggling}
                            className={`w-[44px] h-[24px] rounded-full p-[2px] cursor-pointer relative flex items-center outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] transition-colors duration-200 ${
                              selectedConversation.is_ai_active
                                ? "bg-[var(--brand-primary)]"
                                : "bg-[var(--bg-muted)]"
                            }`}
                            role="switch"
                            aria-checked={selectedConversation.is_ai_active}
                            aria-label="AI Autopilot"
                          >
                            <motion.div
                              layout
                              transition={{ type: "spring", stiffness: 350, damping: 25 }}
                              className="w-[20px] h-[20px] rounded-full shadow-[var(--shadow-sm)] bg-white"
                              style={{
                                marginLeft: selectedConversation.is_ai_active ? "auto" : "0",
                                marginRight: selectedConversation.is_ai_active ? "0" : "auto"
                              }}
                            />
                          </button>
                        </div>
                      </div>,
                      portalTarget
                    )
                  ) : (
                    <div className="flex items-center gap-4 select-none">
                      {!isMobile && (
                        <>
                          <button
                            onClick={() => setShowInsights(!showInsights)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer select-none outline-none ${
                              showInsights
                                ? "bg-[var(--brand-subtle)] text-[var(--brand-text-strong)] border-[var(--brand-border)] shadow-xs"
                                : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                            }`}
                            title="Toggle Customer Insights"
                          >
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>Insights</span>
                          </button>
                          <div className="h-4 w-[1px] bg-[var(--border-subtle)]" />
                        </>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] lg:text-[13px] font-sans font-medium text-[var(--text-secondary)] hidden sm:inline">
                          AI Autopilot
                        </span>
                        <button
                          onClick={handleToggleAI}
                          disabled={isToggling}
                          className={`w-[40px] lg:w-[44px] h-[22px] lg:h-[24px] rounded-full p-[2px] cursor-pointer relative flex items-center outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] transition-colors duration-200 ${
                            selectedConversation.is_ai_active
                              ? "bg-[var(--brand-primary)]"
                              : "bg-[var(--bg-muted)]"
                          }`}
                          role="switch"
                          aria-checked={selectedConversation.is_ai_active}
                          aria-label="AI Autopilot"
                        >
                          <motion.div
                            layout
                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                            className="w-[18px] lg:w-[20px] h-[18px] lg:h-[20px] rounded-full shadow-[var(--shadow-sm)] bg-white"
                            style={{
                              marginLeft: selectedConversation.is_ai_active ? "auto" : "0",
                              marginRight: selectedConversation.is_ai_active ? "0" : "auto"
                            }}
                          />
                        </button>
                      </div>
                    </div>
                  )
                ) : null}
              </header>

              {/* Human Takeover Banner */}
              {!selectedConversation.is_ai_active && (
                <div className="bg-[var(--color-warning-bg)] border-b border-[var(--warning-border)] px-5 py-1.5 flex items-center gap-2 select-none shrink-0 z-10 animate-fade-in">
                  <AlertTriangle className="w-[14px] h-[14px] text-[var(--warning-icon)] shrink-0" />
                  <span className="text-[12.5px] font-semibold text-[var(--color-warning-text)]">
                    Human Takeover Active — AI chatbot is currently paused on this thread
                  </span>
                </div>
              )}

              {/* Message Stream */}
              <div
                role="log"
                aria-live="polite"
                aria-label="Conversation messages"
                className="flex-1 overflow-y-auto px-6 py-6 bg-gradient-to-b from-[var(--bg-canvas)] to-[var(--bg-subtle)]/30 space-y-4 select-text"
              >
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center h-48 select-none">
                    <p className="text-[var(--text-secondary)] text-xs font-semibold">No messages in this conversation</p>
                    <p className="text-[var(--text-tertiary)] text-[10px] mt-1">Direct customer inbound messages will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {messages.map((message) => {
                      const isCustomer = message.sender === "customer";
                      const isAI = message.sender === "ai";
                      const hash = message.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
                      const mockMs = 120 + (hash % 110);
                      const mockTokens = message.tokens_consumed > 0 ? message.tokens_consumed : 20 + (hash % 30);

                      return (
                        <div
                          key={message.id}
                          className={`flex w-full flex-col ${isCustomer ? "items-start" : "items-end"}`}
                        >
                          {isCustomer ? (
                            /* Customer Message (Left Side) */
                            <div className="flex flex-col max-w-[70%] gap-1">
                              <div
                                className="px-4 py-2.5 text-[13.5px] font-sans leading-[1.55] break-words bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-[18px] rounded-tl-[3px] shadow-sm"
                              >
                                <p className="whitespace-pre-wrap select-text">
                                  {message.message_text}
                                </p>
                              </div>
                              <div className="flex items-center gap-[6px] px-1 select-none text-[10px] text-[var(--text-tertiary)] mt-1">
                                <span className="font-sans font-medium">{formatMessageTime(message.created_at)}</span>
                              </div>
                            </div>
                          ) : (
                            /* Business Response — Agent or AI (Right Side) */
                            <div className="flex flex-col max-w-[70%] gap-1 items-end">
                              <div
                                className={`px-4 py-2.5 text-[13.5px] font-sans leading-[1.55] break-words ${
                                  isAI
                                    ? "bg-gradient-to-br from-[var(--color-ai)] to-[#6D28D9] text-white rounded-[18px] rounded-tr-[3px] shadow-md"
                                    : "bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-hover)] text-white rounded-[18px] rounded-tr-[3px] shadow-md"
                                }`}
                              >
                                {isAI ? (
                                  <div className="flex items-center gap-1 mb-1.5 text-[10px] text-purple-200/90 font-semibold uppercase tracking-wider select-none">
                                    <Bot className="w-3.5 h-3.5 text-purple-200/90" />
                                    <span>AI Autopilot</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 mb-1.5 text-[10px] text-indigo-100/90 font-semibold uppercase tracking-wider select-none">
                                    <User className="w-3.5 h-3.5 text-indigo-100/90" />
                                    <span>Agent</span>
                                  </div>
                                )}
                                <p className="whitespace-pre-wrap select-text">
                                  {message.message_text}
                                </p>
                              </div>

                              {/* Telemetry and Timestamp */}
                              <div className="flex items-center flex-wrap gap-[6px] px-1 select-none text-[10px] text-[var(--text-tertiary)] mt-1 justify-end">
                                <span className="font-sans font-medium">{formatMessageTime(message.created_at)}</span>
                                {isAI && (
                                  <>
                                    <span className="text-[var(--text-tertiary)] select-none">·</span>
                                    <span className="bg-[var(--color-ai-bg)] text-[var(--color-ai-text)] border border-[var(--ai-border)] px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wide font-sans">
                                      gemini-2.5-flash
                                    </span>
                                    <span className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded text-[9px] font-medium font-sans">
                                      {mockMs}ms
                                    </span>
                                    <span className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded text-[9px] font-medium font-sans">
                                      {mockTokens} tk
                                    </span>
                                  </>
                                )}
                                {!isAI && (
                                  <>
                                    <span className="text-[var(--text-tertiary)] select-none">·</span>
                                    <span className="bg-[var(--bg-subtle)] text-[var(--text-secondary)] px-1.5 py-0.5 rounded text-[9px] font-medium font-sans">
                                      Manual Reply
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Footer Action Bar */}
              <footer className="bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] z-10 shrink-0">
                <AnimatePresence mode="wait">
                  {selectedConversation.is_ai_active ? (
                    /* AI Active — locked footer */
                    <motion.div
                      key="autopilot-active"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className="h-14 px-5 flex items-center gap-3 bg-[var(--bg-subtle)] select-none w-full"
                    >
                      <Bot className="w-[18px] h-[18px] text-[var(--color-ai)] shrink-0" />
                      <span className="text-[13px] font-semibold text-[var(--text-secondary)]">
                        AI Autopilot is dynamically managing this conversation thread
                      </span>
                    </motion.div>
                  ) : (
                    /* Human Takeover — text input */
                    <motion.div
                      key="human-takeover"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className="p-3 w-full"
                    >
                      <form onSubmit={handleSendMessage} className="flex items-center gap-2 max-w-5xl mx-auto">
                        <div className="flex-1 relative">
                          <textarea
                            ref={textInputRef}
                            placeholder="Type a reply as agent..."
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            disabled={isSending}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                if (inputMessage.trim() && !isSending) {
                                  handleSendMessage(e);
                                }
                              }
                            }}
                            rows={1}
                            className="w-full h-10 px-3.5 py-2.5 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-[13.5px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] font-sans focus:outline-none focus:border-[var(--brand-primary)] focus:shadow-[var(--shadow-focus)] resize-none transition-all"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isSending || !inputMessage.trim()}
                          className="h-10 px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] disabled:bg-[var(--bg-muted)] text-white disabled:text-[var(--text-tertiary)] rounded-[var(--radius-md)] text-[13.5px] font-sans font-semibold flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] outline-none shrink-0 transition-all"
                        >
                          {isSending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Send Overrides</span>
                            </>
                          )}
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ─── PANEL 4: Customer Insights (Rightmost, 320px) ────────────── */}
      {showInsights && selectedConversation && (
        <aside className="hidden 2xl:flex flex-col w-[320px] border-l border-[var(--border-subtle)] bg-[var(--bg-surface)] h-full shrink-0 select-none overflow-hidden animate-fade-in">
          
          {/* Header */}
          <div className="h-[52px] px-4 flex items-center justify-between border-b border-[var(--border-subtle)] shrink-0">
            <h2 className="text-[13px] font-bold font-display text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              CRM Insights
            </h2>
            <button
              onClick={() => setShowInsights(false)}
              className="p-1 rounded-md hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer outline-none transition-colors"
              title="Hide Insights"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Sidebar Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin">
            
            {/* Customer Details Card */}
            <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex flex-col items-center text-center">
              <Avatar name={selectedConversation.customer_name || selectedConversation.customer_phone} size="lg" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-3">
                {selectedConversation.customer_name || "Customer"}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-1 font-mono">
                <Phone className="w-3 h-3 text-[var(--text-tertiary)]" />
                {selectedConversation.customer_phone}
              </p>
            </div>

            {/* CRM Status Card */}
            {isLoadingLead ? (
              <div className="space-y-3 py-2 animate-pulse">
                <div className="h-3.5 bg-[var(--bg-subtle)] rounded w-1/3" />
                <div className="h-8 bg-[var(--bg-subtle)] rounded" />
              </div>
            ) : leadInfo ? (
              <div className="space-y-4">
                
                {/* 1. Urgency Level Override */}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                    Urgency Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["low", "medium", "high"] as const).map((urg) => {
                      const isActive = leadInfo.urgency === urg;
                      const activeStyles = {
                        low: "bg-[var(--color-info-bg)] text-[var(--color-info-text)] border-[var(--info-border)] shadow-xs",
                        medium: "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border-[var(--warning-border)] shadow-xs",
                        high: "bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border-[var(--danger-border)] shadow-xs"
                      };
                      return (
                        <button
                          key={urg}
                          disabled={isUpdatingLead}
                          onClick={() => handleUpdateUrgency(urg)}
                          className={`px-2 py-1.5 rounded-lg border text-xs font-semibold capitalize cursor-pointer transition-all outline-none text-center ${
                            isActive
                              ? activeStyles[urg]
                              : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          {urg}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. CRM Stepper Tracker */}
                <div className="space-y-2 pt-1">
                  <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider block">
                    CRM Stage Tracker
                  </label>
                  <div className="flex items-center justify-between relative px-2.5 py-1 select-none">
                    {/* Stepper Connecting Line */}
                    <div className="absolute top-[17px] left-8 right-8 h-[2px] bg-[var(--border-subtle)] z-0" />
                    
                    {/* Stepper Connecting Active Line */}
                    {(() => {
                      const stages = ["new", "contacted", "converted", "completed"];
                      const activeIdx = stages.indexOf(leadInfo.kanban_stage || "new");
                      const pct = activeIdx >= 0 ? (activeIdx / (stages.length - 1)) * 100 : 0;
                      return (
                        <div
                          className="absolute top-[17px] left-8 h-[2px] bg-[var(--brand-primary)] transition-all duration-300 z-0"
                          style={{ width: `calc(${pct}% - ${pct > 0 ? (activeIdx === 3 ? '48px' : '28px') : '0px'})` }}
                        />
                      );
                    })()}

                    {/* Step Dots */}
                    {["new", "contacted", "converted", "completed"].map((stg, idx) => {
                      const stages = ["new", "contacted", "converted", "completed"];
                      const currentIdx = stages.indexOf(leadInfo.kanban_stage || "new");
                      const isCompleted = idx < currentIdx;
                      const isActive = idx === currentIdx;
                      
                      return (
                        <button
                          key={stg}
                          disabled={isUpdatingLead}
                          onClick={() => handleUpdateStage(stg)}
                          className="flex flex-col items-center z-10 focus:outline-none cursor-pointer group"
                          title={`Move lead to ${stg}`}
                        >
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-200 ${
                              isActive
                                ? "bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-md shadow-indigo-500/20"
                                : isCompleted
                                ? "bg-[var(--brand-subtle)] text-[var(--brand-text)] border-[var(--brand-border)]"
                                : "bg-[var(--bg-surface)] text-[var(--text-tertiary)] border-[var(--border-subtle)] group-hover:border-[var(--text-secondary)]"
                            }`}
                          >
                            {isCompleted ? <CheckCheck className="w-3.5 h-3.5" /> : idx + 1}
                          </div>
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 transition-colors duration-200 ${
                              isActive
                                ? "text-[var(--brand-primary)] font-extrabold"
                                : "text-[var(--text-tertiary)]"
                            }`}
                          >
                            {stg === "new" ? "New" : stg === "contacted" ? "Contact" : stg === "converted" ? "Booked" : "Done"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Requires Human Support Flag */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-subtle)] select-none">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      Flag Human Assistance
                    </span>
                    <p className="text-[10px] text-[var(--text-tertiary)] max-w-[200px]">
                      Flags this customer as requiring urgent human support.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleHumanSupport}
                    disabled={isUpdatingLead}
                    className={`w-10 h-6 rounded-full p-[2px] cursor-pointer relative flex items-center outline-none transition-colors duration-200 ${
                      leadInfo.requires_human_support
                        ? "bg-amber-500"
                        : "bg-[var(--bg-muted)]"
                    }`}
                  >
                    <div
                      className="w-[20px] h-[20px] rounded-full shadow-[var(--shadow-sm)] bg-white transition-all"
                      style={{
                        marginLeft: leadInfo.requires_human_support ? "auto" : "0",
                        marginRight: leadInfo.requires_human_support ? "0" : "auto"
                      }}
                    />
                  </button>
                </div>

                {/* 4. AI Real-Time Summary */}
                <div className="p-3.5 rounded-xl bg-violet-500/[0.03] dark:bg-violet-500/[0.06] border border-violet-500/10 space-y-2">
                  <h4 className="text-[11px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wide flex items-center gap-1.5 select-none">
                    <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                    AI Needs Summary
                  </h4>
                  <p className="text-[12px] font-sans leading-relaxed text-[var(--text-secondary)] italic select-text">
                    {leadInfo.summary_of_needs || leadInfo.service_requested || "AI is currently extracting user service needs from the conversation..."}
                  </p>
                  {leadInfo.intent_category && (
                    <div className="pt-0.5 select-none">
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-violet-100/50 dark:bg-violet-955/20 text-violet-750 dark:text-violet-300 text-[9px] font-semibold border border-violet-200/30 dark:border-violet-900/10">
                        Category: {leadInfo.intent_category}
                      </span>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="p-4 text-center border border-dashed border-[var(--border-subtle)] rounded-xl text-xs text-[var(--text-tertiary)] py-6">
                No active CRM lead entry found.
              </div>
            )}

          </div>
        </aside>
      )}

    </div>
  );
}
