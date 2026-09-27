"use client";

// Backend API URL — routes to our dedicated Node.js server
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Megaphone,
  ChevronDown,
  Sparkles,
  Target,
  X,
  AlertTriangle,
  Check,
  Loader2,
  Upload,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Download,
  Users,
  Database,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/context/DashboardContext";

// ─── Types ──────────────────────────────────────────────────────────
interface Lead {
  id: string;
  customer_name: string;
  customer_phone: string;
  kanban_stage: "new" | "contacted" | "converted" | "lost" | "completed";
}

type TargetStage = "lost" | "contacted";
type AudienceSource = "crm" | "file";

interface ParsedContact {
  name: string;
  phone: string;
  isValid: boolean;
  rawRow: Record<string, any>;
}

// ─── Variable Pills Config ──────────────────────────────────────────
const VARIABLE_PILLS = [
  { label: "{customer_name}", value: "{customer_name}" },
  { label: "{business_name}", value: "{business_name}" },
];

function sanitizePhoneForWhatsApp(input: any): string {
  if (!input) return "";
  let digits = String(input).replace(/[^\d]/g, "");
  // If 10 digits starting with 6,7,8,9 (common Indian mobile format), auto prefix 91
  if (/^[6-9]\d{9}$/.test(digits)) {
    digits = "91" + digits;
  }
  return digits;
}

// ─── Main Component ─────────────────────────────────────────────────
export default function CampaignsPage() {
  const supabase = createClient();
  const { success, error: toastError, warning, info } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── State ────────────────────────────────────────────────────────
  const { user: dashboardUser, tenant: dashboardTenant } = useDashboard();
  const router = useRouter();
  const [user, setUser] = useState<any>(dashboardUser);
  const [businessName, setBusinessName] = useState(dashboardTenant?.business_name || "LeadFlow");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(!dashboardUser);
  const [subscriptionTier, setSubscriptionTier] = useState<string>(dashboardTenant?.subscription_tier || "free");

  // Audience Source Selection
  const [audienceSource, setAudienceSource] = useState<AudienceSource>("file");

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [columns, setColumns] = useState<string[]>([]);
  const [nameColumn, setNameColumn] = useState<string>("");
  const [phoneColumn, setPhoneColumn] = useState<string>("");
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [previewContactIndex, setPreviewContactIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Composer state
  const [campaignName, setCampaignName] = useState("");
  const [targetStage, setTargetStage] = useState<TargetStage>("lost");
  const [customMessage, setCustomMessage] = useState("");
  const [sendMode, setSendMode] = useState<"text" | "template">("text");
  const [templateName, setTemplateName] = useState("");
  const [templateLang, setTemplateLang] = useState("en");

  // Action state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // ─── Fetch user + leads ───────────────────────────────────────────
  useEffect(() => {
    async function init() {
      let activeUser = dashboardUser || user;
      if (!activeUser) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        activeUser = authUser;
        if (activeUser) setUser(activeUser);
      }

      if (!activeUser) {
        setIsLoading(false);
        return;
      }

      if (dashboardTenant) {
        if (dashboardTenant.business_name) setBusinessName(dashboardTenant.business_name);
        if (dashboardTenant.subscription_tier) setSubscriptionTier(dashboardTenant.subscription_tier);
      }

      // Fetch leads
      const { data: leadsData, error } = await supabase
        .from("leads")
        .select("id, customer_name, customer_phone, kanban_stage")
        .eq("tenant_id", activeUser.id);

      if (!error && leadsData) {
        setLeads(leadsData as Lead[]);
      }
      setIsLoading(false);
    }

    init();
  }, [dashboardUser, dashboardTenant, supabase]);

  // ─── Computed values ──────────────────────────────────────────────
  const targetLeads = leads.filter((l) => l.kanban_stage === targetStage);
  const stageLabel = targetStage === "lost" ? "Lost" : "Contacted";

  const validImportedContacts = parsedContacts.filter((c) => c.isValid);
  const invalidImportedCount = parsedContacts.length - validImportedContacts.length;

  const targetCount = audienceSource === "file" 
    ? validImportedContacts.length 
    : targetLeads.length;

  const isFormValid =
    customMessage.trim().length > 0 &&
    targetCount > 0 &&
    (sendMode === "text" || templateName.trim().length > 0);

  // ─── File Upload Handler ──────────────────────────────────────────
  const processUploadedFile = async (uploadedFile: File) => {
    if (!uploadedFile) return;

    // Validate extension
    const extension = uploadedFile.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls"].includes(extension || "")) {
      toastError("Unsupported format. Please upload a CSV or Excel file (.csv, .xlsx, .xls)");
      return;
    }

    setFile(uploadedFile);
    setFileName(uploadedFile.name);
    setFileSize((uploadedFile.size / 1024).toFixed(1) + " KB");

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });

      if (!json || json.length === 0) {
        toastError("Uploaded file is empty or has no data rows.");
        return;
      }

      const detectedColumns = Object.keys(json[0] || {});
      setColumns(detectedColumns);
      setRawRows(json);

      // Auto-detect Name column
      const detectedName =
        detectedColumns.find((col) =>
          /^(customer_?name|name|full_?name|first_?name|contact_?name|client|user)$/i.test(col.trim())
        ) ||
        detectedColumns.find((col) => /name/i.test(col.trim())) ||
        detectedColumns[0] ||
        "";

      // Auto-detect Phone column
      const detectedPhone =
        detectedColumns.find((col) =>
          /^(customer_?phone|phone_?number|phone|mobile_?number|mobile|whatsapp_?number|whatsapp|contact_?number|contact|number|tel)$/i.test(col.trim())
        ) ||
        detectedColumns.find((col) => /phone|mobile|number|whatsapp/i.test(col.trim())) ||
        detectedColumns[1] ||
        detectedColumns[0] ||
        "";

      setNameColumn(detectedName);
      setPhoneColumn(detectedPhone);

      // Map contacts
      const contacts: ParsedContact[] = json.map((row) => {
        const rawName = String(row[detectedName] || "").trim();
        const rawPhone = String(row[detectedPhone] || "").trim();
        const cleanPhone = sanitizePhoneForWhatsApp(rawPhone);
        const isValid = cleanPhone.length >= 7 && cleanPhone.length <= 16;
        return {
          name: rawName || "Valued Customer",
          phone: cleanPhone,
          isValid,
          rawRow: row,
        };
      });

      setParsedContacts(contacts);
      setPreviewContactIndex(0);

      // Auto-populate campaign name if user has not typed one
      if (!campaignName.trim()) {
        const cleanBase = uploadedFile.name.replace(/\.[^/.]+$/, "");
        setCampaignName(`${cleanBase.charAt(0).toUpperCase() + cleanBase.slice(1)} Campaign`);
      }

      const validCount = contacts.filter((c) => c.isValid).length;
      success(`Loaded ${uploadedFile.name}: Found ${contacts.length} contacts (${validCount} valid WhatsApp numbers).`);
    } catch (err: any) {
      console.error("Failed to parse file:", err);
      toastError("Could not read file. Please ensure it is a valid CSV or Excel file.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      processUploadedFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processUploadedFile(droppedFile);
    }
  };

  const remapColumns = (newNameCol: string, newPhoneCol: string) => {
    setNameColumn(newNameCol);
    setPhoneColumn(newPhoneCol);
    if (!rawRows || rawRows.length === 0) return;

    const contacts: ParsedContact[] = rawRows.map((row) => {
      const rawName = String(row[newNameCol] || "").trim();
      const rawPhone = String(row[newPhoneCol] || "").trim();
      const cleanPhone = sanitizePhoneForWhatsApp(rawPhone);
      const isValid = cleanPhone.length >= 7 && cleanPhone.length <= 16;
      return {
        name: rawName || "Valued Customer",
        phone: cleanPhone,
        isValid,
        rawRow: row,
      };
    });

    setParsedContacts(contacts);
    setPreviewContactIndex(0);
  };

  const handleClearFile = () => {
    setFile(null);
    setFileName("");
    setFileSize("");
    setColumns([]);
    setNameColumn("");
    setPhoneColumn("");
    setRawRows([]);
    setParsedContacts([]);
    setPreviewContactIndex(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const downloadSampleCsv = () => {
    const sampleData = [
      { "Customer Name": "Rahul Sharma", "Phone Number": "+91 98765 43210", "City": "Mumbai" },
      { "Customer Name": "Priya Patel", "Phone Number": "+91 91234 56789", "City": "Ahmedabad" },
      { "Customer Name": "Amit Verma", "Phone Number": "+91 99887 76655", "City": "Delhi" },
    ];
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csvOutput], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "leadflow_campaign_contacts_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    info("Sample CSV template downloaded. Fill your contacts and upload here!");
  };

  // ─── Preview text renderer ────────────────────────────────────────
  const getPreviewText = useCallback(
    (text: string) => {
      if (!text.trim()) return "Your message preview will appear here…";
      let nameToUse = "Grahak";

      if (audienceSource === "file" && validImportedContacts.length > 0) {
        const contact = validImportedContacts[previewContactIndex] || validImportedContacts[0];
        nameToUse = contact.name || "Grahak";
      } else if (targetLeads.length > 0) {
        nameToUse = targetLeads[0].customer_name || "Grahak";
      }

      return text
        .replace(/\{customer_name\}/g, nameToUse)
        .replace(/\{business_name\}/g, businessName);
    },
    [businessName, audienceSource, validImportedContacts, previewContactIndex, targetLeads]
  );

  // ─── Insert variable at cursor ────────────────────────────────────
  const insertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = customMessage.substring(0, start);
    const after = customMessage.substring(end);
    const newText = before + variable + after;

    setCustomMessage(newText);

    // Restore cursor position after the inserted variable
    requestAnimationFrame(() => {
      textarea.focus();
      const newPos = start + variable.length;
      textarea.setSelectionRange(newPos, newPos);
    });
  };

  // ─── Launch blast ─────────────────────────────────────────────────
  const handleLaunchBlast = async () => {
    if (!user || !isFormValid) return;
    setIsSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || "";

      const finalCampaignName =
        campaignName.trim() ||
        (fileName
          ? `${fileName.replace(/\.[^/.]+$/, "")} Blast`
          : `Broadcast ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`);

      const payload = {
        campaign_name: finalCampaignName,
        custom_message_body: customMessage.trim(),
        target_stage: audienceSource === "file" ? "csv_import" : targetStage,
        template_name: sendMode === "template" ? templateName.trim() : "",
        template_lang: sendMode === "template" ? templateLang.trim() : "en",
        recipients: audienceSource === "file"
          ? validImportedContacts.map((c) => ({
              customer_name: c.name,
              customer_phone: c.phone,
            }))
          : undefined,
      };

      const res = await fetch(`${API_URL}/api/campaigns/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        toastError(data.message || "Failed to send campaign.");
        return;
      }

      const totalSent = data.total_sent ?? 0;
      const totalFailed = data.total_failed ?? 0;

      if (totalFailed > 0 && totalSent > 0) {
        warning(data.message || `⚠️ ${totalSent} sent, ${totalFailed} failed.`);
      } else {
        success(data.message || "🚀 Blast campaign successfully sent!");
      }

      if (totalSent > 0) {
        setCampaignName("");
        setCustomMessage("");
        if (audienceSource === "file") {
          handleClearFile();
        }
      }
    } catch (err: any) {
      console.error("[Campaign Send Error]:", err);
      toastError("Network error. Please check your backend connection and try again.");
    } finally {
      setIsSending(false);
      setIsConfirmOpen(false);
    }
  };

  // ─── Current time for preview ─────────────────────────────────────
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-canvas)] relative">
      {/* Pro Plan Gate Modal */}
      {(subscriptionTier === "free" || subscriptionTier === "starter") && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-40 flex items-center justify-center p-4">
          <div className="bg-[var(--bg-surface-raised)]/95 backdrop-blur-xl border border-[var(--border-subtle)] rounded-[var(--radius-xl)] shadow-2xl p-8 max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-[var(--brand-primary)]/10 flex items-center justify-center mx-auto text-[var(--brand-primary)]">
              <Megaphone className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-display font-extrabold text-[var(--text-primary)]">
                Upgrade to Pro
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Upgrade to the Pro Plan to instantly build outbound marketing campaigns from CRM leads or imported Excel/CSV files.
              </p>
            </div>
            <button
              onClick={() => router.push("/pricing")}
              className="w-full h-11 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] hover:brightness-110 text-white rounded-[var(--radius-lg)] text-sm font-semibold transition-all active:scale-[0.98] shadow-md cursor-pointer flex items-center justify-center"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 py-6 space-y-5 max-w-[1400px] mx-auto">
        {/* ─── Page Header ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] flex items-center justify-center shadow-[var(--shadow-md)] overflow-hidden shrink-0">
              <motion.svg
                viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"
                animate={{ rotate: [0, -3, 3, 0], scale: [1, 1.03, 1.03, 1] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              >
                <path d="M11.66 18H2v-6h9.66" />
                <path d="M16 18l5 3v-18l-5 3z" />
                <motion.path d="M22 10a4 4 0 0 1 0 4" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2 }} />
                <motion.path d="M23 8a8 8 0 0 1 0 8" animate={{ opacity: [0.1, 1, 0.1] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} />
              </motion.svg>
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-[var(--text-primary)] leading-tight">
                WhatsApp Campaign Blast
              </h2>
              <p className="text-xs text-[var(--text-secondary)] font-sans">
                Broadcast personalized messages to your CRM leads or uploaded Excel / CSV contact lists
              </p>
            </div>
          </div>

          {/* Quick template download button */}
          <button
            type="button"
            onClick={downloadSampleCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer shadow-xs self-start sm:self-center"
          >
            <Download className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
            <span>Download Sample CSV</span>
          </button>
        </div>

        {/* ─── Main Grid: Composer + Preview ──────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {/* ═══ LEFT PANEL — THE COMPOSER ═══ */}
          <div className="space-y-4">
            {/* Campaign Details Card */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-4 sm:p-5 space-y-4 shadow-xs">
              {/* Campaign Name */}
              <div>
                <label
                  htmlFor="campaign-name"
                  className="block text-[11px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] mb-1.5"
                >
                  Campaign Name
                </label>
                <input
                  id="campaign-name"
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Festive Ceramic Coating Special Offer"
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] px-3.5 py-2.5 text-sm font-sans text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--brand-primary)] focus:shadow-[var(--shadow-focus)] transition-all duration-200"
                />
              </div>

              {/* ─── Audience Source Selector Tabs ─── */}
              <div className="space-y-2">
                <label className="block text-[11px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px]">
                  Target Audience Source
                </label>
                <div className="grid grid-cols-2 gap-2 bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-subtle)]">
                  <button
                    type="button"
                    onClick={() => setAudienceSource("file")}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      audienceSource === "file"
                        ? "bg-[var(--bg-surface)] text-[var(--brand-primary)] shadow-xs border border-[var(--border-subtle)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Upload CSV / Excel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAudienceSource("crm")}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      audienceSource === "crm"
                        ? "bg-[var(--bg-surface)] text-[var(--brand-primary)] shadow-xs border border-[var(--border-subtle)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    <Database className="w-4 h-4" />
                    <span>CRM Pipeline Leads</span>
                  </button>
                </div>
              </div>

              {/* ─── AUDIENCE SOURCE A: FILE UPLOAD ─── */}
              {audienceSource === "file" && (
                <div className="space-y-3 pt-1">
                  {!file ? (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                        isDragging
                          ? "border-[var(--brand-primary)] bg-[var(--brand-subtle)]/30 scale-[1.01]"
                          : "border-[var(--border-default)] hover:border-[var(--brand-primary)]/70 hover:bg-[var(--bg-subtle)]"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-3">
                        <Upload className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                        Drop your CSV or Excel file here
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] mb-3">
                        Supports <span className="font-mono text-emerald-400 font-medium">.xlsx</span>,{" "}
                        <span className="font-mono text-emerald-400 font-medium">.xls</span>, and{" "}
                        <span className="font-mono text-emerald-400 font-medium">.csv</span> files
                      </p>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] shadow-2xs">
                        Browse Files
                      </span>
                    </div>
                  ) : (
                    /* Uploaded File Info Card */
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <FileSpreadsheet className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                              {fileName}
                            </p>
                            <p className="text-[11px] text-[var(--text-secondary)]">
                              {fileSize} • {parsedContacts.length} rows detected
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2.5 py-1 text-xs rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={handleClearFile}
                            className="p-1 text-[var(--text-tertiary)] hover:text-red-400 rounded-md hover:bg-red-500/10 cursor-pointer transition-colors"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Column Mapping Selectors */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-500/15">
                        <div>
                          <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] mb-1">
                            Name Column ({`{customer_name}`})
                          </label>
                          <div className="relative">
                            <select
                              value={nameColumn}
                              onChange={(e) => remapColumns(e.target.value, phoneColumn)}
                              className="w-full appearance-none bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] pr-8 cursor-pointer focus:outline-none focus:border-[var(--brand-primary)]"
                            >
                              {columns.map((col) => (
                                <option key={col} value={col}>
                                  {col}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)] pointer-events-none" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] mb-1">
                            WhatsApp Phone Column
                          </label>
                          <div className="relative">
                            <select
                              value={phoneColumn}
                              onChange={(e) => remapColumns(nameColumn, e.target.value)}
                              className="w-full appearance-none bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] pr-8 cursor-pointer focus:outline-none focus:border-[var(--brand-primary)]"
                            >
                              {columns.map((col) => (
                                <option key={col} value={col}>
                                  {col}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)] pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Mini Contact Preview Table */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                          <span>Contacts Preview (First 5):</span>
                          <span className="text-emerald-400 font-semibold tabular-nums">
                            {validImportedContacts.length} valid / {invalidImportedCount} skipped
                          </span>
                        </div>
                        <div className="max-h-36 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[var(--bg-subtle)] text-[10px] text-[var(--text-tertiary)] uppercase sticky top-0">
                              <tr>
                                <th className="py-1.5 px-2.5">#</th>
                                <th className="py-1.5 px-2.5">Customer Name</th>
                                <th className="py-1.5 px-2.5">Phone Number</th>
                                <th className="py-1.5 px-2.5 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-subtle)] font-sans">
                              {parsedContacts.slice(0, 5).map((contact, idx) => (
                                <tr key={idx} className="hover:bg-[var(--bg-subtle)]/50">
                                  <td className="py-1.5 px-2.5 text-[var(--text-tertiary)] tabular-nums">{idx + 1}</td>
                                  <td className="py-1.5 px-2.5 font-medium text-[var(--text-primary)] truncate max-w-[120px]">
                                    {contact.name}
                                  </td>
                                  <td className="py-1.5 px-2.5 font-mono text-[var(--text-secondary)] tabular-nums">
                                    {contact.phone || "(empty)"}
                                  </td>
                                  <td className="py-1.5 px-2.5 text-right">
                                    {contact.isValid ? (
                                      <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 font-medium">
                                        <CheckCircle2 className="w-3 h-3" /> Valid
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-400 font-medium" title="Invalid phone length or missing digits">
                                        <AlertCircle className="w-3 h-3" /> Skipped
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── AUDIENCE SOURCE B: CRM PIPELINE ─── */}
              {audienceSource === "crm" && (
                <div>
                  <label
                    htmlFor="target-stage"
                    className="block text-[11px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] mb-1.5"
                  >
                    Target Audience Pipeline Stage
                  </label>
                  <div className="relative">
                    <select
                      id="target-stage"
                      value={targetStage}
                      onChange={(e) => setTargetStage(e.target.value as TargetStage)}
                      className="w-full appearance-none bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] px-3.5 py-2.5 text-sm font-sans text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] focus:shadow-[var(--shadow-focus)] cursor-pointer transition-all duration-200 pr-10"
                    >
                      <option value="lost">Lost Leads Only</option>
                      <option value="contacted">Contacted Leads Only</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)] pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Dispatch Method Selection */}
              <div className="space-y-2">
                <label className="block text-[11px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px]">
                  Dispatch Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Standard Text Mode Option */}
                  <button
                    type="button"
                    id="mode-text-btn"
                    onClick={() => setSendMode("text")}
                    className={`flex flex-col items-start p-3.5 rounded-[var(--radius-lg)] border text-left cursor-pointer transition-all duration-200 relative overflow-hidden ${
                      sendMode === "text"
                        ? "bg-gradient-to-br from-[var(--brand-subtle)] to-[var(--bg-surface)] dark:from-[var(--brand-subtle)] dark:to-transparent border-[var(--brand-primary)] text-[var(--text-primary)] shadow-sm scale-[1.01]"
                        : "bg-[var(--bg-subtle)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                    }`}
                  >
                    {sendMode === "text" && (
                      <motion.div
                        layoutId="active-dispatch-indicator"
                        className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--brand-primary)] shadow-[0_0_8px_var(--brand-primary)]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      <Send className={`w-3.5 h-3.5 ${sendMode === "text" ? "text-[var(--brand-primary)]" : "text-[var(--text-secondary)]"}`} />
                      <span className="text-xs font-semibold">Standard Text</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-tertiary)] leading-normal">
                      Free session. Best if contacts interacted recently.
                    </span>
                  </button>

                  {/* Template Mode Option */}
                  <button
                    type="button"
                    id="mode-template-btn"
                    onClick={() => setSendMode("template")}
                    className={`flex flex-col items-start p-3.5 rounded-[var(--radius-lg)] border text-left cursor-pointer transition-all duration-200 relative overflow-hidden ${
                      sendMode === "template"
                        ? "bg-gradient-to-br from-[var(--brand-subtle)] to-[var(--bg-surface)] dark:from-[var(--brand-subtle)] dark:to-transparent border-[var(--brand-primary)] text-[var(--text-primary)] shadow-sm scale-[1.01]"
                        : "bg-[var(--bg-subtle)] border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                    }`}
                  >
                    {sendMode === "template" && (
                      <motion.div
                        layoutId="active-dispatch-indicator"
                        className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--brand-primary)] shadow-[0_0_8px_var(--brand-primary)]"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className={`w-3.5 h-3.5 ${sendMode === "template" ? "text-[var(--brand-primary)]" : "text-[var(--text-secondary)]"}`} />
                      <span className="text-xs font-semibold">Meta Template</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-tertiary)] leading-normal">
                      Required for cold/CSV leads. Bypasses 24h limit.
                    </span>
                  </button>
                </div>
              </div>

              {/* Template Configuration Fields (Conditional) */}
              <AnimatePresence>
                {sendMode === "template" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0, marginTop: 0 }}
                    animate={{ height: "auto", opacity: 1, marginTop: 12 }}
                    exit={{ height: 0, opacity: 0, marginTop: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden space-y-3 bg-[var(--bg-subtle)] p-4 rounded-[var(--radius-lg)] border border-[var(--border-default)]"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="template-name"
                          className="block text-[10px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] mb-1"
                        >
                          Template Name
                        </label>
                        <input
                          id="template-name"
                          type="text"
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          placeholder="e.g. campaign_blast"
                          className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs font-sans text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--brand-primary)]"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="template-lang"
                          className="block text-[10px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] mb-1"
                        >
                          Language Code
                        </label>
                        <input
                          id="template-lang"
                          type="text"
                          value={templateLang}
                          onChange={(e) => setTemplateLang(e.target.value)}
                          placeholder="e.g. en"
                          className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs font-sans text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--brand-primary)]"
                        />
                      </div>
                    </div>
                    <div className="text-[10px] text-[var(--text-tertiary)] leading-normal flex items-start gap-1 select-none">
                      <span>💡</span>
                      <span>
                        Make sure this template is pre-approved in your Meta Business Suite before blasting cold contacts.
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Custom Message */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="custom-message"
                    className="block text-[11px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px]"
                  >
                    Custom WhatsApp Message
                  </label>
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)] select-none tabular-nums">
                    {customMessage.length} chars
                  </span>
                </div>
                <textarea
                  ref={textareaRef}
                  id="custom-message"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Hi {customer_name}, we have an exclusive seasonal offer for you from {business_name}! ✨ Reply YES to claim."
                  rows={5}
                  className="w-full bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] px-3.5 py-2.5 text-sm font-sans text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--brand-primary)] focus:shadow-[var(--shadow-focus)] transition-all duration-200 resize-none leading-relaxed"
                />
                <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-sans text-[var(--text-tertiary)] font-medium mr-0.5 select-none">
                      Dynamic Variables:
                    </span>
                    {VARIABLE_PILLS.map((pill) => (
                      <button
                        key={pill.value}
                        type="button"
                        onClick={() => insertVariable(pill.value)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-[var(--brand-subtle)] text-[var(--brand-primary)] border border-[var(--brand-border)] hover:bg-[var(--brand-muted)] active:scale-[0.97] cursor-pointer transition-all select-none"
                      >
                        <Sparkles className="w-3 h-3" />
                        {pill.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Audience Audit Counter (Bento-style) ─────────────────── */}
            <motion.div
              layout
              className={`rounded-[var(--radius-xl)] border p-4 flex items-center gap-4 select-none shadow-[var(--shadow-xs)] transition-all duration-300 ${
                targetCount > 0
                  ? "bg-gradient-to-br from-[var(--color-info-bg)] via-[var(--bg-surface)] to-[var(--color-info-bg)] dark:from-[var(--color-info-bg)]/20 dark:via-zinc-900/10 dark:to-[var(--color-info-bg)]/20 border-[var(--info-border)]"
                  : "bg-gradient-to-br from-[var(--color-warning-bg)] via-[var(--bg-surface)] to-[var(--color-warning-bg)] dark:from-[var(--color-warning-bg)]/20 dark:via-zinc-900/10 dark:to-[var(--color-warning-bg)]/20 border-[var(--warning-border)]"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-105 ${
                  targetCount > 0
                    ? "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                    : "bg-[var(--warning-icon)]/10 text-[var(--warning-icon)]"
                }`}
              >
                {targetCount > 0 ? (
                  <div className="relative">
                    <span className="absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75 animate-ping -top-0.5 -right-0.5" />
                    <motion.svg
                      viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="relative"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                    >
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="6" />
                      <circle cx="12" cy="12" r="2" fill="currentColor" />
                    </motion.svg>
                  </div>
                ) : (
                  <motion.svg
                    viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    animate={{ rotate: [-4, 4, -4] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <motion.line x1="12" y1="17" x2="12.01" y2="17" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} />
                  </motion.svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                {isLoading ? (
                  <div className="h-4 w-48 bg-[var(--bg-muted)] rounded animate-pulse" />
                ) : targetCount > 0 ? (
                  <p className="text-[13.5px] font-sans text-[var(--text-primary)] leading-relaxed">
                    Targeting{" "}
                    <span className="font-bold text-[var(--brand-primary)] tabular-nums bg-[var(--brand-subtle)] px-1.5 py-0.5 rounded-md border border-[var(--brand-border)]">
                      {targetCount}
                    </span>{" "}
                    recipient{targetCount !== 1 ? "s" : ""} via{" "}
                    <span className="font-semibold text-[var(--brand-primary)] bg-[var(--brand-subtle)] px-1.5 py-0.5 rounded-md border border-[var(--brand-border)]">
                      {audienceSource === "file" ? `Imported File (${fileName || "Uploaded"})` : `${stageLabel} Stage`}
                    </span>
                    .
                  </p>
                ) : (
                  <p className="text-[13.5px] font-sans text-[var(--color-warning-text)] leading-relaxed">
                    {audienceSource === "file"
                      ? "No valid phone numbers found in the uploaded file. Please upload an Excel/CSV file with a phone number column."
                      : `No leads found in the '${stageLabel}' CRM stage. This blast will have zero recipients.`}
                  </p>
                )}
              </div>
              {!isLoading && (
                <div
                  className={`text-3xl font-display font-black tracking-tight tabular-nums shrink-0 ${
                    targetCount > 0
                      ? "text-[var(--brand-primary)]"
                      : "text-[var(--warning-icon)]"
                  }`}
                >
                  {targetCount}
                </div>
              )}
            </motion.div>

            {/* ─── Launch Button ──────────────────────────── */}
            <button
              type="button"
              onClick={() => {
                if (!campaignName.trim()) {
                  const defaultName = fileName
                    ? `${fileName.replace(/\.[^/.]+$/, "")} Blast`
                    : `Campaign ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
                  setCampaignName(defaultName);
                }
                setIsConfirmOpen(true);
              }}
              disabled={!isFormValid || isSending}
              className={`w-full flex items-center justify-center gap-2.5 h-12 rounded-[var(--radius-lg)] text-sm font-display font-semibold tracking-wide transition-all duration-200 select-none ${
                isFormValid && !isSending
                  ? "bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] text-white shadow-[var(--shadow-md)] hover:shadow-[var(--shadow-lg)] hover:brightness-110 active:scale-[0.98] cursor-pointer"
                  : "bg-[var(--bg-muted)] text-[var(--text-disabled)] cursor-not-allowed opacity-60"
              }`}
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  Launching Blast…
                </>
              ) : (
                <>
                  <Send className="w-4.5 h-4.5" />
                  Launch WhatsApp Blast ({targetCount} Recipients)
                </>
              )}
            </button>

            {!isFormValid && (
              <p className="text-[11px] text-center text-[var(--text-tertiary)] flex items-center justify-center gap-1.5 mt-1 select-none">
                {!customMessage.trim() ? (
                  <><span>✍️</span> <span>Type your message above to enable launching.</span></>
                ) : targetCount === 0 ? (
                  <><span>📋</span> <span>No valid phone numbers found. Please upload a file with contacts.</span></>
                ) : sendMode === "template" && !templateName.trim() ? (
                  <><span>🏷️</span> <span>Please enter your Meta approved template name above.</span></>
                ) : null}
              </p>
            )}
          </div>

          {/* ═══ RIGHT PANEL — LIVE WHATSAPP PREVIEW ═══ */}
          <div className="space-y-3">
            <div className="flex items-center justify-between select-none">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--success-icon)] animate-pulse" />
                <span className="text-[11px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-[1px]">
                  Live Message Preview
                </span>
              </div>

              {/* Contact Pager for Imported Contacts */}
              {audienceSource === "file" && validImportedContacts.length > 1 && (
                <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] px-2 py-0.5 rounded-lg border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                  <button
                    type="button"
                    onClick={() => setPreviewContactIndex((prev) => Math.max(0, prev - 1))}
                    disabled={previewContactIndex === 0}
                    className="p-0.5 hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer"
                    title="Previous contact"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-[10px] tabular-nums">
                    Contact {previewContactIndex + 1}/{validImportedContacts.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewContactIndex((prev) => Math.min(validImportedContacts.length - 1, prev + 1))}
                    disabled={previewContactIndex >= validImportedContacts.length - 1}
                    className="p-0.5 hover:text-[var(--text-primary)] disabled:opacity-30 cursor-pointer"
                    title="Next contact"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <span
                className={`px-2 py-0.5 rounded-[var(--radius-sm)] text-[9px] font-mono font-bold uppercase tracking-[0.5px] border ${
                  sendMode === "template"
                    ? "bg-purple-100 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/30"
                    : "bg-blue-100 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30"
                }`}
              >
                {sendMode === "template" ? `Template: ${templateName || "unnamed"}` : "Text (Session)"}
              </span>
            </div>

            {/* Recipient Identity Banner for Preview */}
            {audienceSource === "file" && validImportedContacts.length > 0 && (
              <div className="bg-[var(--bg-surface)] border border-emerald-500/20 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>
                    Simulating send to:{" "}
                    <strong className="text-[var(--text-primary)]">
                      {validImportedContacts[previewContactIndex]?.name}
                    </strong>{" "}
                    <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
                      (+{validImportedContacts[previewContactIndex]?.phone})
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* WhatsApp Premium Glass Mockup (Desktop) */}
            <div className="relative mx-auto max-w-[365px] rounded-[36px] border-[8px] border-slate-900 bg-slate-950 p-1.5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] overflow-hidden">
              {/* Phone Speaker & Camera Bezel Notch */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-900 rounded-full z-40 flex items-center justify-center gap-1.5 px-3">
                <div className="w-8 h-1 bg-slate-800 rounded-full" />
                <div className="w-2.5 h-2.5 bg-slate-850 rounded-full border border-slate-750" />
              </div>

              {/* Gloss highlight reflex shine (diagonal line overlay) */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent rotate-12 pointer-events-none z-30" />

              <div className="rounded-[28px] overflow-hidden border border-slate-800/20 bg-[#0B141A]">
                {/* WA Header */}
                <div className="bg-[#1F2C33] px-4 pt-5 pb-3 flex items-center gap-3 select-none">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                    {businessName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-xs truncate">
                      {businessName}
                    </h3>
                    <p className="text-[#8696A0] text-[10px] leading-tight">Official WhatsApp Business</p>
                  </div>
                </div>

                {/* WA Chat Body */}
                <div
                  className="p-4 space-y-3 min-h-[360px] flex flex-col justify-end bg-repeat relative"
                  style={{
                    backgroundColor: "#0B141A",
                    backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 1px, transparent 1px)`,
                    backgroundSize: "16px 16px",
                  }}
                >
                  <div className="self-center bg-[#182229]/90 backdrop-blur-xs text-[#8696A0] text-[10px] font-sans px-2.5 py-1 rounded-md shadow-xs select-none">
                    TODAY
                  </div>

                  {/* Outbound Bubble */}
                  <motion.div
                    key={previewContactIndex + customMessage}
                    initial={{ scale: 0.95, opacity: 0, y: 8 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="self-end max-w-[85%] bg-[#005C4B] text-[#E9EDEF] rounded-2xl rounded-tr-xs p-3 text-xs leading-relaxed shadow-md relative group font-sans break-words"
                  >
                    <p className="whitespace-pre-wrap">{getPreviewText(customMessage)}</p>
                    <div className="flex items-center justify-end gap-1 mt-1 select-none">
                      <span className="text-[9px] text-[#8696A0] tabular-nums font-mono">
                        {currentTime}
                      </span>
                      <svg className="w-3.5 h-3.5 text-[#53BDEB]" viewBox="0 0 16 15" fill="none">
                        <path d="M15.01 3.316l-7.58 7.58-3.43-3.43.7-.7 2.73 2.73 6.88-6.88.7.7z" fill="currentColor" />
                        <path d="M11.58 3.316l-7.58 7.58-3.43-3.43.7-.7 2.73 2.73 6.88-6.88.7.7z" fill="currentColor" />
                      </svg>
                    </div>
                  </motion.div>
                </div>

                {/* WA Footer Mockup */}
                <div className="bg-[#1F2C33] px-3 py-2 flex items-center gap-2 select-none border-t border-white/5">
                  <div className="flex-1 bg-[#2A3942] rounded-full h-7 px-3 flex items-center text-[10px] text-[#8696A0]">
                    Type a message…
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#00A884] flex items-center justify-center text-white">
                    <Send className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Confirmation Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {isConfirmOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSending && setIsConfirmOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div className="bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] shadow-2xl max-w-lg w-full overflow-hidden pointer-events-auto">
                <div className="p-5 pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-warning-bg)] flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5 text-[var(--warning-icon)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-display font-semibold text-[var(--text-primary)] leading-tight mb-1">
                        Confirm WhatsApp Blast Launch
                      </h3>
                      <p className="text-[13px] font-sans text-[var(--text-secondary)] leading-relaxed">
                        Are you sure you want to blast this personalized message to{" "}
                        <span className="font-bold text-[var(--text-primary)] tabular-nums">
                          {targetCount}
                        </span>{" "}
                        recipient{targetCount !== 1 ? "s" : ""}? Each recipient will receive their respective name substituted automatically.
                      </p>
                    </div>
                    <button
                      onClick={() => !isSending && setIsConfirmOpen(false)}
                      className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-1 rounded-[var(--radius-md)] hover:bg-[var(--bg-subtle)] cursor-pointer transition-colors"
                      aria-label="Close dialog"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* Campaign Summary Box */}
                <div className="mx-5 mb-4 p-3.5 bg-[var(--bg-subtle)] rounded-[var(--radius-md)] border border-[var(--border-subtle)] space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-sans">
                    <div>
                      <span className="text-[var(--text-tertiary)] uppercase tracking-[0.5px] font-semibold">
                        Campaign
                      </span>
                      <p className="text-[var(--text-primary)] font-medium mt-0.5 truncate">
                        {campaignName}
                      </p>
                    </div>
                    <div>
                      <span className="text-[var(--text-tertiary)] uppercase tracking-[0.5px] font-semibold">
                        Audience Source
                      </span>
                      <p className="text-[var(--text-primary)] font-medium mt-0.5 truncate">
                        {audienceSource === "file" ? `File (${fileName || "CSV/Excel"})` : `${stageLabel} Stage`}
                      </p>
                    </div>
                    <div>
                      <span className="text-[var(--text-tertiary)] uppercase tracking-[0.5px] font-semibold">
                        Recipients
                      </span>
                      <p className="text-[var(--brand-primary)] font-bold mt-0.5 tabular-nums">
                        {targetCount} contacts
                      </p>
                    </div>
                  </div>

                  {audienceSource === "file" && validImportedContacts.length > 0 && (
                    <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)]">
                      <span className="text-[var(--text-tertiary)]">First recipient preview: </span>
                      <strong className="text-[var(--text-primary)]">{validImportedContacts[0].name}</strong>{" "}
                      <span className="font-mono text-[var(--text-tertiary)]">({validImportedContacts[0].phone})</span>
                    </div>
                  )}
                </div>

                {/* Dialog actions */}
                <div className="px-5 pb-5 flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => !isSending && setIsConfirmOpen(false)}
                    disabled={isSending}
                    className="px-4 py-2 rounded-[var(--radius-md)] text-[13px] font-sans font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLaunchBlast}
                    disabled={isSending}
                    className="px-5 py-2 rounded-[var(--radius-md)] text-[13px] font-display font-semibold text-white bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] hover:brightness-110 shadow-[var(--shadow-sm)] cursor-pointer transition-all active:scale-[0.98] flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Blasting Messages…
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Confirm & Blast ({targetCount})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
