"use client";

// Backend API URL — routes to our dedicated Node.js server
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Search,
  Paperclip,
  Pencil,
  Plus,
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
  id: string;
  name: string;
  phone: string;
  isValid: boolean;
  rawRow: Record<string, any>;
}

// ─── Variable Pills Config ──────────────────────────────────────────
const VARIABLE_PILLS = [
  { label: "{name}", value: "{name}" },
  { label: "{customer_name}", value: "{customer_name}" },
  { label: "{business_name}", value: "{business_name}" },
];

function sanitizePhoneForWhatsApp(input: any): string {
  if (!input) return "";
  let digits = String(input).replace(/^[pP]:/, "").replace(/[^\d]/g, "");
  // If 10 digits starting with 6,7,8,9 (common Indian mobile format), auto prefix 91
  if (/^[6-9]\d{9}$/.test(digits)) {
    digits = "91" + digits;
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = "91" + digits.substring(1);
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
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [columns, setColumns] = useState<string[]>([]);
  const [nameColumn, setNameColumn] = useState<string>("");
  const [phoneColumn, setPhoneColumn] = useState<string>("");
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [parsedContacts, setParsedContacts] = useState<ParsedContact[]>([]);
  const [previewContactIndex, setPreviewContactIndex] = useState(0);
  const [previewLimit, setPreviewLimit] = useState<number | "all">(100);
  const [searchQuery, setSearchQuery] = useState("");
  const [sendLimit, setSendLimit] = useState<number | "all">("all");
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

  // PDF Attachment state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>("");
  const [pdfFileName, setPdfFileName] = useState<string>("");
  const [pdfFileSize, setPdfFileSize] = useState<string>("");
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Contact Editing & Management State
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editPhone, setEditPhone] = useState<string>("");
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // Approved WhatsApp Meta Templates
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

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

        // Fetch pre-approved Meta templates for this tenant
        if (dashboardTenant.id) {
          setIsLoadingTemplates(true);
          fetch(`${API_URL}/api/whatsapp/templates?tenantId=${dashboardTenant.id}`)
            .then((r) => r.json())
            .then((data) => {
              if (data.templates && Array.isArray(data.templates)) {
                setAvailableTemplates(data.templates);
              }
            })
            .catch((err) => console.error("[Campaigns] Templates fetch error:", err))
            .finally(() => setIsLoadingTemplates(false));
        }
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

  const targetContacts = useMemo(() => {
    if (sendLimit === "all") return validImportedContacts;
    return validImportedContacts.slice(0, sendLimit);
  }, [validImportedContacts, sendLimit]);

  const targetCount = audienceSource === "file" 
    ? targetContacts.length 
    : targetLeads.length;

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return parsedContacts;
    const q = searchQuery.toLowerCase().trim();
    return parsedContacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        Object.values(c.rawRow || {}).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [parsedContacts, searchQuery]);

  const displayContacts = useMemo(() => {
    if (previewLimit === "all") return filteredContacts;
    return filteredContacts.slice(0, previewLimit);
  }, [filteredContacts, previewLimit]);

  const isFormValid =
    customMessage.trim().length > 0 &&
    targetCount > 0 &&
    !isUploadingPdf &&
    (sendMode === "text" || templateName.trim().length > 0);

  // ─── File Upload Handler ──────────────────────────────────────────
  const processUploadedFile = async (uploadedFile: File) => {
    if (!uploadedFile) return;

    // Validate extension
    const extension = uploadedFile.name.split(".").pop()?.toLowerCase();
    if (!["csv", "xlsx", "xls", "pdf"].includes(extension || "")) {
      toastError("Unsupported format. Please upload a CSV, Excel (.xlsx, .xls), or PDF file (.pdf)");
      return;
    }

    setFile(uploadedFile);
    setFileName(uploadedFile.name);
    setFileSize((uploadedFile.size / 1024).toFixed(1) + " KB");

    // Handle PDF documents via dedicated server extraction pipeline
    if (extension === "pdf") {
      setIsParsingFile(true);
      try {
        const arrayBuffer = await uploadedFile.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
        }
        const base64 = btoa(binary);

        const res = await fetch(`${API_URL}/api/parse-pdf`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            base64,
            fileName: uploadedFile.name,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to extract contacts from PDF.");
        }

        const detectedColumns = data.columns || ["Name", "Mobile No."];
        const json = data.rows || [];

        if (json.length === 0) {
          toastError("Uploaded PDF has no contact rows with phone numbers.");
          setIsParsingFile(false);
          return;
        }

        setColumns(detectedColumns);
        setRawRows(json);

        const detectedName = data.nameColumn || "Name";
        const detectedPhone = data.phoneColumn || "Mobile No.";

        setNameColumn(detectedName);
        setPhoneColumn(detectedPhone);

        const contacts: ParsedContact[] = json.map((row: any, idx: number) => {
          const rawName = String(row[detectedName] || "").trim();
          const rawPhone = String(row[detectedPhone] || "").trim();
          const cleanPhone = sanitizePhoneForWhatsApp(rawPhone);
          const isValid = cleanPhone.length >= 7 && cleanPhone.length <= 16;
          return {
            id: `c_pdf_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            name: rawName || "Valued Customer",
            phone: cleanPhone,
            isValid,
            rawRow: row,
          };
        });

        setParsedContacts(contacts);
        setPreviewContactIndex(0);

        if (!campaignName.trim()) {
          const cleanBase = uploadedFile.name.replace(/\.[^/.]+$/, "");
          setCampaignName(`${cleanBase.charAt(0).toUpperCase() + cleanBase.slice(1)} Campaign`);
        }

        const validCount = contacts.filter((c) => c.isValid).length;
        success(`Loaded ${uploadedFile.name}: Extracted ${contacts.length} contacts (${validCount} valid WhatsApp numbers).`);
      } catch (err: any) {
        console.error("Failed to parse PDF:", err);
        toastError(err.message || "Could not read PDF. Ensure it contains tabular text with customer names and mobile numbers.");
      } finally {
        setIsParsingFile(false);
      }
      return;
    }

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
      const contacts: ParsedContact[] = json.map((row, idx) => {
        const rawName = String(row[detectedName] || "").trim();
        const rawPhone = String(row[detectedPhone] || "").trim();
        const cleanPhone = sanitizePhoneForWhatsApp(rawPhone);
        const isValid = cleanPhone.length >= 7 && cleanPhone.length <= 16;
        return {
          id: `c_sheet_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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

    const contacts: ParsedContact[] = rawRows.map((row, idx) => {
      const rawName = String(row[newNameCol] || "").trim();
      const rawPhone = String(row[newPhoneCol] || "").trim();
      const cleanPhone = sanitizePhoneForWhatsApp(rawPhone);
      const isValid = cleanPhone.length >= 7 && cleanPhone.length <= 16;
      return {
        id: `c_remap_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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
        .replace(/\{name\}/g, nameToUse)
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

  // ─── Contact Editing & Management Handlers ───────────────────────
  const startEditingContact = (contact: ParsedContact) => {
    setEditingContactId(contact.id);
    setEditName(contact.name);
    setEditPhone(contact.phone);
  };

  const saveEditingContact = (contactId: string) => {
    if (!editPhone.trim()) {
      toastError("Phone number cannot be empty.");
      return;
    }

    const cleanPhone = sanitizePhoneForWhatsApp(editPhone);
    const isValid = cleanPhone.length >= 7 && cleanPhone.length <= 16;

    setParsedContacts((prev) =>
      prev.map((c) => {
        if (c.id === contactId) {
          return {
            ...c,
            name: editName.trim() || "Valued Customer",
            phone: cleanPhone,
            isValid,
          };
        }
        return c;
      })
    );

    setEditingContactId(null);
    setEditName("");
    setEditPhone("");

    if (!isValid) {
      warning("Contact updated, but phone number format seems invalid (must be 7–16 digits).");
    } else {
      success("Contact updated!");
    }
  };

  const cancelEditingContact = () => {
    setEditingContactId(null);
    setEditName("");
    setEditPhone("");
  };

  const deleteContact = (contactId: string) => {
    setParsedContacts((prev) => prev.filter((c) => c.id !== contactId));
    info("Contact removed from campaign list.");
  };

  const clearSkippedContacts = () => {
    const skippedCount = parsedContacts.filter((c) => !c.isValid).length;
    if (skippedCount === 0) return;
    setParsedContacts((prev) => prev.filter((c) => c.isValid));
    success(`Removed ${skippedCount} invalid contact${skippedCount > 1 ? "s" : ""} from list.`);
  };

  const handleSaveNewContact = () => {
    if (!newPhone.trim()) {
      toastError("Please enter a phone number.");
      return;
    }
    const cleanPhone = sanitizePhoneForWhatsApp(newPhone);
    const isValid = cleanPhone.length >= 7 && cleanPhone.length <= 16;
    const newContact: ParsedContact = {
      id: `c_manual_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newName.trim() || "Valued Customer",
      phone: cleanPhone,
      isValid,
      rawRow: { [nameColumn || "Name"]: newName, [phoneColumn || "Phone"]: cleanPhone },
    };

    setParsedContacts((prev) => [newContact, ...prev]);
    setNewName("");
    setNewPhone("");
    setIsAddingContact(false);
    success(`Added ${newContact.name} to campaign list!`);
  };

  // ─── PDF Attachment Handlers ─────────────────────────────────────
  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      toastError("Only PDF files are supported for document attachments.");
      if (pdfInputRef.current) pdfInputRef.current.value = "";
      return;
    }

    if (selected.size > 50 * 1024 * 1024) {
      toastError("PDF exceeds the 50MB file size limit.");
      if (pdfInputRef.current) pdfInputRef.current.value = "";
      return;
    }

    setPdfFile(selected);
    setPdfFileName(selected.name);
    setPdfFileSize(
      selected.size > 1024 * 1024
        ? `${(selected.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(selected.size / 1024)} KB`
    );
    setIsUploadingPdf(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token || "";

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Content = (reader.result as string).split(",")[1];
          const res = await fetch(`${API_URL}/api/campaigns/upload-pdf`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              base64: base64Content,
              fileName: selected.name,
            }),
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            throw new Error(data.message || "Failed to upload PDF");
          }

          setPdfUrl(data.url);
          success(`PDF "${selected.name}" attached successfully!`);
        } catch (err: any) {
          console.error("PDF upload error:", err);
          toastError(err.message || "Failed to upload PDF. Please try again.");
          handleClearPdf();
        } finally {
          setIsUploadingPdf(false);
        }
      };

      reader.onerror = () => {
        toastError("Failed to read PDF file.");
        setIsUploadingPdf(false);
        handleClearPdf();
      };

      reader.readAsDataURL(selected);
    } catch (err: any) {
      console.error("PDF preparation error:", err);
      toastError("Failed to process PDF.");
      setIsUploadingPdf(false);
      handleClearPdf();
    }
  };

  const handleClearPdf = () => {
    setPdfFile(null);
    setPdfUrl("");
    setPdfFileName("");
    setPdfFileSize("");
    if (pdfInputRef.current) pdfInputRef.current.value = "";
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
        pdf_url: pdfUrl || undefined,
        pdf_filename: pdfFileName || undefined,
        recipients: audienceSource === "file"
          ? targetContacts.map((c) => ({
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
        if (data.failed_details) {
          console.warn("[Campaign Delivery Report] Failed contacts:", data.failed_details);
        }
        warning(data.message || `⚠️ ${totalSent} sent, ${totalFailed} failed.`);
      } else {
        success(data.message || "🚀 Blast campaign successfully sent!");
      }

      if (totalSent > 0) {
        setCampaignName("");
        setCustomMessage("");
        handleClearPdf();
        // File and contacts remain loaded so user can still view, edit, or blast another campaign
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
                      onClick={() => !isParsingFile && fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                        isDragging
                          ? "border-[var(--brand-primary)] bg-[var(--brand-subtle)]/30 scale-[1.01]"
                          : "border-[var(--border-default)] hover:border-[var(--brand-primary)]/70 hover:bg-[var(--bg-subtle)]"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv, .xlsx, .xls, .pdf, application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      {isParsingFile ? (
                        <div className="py-2 flex flex-col items-center justify-center">
                          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-2.5" />
                          <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                            Parsing Lead Document...
                          </h4>
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            Extracting customer names and WhatsApp contact numbers from {fileName || "PDF"}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-3">
                            <Upload className="w-6 h-6" />
                          </div>
                          <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">
                            Drop your CSV, Excel, or PDF file here
                          </h4>
                          <p className="text-xs text-[var(--text-secondary)] mb-3">
                            Supports <span className="font-mono text-emerald-400 font-medium">.xlsx</span>,{" "}
                            <span className="font-mono text-emerald-400 font-medium">.xls</span>,{" "}
                            <span className="font-mono text-emerald-400 font-medium">.csv</span>, and{" "}
                            <span className="font-mono text-rose-400 font-medium">.pdf</span> lead files
                          </p>
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-xs font-semibold text-[var(--text-primary)] shadow-2xs">
                            Browse Files
                          </span>
                        </>
                      )}
                    </div>
                  ) : (
                    /* Uploaded File Info Card */
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            fileName.toLowerCase().endsWith(".pdf")
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}>
                            {fileName.toLowerCase().endsWith(".pdf") ? (
                              <FileText className="w-5 h-5" />
                            ) : (
                              <FileSpreadsheet className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                                {fileName}
                              </p>
                              {fileName.toLowerCase().endsWith(".pdf") && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                  PDF Lead Table
                                </span>
                              )}
                            </div>
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

                      {/* Enhanced Contact Table & Filter Controls */}
                      <div className="space-y-2.5 pt-2 border-t border-emerald-500/15">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-[var(--text-primary)]">
                              Contacts ({parsedContacts.length.toLocaleString()})
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {validImportedContacts.length.toLocaleString()} Valid
                            </span>
                            {invalidImportedCount > 0 && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                {invalidImportedCount} Skipped
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            {/* Live Search Filter */}
                            <div className="relative">
                              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" />
                              <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search contacts..."
                                className="pl-8 pr-2.5 py-1 text-xs rounded-lg bg-[var(--bg-surface)] border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--brand-primary)] w-32 sm:w-40"
                              />
                            </div>

                            {/* Add Contact Button */}
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingContact(true);
                                setNewName("");
                                setNewPhone("");
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-[var(--brand-subtle)] text-[var(--brand-primary)] border border-[var(--brand-border)] hover:bg-[var(--brand-muted)] cursor-pointer transition-colors shrink-0"
                              title="Add contact manually"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Contact</span>
                            </button>

                            {/* Clear Skipped Button */}
                            {invalidImportedCount > 0 && (
                              <button
                                type="button"
                                onClick={clearSkippedContacts}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 cursor-pointer transition-colors shrink-0"
                                title="Remove invalid / skipped contacts"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Clear Invalid ({invalidImportedCount})</span>
                              </button>
                            )}

                            {/* View Limit Selector */}
                            <div className="flex items-center gap-1 text-[11px] text-[var(--text-tertiary)] shrink-0">
                              <span>Show:</span>
                              <select
                                value={previewLimit}
                                onChange={(e) =>
                                  setPreviewLimit(e.target.value === "all" ? "all" : Number(e.target.value))
                                }
                                className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded px-1.5 py-1 text-xs text-[var(--text-primary)] focus:outline-none cursor-pointer"
                              >
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                                <option value={250}>250</option>
                                <option value={500}>500</option>
                                <option value="all">All ({parsedContacts.length})</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Batch Target Selector */}
                        <div className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-surface)]/80 border border-[var(--border-subtle)] text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-[var(--text-secondary)] font-medium text-[11px]">
                              Recipients for this Campaign Blast:
                            </span>
                          </div>
                          <div className="relative shrink-0">
                            <select
                              value={sendLimit}
                              onChange={(e) =>
                                setSendLimit(e.target.value === "all" ? "all" : Number(e.target.value))
                              }
                              className="appearance-none bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-md px-2.5 py-1 pr-7 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] cursor-pointer"
                            >
                              <option value="all">
                                Send to ALL ({validImportedContacts.length.toLocaleString()} Contacts)
                              </option>
                              <option value={100}>Send to First 100 Contacts</option>
                              <option value={250}>Send to First 250 Contacts</option>
                              <option value={500}>Send to First 500 Contacts</option>
                              <option value={1000}>Send to First 1,000 Contacts</option>
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)] pointer-events-none" />
                          </div>
                        </div>

                        {/* Scrollable Editable Table */}
                        <div className="max-h-80 overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xs">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[var(--bg-subtle)] text-[10px] text-[var(--text-tertiary)] uppercase sticky top-0 z-10 border-b border-[var(--border-subtle)]">
                              <tr>
                                <th className="py-2 px-3 w-10">#</th>
                                <th className="py-2 px-3">Customer Name</th>
                                <th className="py-2 px-3">WhatsApp Number</th>
                                <th className="py-2 px-3 text-center w-24">Status</th>
                                <th className="py-2 px-3 text-right w-24">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-subtle)] font-sans">
                              {/* Inline New Contact Row */}
                              {isAddingContact && (
                                <tr className="bg-[var(--brand-subtle)]/30 border-b-2 border-[var(--brand-primary)]">
                                  <td className="py-2 px-3 text-[var(--brand-primary)] font-bold text-xs">
                                    +
                                  </td>
                                  <td className="py-1.5 px-3">
                                    <input
                                      type="text"
                                      value={newName}
                                      onChange={(e) => setNewName(e.target.value)}
                                      placeholder="Customer Name..."
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSaveNewContact();
                                        if (e.key === "Escape") setIsAddingContact(false);
                                      }}
                                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded px-2 py-1 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] shadow-xs"
                                    />
                                  </td>
                                  <td className="py-1.5 px-3">
                                    <input
                                      type="text"
                                      value={newPhone}
                                      onChange={(e) => setNewPhone(e.target.value)}
                                      placeholder="e.g. +91 98765 43210"
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleSaveNewContact();
                                        if (e.key === "Escape") setIsAddingContact(false);
                                      }}
                                      className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] shadow-xs"
                                    />
                                  </td>
                                  <td className="py-1.5 px-3 text-center">
                                    <span className="text-[10px] text-[var(--brand-primary)] font-semibold">
                                      New
                                    </span>
                                  </td>
                                  <td className="py-1.5 px-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <button
                                        type="button"
                                        onClick={handleSaveNewContact}
                                        className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                                        title="Save contact (Enter)"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setIsAddingContact(false);
                                          setNewName("");
                                          setNewPhone("");
                                        }}
                                        className="p-1 rounded bg-[var(--bg-muted)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                                        title="Cancel (Esc)"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              )}

                              {displayContacts.map((contact, idx) => {
                                const isEditing = editingContactId === contact.id;

                                if (isEditing) {
                                  return (
                                    <tr key={contact.id || idx} className="bg-[var(--brand-subtle)]/40 border-b border-[var(--brand-border)]">
                                      <td className="py-2 px-3 text-[var(--text-tertiary)] tabular-nums text-[11px]">
                                        {idx + 1}
                                      </td>
                                      <td className="py-1.5 px-3">
                                        <input
                                          type="text"
                                          value={editName}
                                          onChange={(e) => setEditName(e.target.value)}
                                          autoFocus
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") saveEditingContact(contact.id);
                                            if (e.key === "Escape") cancelEditingContact();
                                          }}
                                          className="w-full bg-[var(--bg-surface)] border border-[var(--brand-primary)] rounded px-2 py-1 text-xs font-medium text-[var(--text-primary)] focus:outline-none shadow-xs"
                                        />
                                      </td>
                                      <td className="py-1.5 px-3">
                                        <input
                                          type="text"
                                          value={editPhone}
                                          onChange={(e) => setEditPhone(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") saveEditingContact(contact.id);
                                            if (e.key === "Escape") cancelEditingContact();
                                          }}
                                          className="w-full bg-[var(--bg-surface)] border border-[var(--brand-primary)] rounded px-2 py-1 text-xs font-mono text-[var(--text-primary)] focus:outline-none shadow-xs"
                                        />
                                      </td>
                                      <td className="py-1.5 px-3 text-center">
                                        <span className="text-[10px] text-amber-500 font-medium">
                                          Editing…
                                        </span>
                                      </td>
                                      <td className="py-1.5 px-3 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => saveEditingContact(contact.id)}
                                            className="p-1 rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                                            title="Save changes (Enter)"
                                          >
                                            <Check className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={cancelEditingContact}
                                            className="p-1 rounded bg-[var(--bg-muted)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                                            title="Cancel (Esc)"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                }

                                return (
                                  <tr key={contact.id || idx} className="hover:bg-[var(--bg-subtle)]/60 transition-colors group">
                                    <td className="py-1.5 px-3 text-[var(--text-tertiary)] tabular-nums text-[11px]">
                                      {idx + 1}
                                    </td>
                                    <td className="py-1.5 px-3 font-medium text-[var(--text-primary)] truncate max-w-[160px]">
                                      {contact.name}
                                    </td>
                                    <td className="py-1.5 px-3 font-mono text-[var(--text-secondary)] tabular-nums text-[11.5px]">
                                      +{contact.phone || "(empty)"}
                                    </td>
                                    <td className="py-1.5 px-3 text-center">
                                      {contact.isValid ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                          <CheckCircle2 className="w-3 h-3" /> Valid
                                        </span>
                                      ) : (
                                        <span
                                          className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20"
                                          title="Invalid phone length or missing digits. Click edit to fix."
                                        >
                                          <AlertCircle className="w-3 h-3" /> Skipped
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-1.5 px-3 text-right">
                                      <div className="flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <button
                                          type="button"
                                          onClick={() => startEditingContact(contact)}
                                          className="p-1 rounded text-[var(--text-tertiary)] hover:text-[var(--brand-primary)] hover:bg-[var(--brand-subtle)] cursor-pointer transition-colors"
                                          title="Edit contact name or phone"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => deleteContact(contact.id)}
                                          className="p-1 rounded text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
                                          title="Delete contact from list"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)] px-0.5">
                          <span>
                            Showing {displayContacts.length.toLocaleString()} of{" "}
                            {filteredContacts.length.toLocaleString()} contacts
                          </span>
                          <span>
                            Targeting {targetCount.toLocaleString()} recipient{targetCount !== 1 ? "s" : ""}
                          </span>
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
                      Direct text &amp; PDF document messages.
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
                      Pre-approved Meta templates.
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
                    {/* Pre-approved Template Dropdown if available */}
                    {availableTemplates.length > 0 && (
                      <div>
                        <label
                          htmlFor="template-select"
                          className="block text-[10px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px] mb-1"
                        >
                          Select Pre-Approved Template ({availableTemplates.length} Available)
                        </label>
                        <select
                          id="template-select"
                          value={templateName}
                          onChange={(e) => {
                            const val = e.target.value;
                            const found = availableTemplates.find((t) => t.name === val);
                            if (found) {
                              setTemplateName(found.name);
                              setTemplateLang(found.language || "en");
                            } else {
                              setTemplateName(val);
                            }
                          }}
                          className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] px-2.5 py-1.5 text-xs font-sans text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] cursor-pointer"
                        >
                          <option value="">-- Choose an approved Meta template --</option>
                          {availableTemplates.map((t) => (
                            <option key={t.id || t.name} value={t.name}>
                              {t.name} ({t.category || "APPROVED"} • {t.language})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

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
                        Meta Templates bypass the 24-hour customer window and deliver reliably to cold leads and inactive contacts.
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

              {/* PDF Document Attachment Section */}
              <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                    <span className="text-[11px] font-sans font-semibold text-[var(--text-secondary)] uppercase tracking-[0.5px]">
                      Attach PDF Document (Optional)
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--text-tertiary)] font-sans">
                    Max 50 MB • Sent to all recipients
                  </span>
                </div>

                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handlePdfSelect}
                  className="hidden"
                  id="campaign-pdf-upload"
                />

                {!pdfFile ? (
                  <label
                    htmlFor="campaign-pdf-upload"
                    className="group flex items-center justify-between p-3.5 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border-default)] hover:border-[var(--brand-primary)] bg-[var(--bg-subtle)]/50 hover:bg-[var(--bg-subtle)] cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform border border-red-200/60 dark:border-red-900/40">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-sans font-medium text-[var(--text-primary)] group-hover:text-[var(--brand-primary)] transition-colors">
                          Attach Brochure, Catalog, or Price List (PDF)
                        </p>
                        <p className="text-[10px] font-sans text-[var(--text-tertiary)]">
                          Click to browse and upload your PDF file
                        </p>
                      </div>
                    </div>
                    <div className="text-[11px] font-sans font-semibold text-[var(--brand-primary)] px-2.5 py-1 rounded-md bg-[var(--brand-subtle)] border border-[var(--brand-border)] select-none">
                      Choose PDF
                    </div>
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-[var(--radius-lg)] bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[var(--shadow-xs)]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 text-red-500 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-sans font-semibold text-[var(--text-primary)] truncate max-w-[200px] sm:max-w-[280px]">
                            {pdfFileName}
                          </p>
                          {isUploadingPdf ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-sans text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-900/30">
                              <Loader2 className="w-2.5 h-2.5 animate-spin" /> Uploading…
                            </span>
                          ) : pdfUrl ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-sans text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/30 font-medium">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Ready
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[10px] font-mono text-[var(--text-tertiary)] mt-0.5">
                          {pdfFileSize} • PDF Document
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleClearPdf}
                      className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Remove PDF"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
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
                    key={previewContactIndex + customMessage + (pdfFileName || "")}
                    initial={{ scale: 0.95, opacity: 0, y: 8 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="self-end max-w-[85%] bg-[#005C4B] text-[#E9EDEF] rounded-2xl rounded-tr-xs p-2.5 text-xs leading-relaxed shadow-md relative group font-sans break-words"
                  >
                    {/* PDF Card Preview inside Outbound Bubble */}
                    {pdfFileName && (
                      <div className="mb-2 p-2 bg-[#025142] rounded-xl flex items-center gap-2.5 border border-white/10 select-none">
                        <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-semibold text-white truncate">
                            {pdfFileName}
                          </p>
                          <p className="text-[9px] text-[#A6B8BA] uppercase tracking-wide">
                            {pdfFileSize || "PDF"} • Document
                          </p>
                        </div>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap px-0.5">{getPreviewText(customMessage)}</p>
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

                  {pdfFileName && (
                    <div className="pt-2 border-t border-[var(--border-subtle)] text-[11px] flex items-center justify-between">
                      <span className="text-[var(--text-tertiary)] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-red-500" />
                        Attached Document:
                      </span>
                      <span className="font-semibold text-[var(--text-primary)] truncate max-w-[220px]">
                        {pdfFileName} {pdfFileSize ? `(${pdfFileSize})` : ""}
                      </span>
                    </div>
                  )}

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
