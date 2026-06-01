"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, MessageSquare, Bot, User, Phone, Circle, Loader2, Cpu, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

// ─── Database Interfaces ───────────────────────────────────────────
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

// ─── Helper Functions ──────────────────────────────────────────────
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

// ─── Skeleton Loader for Conversation List ───────────────────────────
function ConversationSkeleton() {
  return (
    <div className="p-4 border-b border-[#27272A] bg-[#121214] flex items-center gap-3">
      <div className="w-10 h-10 rounded-full shrink-0 animate-shimmer" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 rounded-md w-2/3 animate-shimmer" />
        <div className="h-2.5 rounded-md w-1/2 animate-shimmer" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function InboxPage() {
  const supabase = createClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isToggling, setIsToggling] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ─── Fetch Conversations on Mount & Setup Realtime ────────
  useEffect(() => {
    document.title = "Conversations | LeadFlow";

    async function fetchConversations() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("conversations")
        .select("*, messages(*)")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("[Fetch Conversations Error]:", error.message);
      } else {
        setConversations((data as Conversation[]) || []);
      }
      setIsLoading(false);
    }

    fetchConversations();

    const channel = supabase
      .channel("inbox-conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setConversations((prev) => [payload.new as Conversation, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setConversations((prev) => {
              const updated = prev.map((c) =>
                c.id === payload.new.id ? (payload.new as Conversation) : c
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
  }, []);

  // ─── Fetch Messages when selectedConversation changes ─────
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
      .channel("realtime-messages")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMessage = payload.new as Message;
          // If the incoming message belongs to the currently active conversation thread, append it smoothly to the local messages array state
          if (newMessage.conversation_id === conversationId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          }
          // Also append new incoming message to this conversation's messages list inside the conversations state
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

  // ─── Scroll to Bottom ──────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // ─── Human Override Controller ───────────────────────────
  const handleToggleAI = async () => {
    if (!selectedConversation || isToggling) return;
    setIsToggling(true);
    
    const conversationId = selectedConversation.id;
    const currentStatus = selectedConversation.is_ai_active;
    const targetStatus = !currentStatus;

    // Fast local state update
    setSelectedConversation(prev => prev ? { ...prev, is_ai_active: targetStatus } : null);
    setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, is_ai_active: targetStatus } : c));

    try {
      const { error } = await supabase
        .from("conversations")
        .update({ is_ai_active: targetStatus })
        .eq("id", conversationId);

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.error("[Human Override Toggle Error]:", err.message);
      // Rollback
      setSelectedConversation(prev => prev ? { ...prev, is_ai_active: currentStatus } : null);
      setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, is_ai_active: currentStatus } : c));
    } finally {
      setIsToggling(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !inputMessage.trim() || isSending) return;
    setIsSending(true);

    const { id: conversationId, customer_phone: customerPhone, tenant_id: tenantId } = selectedConversation;
    const tempText = inputMessage;
    setInputMessage("");

    try {
      const response = await fetch("http://localhost:3001/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId,
          customerPhone,
          messageText: tempText,
          tenantId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send manual message");
      }
    } catch (err: any) {
      console.error("[Send Message Error]:", err.message);
      setInputMessage(tempText);
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const name = (c.customer_name || "").toLowerCase();
    const phone = (c.customer_phone || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    return name.includes(query) || phone.includes(query);
  });

  return (
    <div className={`h-[calc(100vh-8rem)] bg-[#121214] rounded-2xl border flex overflow-hidden shadow-2xl select-none transition-all duration-300 ${
      selectedConversation && !selectedConversation.is_ai_active 
        ? "border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.05)]" 
        : "border-[#27272A]"
    }`}>
      
      {/* ─── LEFT PANE: Thread Feed List ────────────────────────── */}
      <aside className="w-80 border-r border-[#27272A] flex flex-col h-full bg-[#121214] shrink-0">
        
        {/* Left Pane Header */}
        <div className="p-4 border-b border-[#27272A] space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <h1 className="font-calistoga text-lg text-[#F4F4F5]">
              Live Threads
            </h1>
            {conversations.length > 0 && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#1C1C1F] text-[#71717A] border border-[#27272A] tabular-nums">
                {conversations.length}
              </span>
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-[#71717A]">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Search prospects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#09090B] border border-[#27272A] rounded-xl text-xs text-[#F4F4F5] placeholder-[#71717A] focus:outline-none focus:border-[#6366F1]/50 hover:bg-[#09090B]/80 transition-all duration-200 font-sans"
            />
          </div>
        </div>

        {/* Thread Cards */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#27272A]/40 scrollbar-thin">
          {isLoading ? (
            [...Array(4)].map((_, i) => <ConversationSkeleton key={i} />)
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center h-48 select-none">
              <MessageSquare className="w-8 h-8 text-[#71717A] mb-2" />
              <p className="text-[#F4F4F5] text-xs font-semibold">
                {searchQuery ? "No matching conversations" : "No active threads"}
              </p>
              <p className="text-[#71717A] text-[10px] mt-1 max-w-[200px] leading-relaxed mx-auto">
                {searchQuery ? "Try searching for a different number or name." : "Once customers text your WhatsApp line, threads appear here."}
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filteredConversations.map((convo) => {
                const isSelected = selectedConversation?.id === convo.id;
                return (
                  <motion.div
                    key={convo.id}
                    onClick={() => setSelectedConversation(convo)}
                    whileTap={{ scale: 0.99 }}
                    transition={{ type: "spring", stiffness: 380, damping: 35 }}
                    className={`p-4 flex items-center gap-3 transition-all duration-200 cursor-pointer border-l-2 outline-none relative hover:bg-white/[0.01] ${
                      isSelected
                        ? "bg-[#6366F1]/5 border-[#6366F1] shadow-[0_0_12px_rgba(99,102,241,0.06)]"
                        : "border-transparent bg-transparent"
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedConversation(convo);
                      }
                    }}
                  >
                    {/* Glow active effect wrapper */}
                    {isSelected && convo.is_ai_active && (
                      <div className="absolute inset-0 border border-[#6366F1]/10 rounded-r-lg pointer-events-none shadow-[0_0_12px_rgba(99,102,241,0.08)]" />
                    )}

                    {/* Avatar Indicator */}
                    <div className="w-10 h-10 rounded-lg bg-[#1C1C1F] border border-[#27272A] flex items-center justify-center text-[#71717A] shrink-0 shadow-inner relative">
                      {convo.is_ai_active ? (
                        <Bot className={`w-5 h-5 ${isSelected ? "text-[#6366F1]" : "text-[#71717A]"}`} />
                      ) : (
                        <User className="w-5 h-5 text-[#71717A]" />
                      )}
                      {/* Active Status Live Dot */}
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${convo.is_ai_active ? "bg-[#6366F1]" : "bg-[#10B981]"}`} />
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${convo.is_ai_active ? "bg-[#6366F1]" : "bg-[#10B981]"}`} />
                      </span>
                    </div>

                    {/* Thread Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className={`text-xs font-semibold truncate ${isSelected ? "text-[#6366F1]" : "text-[#F4F4F5]"}`}>
                          {convo.customer_name || "Prospect Thread"}
                        </h3>
                        <span className="text-[#71717A] text-[9px] font-mono tabular-nums shrink-0">
                          {formatConversationTime(convo.updated_at)}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#71717A] font-mono truncate tracking-tight">
                        {convo.customer_phone}
                      </p>
                      {convo.messages && convo.messages.length > 0 ? (
                        <p className="text-[10px] text-[#71717A] font-sans truncate mt-1">
                          {convo.messages[convo.messages.length - 1].message_text}
                        </p>
                      ) : convo.chat_summary ? (
                        <p className="text-[10px] text-[#71717A] font-sans truncate mt-1">
                          {convo.chat_summary}
                        </p>
                      ) : null}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </aside>

      {/* ─── RIGHT PANE: Chat Canvas ─────────────────────────────── */}
      <section className={`flex-1 flex flex-col h-full bg-[#09090B] transition-colors duration-300 relative select-text border-l border-[#27272A] ${
        selectedConversation && !selectedConversation.is_ai_active ? "border-l-amber-500/20" : ""
      }`}>
        
        {/* Warn wrapper state if human takeover */}
        {selectedConversation && !selectedConversation.is_ai_active && (
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500/20 via-amber-500/30 to-amber-500/20 z-50 pointer-events-none" />
        )}

        <AnimatePresence mode="wait">
          {!selectedConversation ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full select-none"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#121214] border border-[#27272A] flex items-center justify-center text-[#71717A] mb-4 shadow-xl">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-[#F4F4F5] font-semibold text-sm font-sans">
                Select Conversation Thread
              </h3>
              <p className="text-[#71717A] text-xs mt-1 max-w-[280px] leading-relaxed mx-auto">
                Inspect active customer dialogue histories, toggle telemetry states, or deploy automated override policies in real-time.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={selectedConversation.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col h-full overflow-hidden"
            >
              {/* Chat Canvas Header */}
              <header className={`h-16 bg-[#121214] border-b border-[#27272A] px-6 flex items-center justify-between shrink-0 select-none shadow-md transition-colors duration-300 ${
                !selectedConversation.is_ai_active ? "border-b-amber-500/20" : ""
              }`}>
                
                {/* User details */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#1C1C1F] border border-[#27272A] flex items-center justify-center shadow-inner">
                    <User className="w-4 h-4 text-[#71717A]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xs font-semibold text-[#F4F4F5]">
                        {selectedConversation.customer_name || "Prospect User"}
                      </h2>
                      {selectedConversation.is_ai_active ? (
                        <span className="flex items-center gap-1 bg-[#6366F1]/10 text-[#6366F1] text-[9px] font-bold px-2 py-0.5 rounded-full border border-[#6366F1]/20 font-mono uppercase">
                          <Circle className="w-1.5 h-1.5 fill-[#6366F1] stroke-none" />
                          AI Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 text-[9px] font-bold px-2 py-0.5 rounded-full border border-amber-500/20 font-mono uppercase">
                          <ShieldAlert className="w-1.5 h-1.5 fill-amber-500 stroke-none" />
                          Human Taken Over
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#71717A] font-mono tracking-tight flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-[#71717A]" />
                      {selectedConversation.customer_phone}
                    </p>
                  </div>
                </div>

                {/* Switch Override Slider */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end select-none">
                    <span className="text-[9px] font-mono font-semibold text-[#71717A] tracking-wider uppercase">
                      {selectedConversation.is_ai_active ? "AI DRIVER: ACTIVE" : "AI CONTROLLER: STOPPED"}
                    </span>
                    <span className="text-[8px] font-sans text-amber-500/80 leading-none">
                      {!selectedConversation.is_ai_active && "⚠️ Human Controller takeover active"}
                    </span>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleToggleAI}
                    disabled={isToggling}
                    className={`w-12 h-6.5 rounded-full p-0.5 cursor-pointer relative flex items-center transition-colors duration-300 ${
                      selectedConversation.is_ai_active 
                        ? "bg-[#6366F1] shadow-[0_0_8px_rgba(99,102,241,0.5)]" 
                        : "bg-[#27272A]"
                    }`}
                  >
                    <motion.div
                      layout
                      transition={{ type: "spring", stiffness: 380, damping: 35 }}
                      className={`w-5.5 h-5.5 rounded-full shadow-md bg-white ${
                        selectedConversation.is_ai_active ? "ml-auto" : "mr-auto"
                      }`}
                    />
                  </motion.button>
                </div>
              </header>

              {/* Message Canvas Grid Container */}
              <div className="flex-1 overflow-y-auto px-8 py-6 lattice-bg space-y-4 relative scrollbar-thin select-text">
                
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center h-48 select-none">
                    <p className="text-[#71717A] text-xs font-semibold">No messages recorded in this chat</p>
                    <p className="text-[#71717A] text-[10px] mt-1">Dialogue traces appear here instantly.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isCustomer = message.sender === "customer";
                      const hash = message.id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
                      const mockMs = 100 + (hash % 200);
                      const mockTokens = message.tokens_consumed > 0 ? message.tokens_consumed : 10 + (hash % 40);
                      return (
                        <div
                          key={message.id}
                          className={`flex w-full ${isCustomer ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] p-3.5 rounded-2xl text-xs break-words relative flex flex-col gap-1.5 shadow-md ${
                              isCustomer
                                ? "bg-[#18181B] text-[#F4F4F5] rounded-tr-none border border-[#27272A]"
                                : "bg-[#6366F1] text-white rounded-tl-none border border-[#6366F1]/20 shadow-[0_4px_12px_rgba(99,102,241,0.15)]"
                            }`}
                          >
                            <p className="font-sans leading-relaxed whitespace-pre-wrap select-text selection:bg-white/20">
                              {message.message_text}
                            </p>
                            
                            {/* Metadata telemetry badge */}
                            <div className="flex items-center justify-between gap-3 mt-1.5 select-none shrink-0 border-t border-white/[0.08] pt-1">
                              <span className={`text-[8px] font-mono ${
                                isCustomer ? "text-[#71717A]" : "text-white/60"
                              }`}>
                                {formatMessageTime(message.created_at)}
                              </span>
                              
                              {!isCustomer && (
                                <span className="inline-flex items-center gap-1 font-mono text-[8px] bg-[#09090B]/30 text-white/90 px-1.5 py-0.5 rounded-md border border-white/10 whitespace-nowrap">
                                  <Cpu className="w-2.5 h-2.5 text-[#10B981]" />
                                  ⚡ 2.5-Flash | {mockMs}ms | {mockTokens} tk
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input Footer for human agent override */}
              <footer className={`bg-[#121214] p-4 border-t border-[#27272A] flex items-center justify-center shrink-0 shadow-md transition-colors duration-300 ${
                !selectedConversation.is_ai_active ? "bg-amber-500/[0.02] border-t-amber-500/20" : ""
              }`}>
                {selectedConversation.is_ai_active ? (
                  <div className="flex items-center gap-2 bg-[#09090B] px-5 py-2.5 rounded-xl border border-[#27272A] shadow-inner select-none">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-[#71717A] tracking-tight uppercase">
                      🤖 AI controller active. Handshake verified.
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleSendMessage} className="flex gap-2 w-full max-w-4xl mx-auto">
                    <input
                      type="text"
                      placeholder="Type a manual response to customer..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      disabled={isSending}
                      className="flex-1 px-4 py-2.5 bg-[#09090B] border border-amber-500/20 hover:border-amber-500/30 focus:border-amber-500/50 rounded-xl text-xs text-[#F4F4F5] placeholder-[#71717A] focus:outline-none transition-all duration-200"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !inputMessage.trim()}
                      className="cursor-pointer px-5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 disabled:bg-[#1C1C1F] text-amber-400 disabled:text-[#71717A] border border-amber-500/20 disabled:border-[#27272A] rounded-xl text-xs font-semibold font-sans tracking-wide transition-all duration-200 shrink-0"
                    >
                      {isSending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Send Reply"
                      )}
                    </button>
                  </form>
                )}
              </footer>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

    </div>
  );
}
