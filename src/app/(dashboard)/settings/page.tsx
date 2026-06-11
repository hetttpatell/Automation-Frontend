"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { 
  Save, 
  Loader2, 
  Sparkles, 
  Check, 
  Copy,
  Globe,
  Briefcase,
  Heart,
  Rocket,
  Bolt,
  Info,
  Clock,
  Building2,
  DollarSign,
  ChevronDown,
  User,
  BookOpen,
  Terminal,
  CreditCard,
  ShieldCheck,
  FileText,
  Eye,
  EyeOff,
  MessageSquare,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/Toast";

interface TenantConfig {
  id: string;
  is_calendar_connected?: boolean | null;
  gcal_calendar_id?: string | null;
  google_review_link?: string | null;
  ai_system_instruction?: string | null;
  ai_tone?: string | null;
  business_name?: string | null;
  services_text?: string | null;
  hours_text?: string | null;
  rules_text?: string | null;
  bot_language?: string | null;
  payment_methods_text?: string | null;
  target_audience_text?: string | null;
  subscription_tier?: string | null;
  whatsapp_access_token?: string | null;
  whatsapp_phone_number_id?: string | null;
  whatsapp_business_account_id?: string | null;
}

// ─── Tone Preset Options ────────────────────────────────────────────
const TONE_OPTIONS = [
  { value: "Professional", label: "Professional", icon: Briefcase, desc: "Formal, clear, trustworthy" },
  { value: "Friendly", label: "Friendly", icon: Heart, desc: "Warm, empathetic, approachable" },
  { value: "Enthusiastic", label: "Enthusiastic", icon: Rocket, desc: "Sales-driven, energetic" },
  { value: "Direct", label: "Direct", icon: Bolt, desc: "Concise, factual, no-fluff" },
];

// ─── Translation Dictionaries ───────────────────────────────────────
const TRANSLATIONS = {
  en: {
    badge: "AI BUSINESS PROFILE",
    title: "LeadFlow Profile",
    subtitle: "Configure business vectors. Our prompt compiler compiles these variables into the live system prompt guiding AI customer inquiries.",
    identityTitle: "Business Identity",
    identitySubtitle: "Name and primary language settings",
    businessName: "Business Name",
    businessNamePlaceholder: "e.g., Serenity Spa",
    businessNameHelper: "Enter the legal or trade name of your shop.",
    botLanguage: "Bot Primary Language",
    botLanguageHelper: "Primary language the bot will use to converse.",
    coreInfoTitle: "Core Information",
    coreInfoSubtitle: "Services, working hours and billing guidelines",
    services: "Services & Pricing List",
    servicesPlaceholder: "Describe services and prices clearly...",
    servicesHelper: "Detail what products or plans you offer and prices.",
    hours: "Working Hours & Location",
    hoursPlaceholder: "Monday to Saturday: 9 AM - 6 PM...",
    hoursHelper: "Provide timing schedules and physical locations.",
    payments: "Payment Methods Accepted",
    paymentsPlaceholder: "e.g. Cash, UPI, Cards...",
    paymentsHelper: "Detail accepted checkout or credit structures.",
    brandVoiceTitle: "Brand Voice & Policies",
    brandVoiceSubtitle: "Establish behavioral rules and audience targets",
    targetAudience: "Target Audience / Brand Vibe",
    targetAudiencePlaceholder: "High-end luxury seekers, budget families...",
    targetAudienceHelper: "Target customer segments and general vibe.",
    specialRules: "Special Rules & Policies",
    specialRulesPlaceholder: "e.g. appointment required, no refunds...",
    specialRulesHelper: "Strict rules the AI agent must enforce.",
    aiToneTitle: "AI Communication Tone Preset",
    aiToneSubtitle: "Personas configured for active conversation threads",
    promptPreview: "AI System Instruction Preview",
    promptPreviewSubtitle: "Compiled instruction prompt sent to Gemini",
    copyBtn: "Copy to Clipboard",
    copied: "Copied!",
    unsavedTitle: "Unsaved changes",
    unsavedSubtitle: "Modifications are not yet deployed to Live Agent vectors.",
    discard: "Discard",
    save: "Save Profile",
    saving: "Deploying...",
    lastSaved: "Last saved",
    tabProfile: "General Profile",
    tabProfileDesc: "Identity, tone & language settings",
    tabVectors: "Knowledge Vectors",
    tabVectorsDesc: "Services, hours & billing limits",
    tabCompiler: "AI Prompt Compiler",
    tabCompilerDesc: "Live prompt variable compiled preview"
  },
  hi: {
    badge: "एआई बिजनेस प्रोफाइल",
    title: "बिजनेस प्रोफाइल बिल्डर",
    subtitle: "व्यापार वेक्टर कॉन्फ़िगर करें। हमारा स्मार्ट एआई कंपाइलर इन वेरिएबल्स को प्रॉम्प्ट में संकलित करता है।",
    identityTitle: "व्यवसाय की पहचान",
    identitySubtitle: "नाम और प्राथमिक भाषा सेटिंग्स",
    businessName: "व्यवसाय का नाम",
    businessNamePlaceholder: "उदा., सेरेनिटी स्पा",
    businessNameHelper: "अपने दुकान या व्यवसाय का नाम लिखें।",
    botLanguage: "बोट प्राथमिक भाषा",
    botLanguageHelper: "एआई को बातचीत करने के लिए प्राथमिक भाषा।",
    coreInfoTitle: "मुख्य जानकारी",
    coreInfoSubtitle: "सेवाएं, कार्य समय और बिलिंग दिशानिर्देश",
    services: "मुख्य सेवाएं और मूल्य निर्धारण",
    servicesPlaceholder: "सेवाओं और कीमतों का स्पष्ट विवरण दें...",
    servicesHelper: "आपके द्वारा पेश की जाने वाली सेवाओं या योजनाओं का विवरण।",
    hours: "कार्य के घंटे और स्थान",
    hoursPlaceholder: "सोमवार से शनिवार: सुबह 9 - शाम 6 बजे...",
    hoursHelper: "समय सारणी और भौतिक स्थान प्रदान करें।",
    payments: "भुगतान के स्वीकार्य तरीके",
    paymentsPlaceholder: "उदा. नकद, यूपीआई, कार्ड...",
    paymentsHelper: "स्वीकृत भुगतान विधियां।",
    brandVoiceTitle: "ब्रांड की आवाज और नीतियां",
    brandVoiceSubtitle: "व्यवहार संबंधी नियम और दर्शक लक्ष्य स्थापित करें",
    targetAudience: "लक्षित दर्शक और ब्रांड वाइब",
    targetAudiencePlaceholder: "लक्जरी चाहने वाले, बजट परिवार...",
    targetAudienceHelper: "लक्षित ग्राहक वर्ग और सामान्य वाइब।",
    specialRules: "विशेष नियम और नीतियां",
    specialRulesPlaceholder: "उदा. अपॉइंटमेंट आवश्यक, कोई रिफंड नहीं...",
    specialRulesHelper: "सख्त नियम जिन्हें एआई एजेंट को लागू करना होगा।",
    aiToneTitle: "एआई संचार टोन प्रीसेट",
    aiToneSubtitle: "सक्रिय बातचीत धागे के लिए कॉन्फ़िगर किए गए व्यक्तित्व",
    promptPreview: "एआई सिस्टम निर्देश निर्देश पूर्वावलोकन",
    promptPreviewSubtitle: "जेमिनी को भेजे गए संकलित निर्देश प्रॉम्प्ट",
    copyBtn: "क्लिपबोर्ड पर कॉपी करें",
    copied: "कॉपी किया गया!",
    unsavedTitle: "असुरक्षित परिवर्तन",
    unsavedSubtitle: "संशोधन अभी तक लाइव एजेंट वैक्टर पर तैनात नहीं किए गए हैं।",
    discard: "रद्द करें",
    save: "प्रोफ़ाइल सहेजें",
    saving: "तैनात किया जा रहा है...",
    lastSaved: "अंतिम बार सहेजा गया",
    tabProfile: "सामान्य प्रोफ़ाइल",
    tabProfileDesc: "पहचान, टोन और भाषा",
    tabVectors: "ज्ञान वैक्टर",
    tabVectorsDesc: "सेवाएं, समय और नीतियां",
    tabCompiler: "एआई प्रॉम्प्ट कंपाइलर",
    tabCompilerDesc: "लाइવ कंपाइल निर्देश पूर्वावलोकन"
  },
  gu: {
    badge: "એઆઈ બિઝનેસ પ્રોફાઇલ",
    title: "બિઝનેસ પ્રોફાઇલ બિલ્ડર",
    subtitle: "વ્યવસાય વેક્ટર ગોઠવો. અમારું સ્માર્ટ એઆઈ કમ્પાઇલર આ ચલોને લાઇવ સિસ્ટમ પ્રોમ્પ્ટમાં કમ્પાઇલ કરે છે.",
    identityTitle: "વ્યવસાય ઓળખ",
    identitySubtitle: "નામ અને પ્રાથમિક ભાષા સેટિંગ્સ",
    businessName: "વ્યવસાયનું નામ",
    businessNamePlaceholder: "દા.ત., સેરેનિટી સ્પા",
    businessNameHelper: "તમારી દુકાન અથવા વ્યવસાયનું નામ લખો.",
    botLanguage: "બૉટ પ્રાથમિક ભાષા",
    botLanguageHelper: "વાતચીત કરવા માટે બૉટ ઉપયોગ કરશે તે પ્રાથમિક ભાષા.",
    coreInfoTitle: "મુખ્ય માહિતી",
    coreInfoSubtitle: "સેવાઓ, કામના કલાકો અને બિલિંગ માર્ગદર્શિકા",
    services: "મુખ્ય સેવાઓ અને કિંમત",
    servicesPlaceholder: "સેવાઓ અને કિંમતોનું સ્પષ્ટ વર્ણન કરો...",
    servicesHelper: "તમે ઑફર કરો છો તે સેવાઓ અથવા યોજનાઓની વિગતો.",
    hours: "કામના કલાકો અને સ્થળ",
    hoursPlaceholder: "સોમવારથી શનિવાર: સવારે ૯ - સાંજ ના ૬ વાગ્યા સુધી...",
    hoursHelper: "સમયપત્રક અને ભૌતિક સ્થળો પ્રદાન કરો.",
    payments: "ચુકવણી પદ્ધતિઓ",
    paymentsPlaceholder: "દા.ત. રોકડ, યુપીઆઈ, કાર્ડ્સ...",
    paymentsHelper: "સ્વીકારવામાં આવતી ચુકવણી પદ્ધતિઓની વિગતો.",
    brandVoiceTitle: "બ્રાન્ડ વોઇસ અને નીતિઓ",
    brandVoiceSubtitle: "વર્તણૂક નિયમો અને પ્રેક્ષકોના લક્ષ્યો સ્થાપિત કરો",
    targetAudience: "લક્ષ્ય પ્રેક્ષકો અને બ્રાન્ડ વાઇબ",
    targetAudiencePlaceholder: "લક્ષ્ય ઇચ્છતા ગ્રાહકો, મધ્યમ પરિવારો...",
    targetAudienceHelper: "લક્ષ્ય ગ્રાહક વર્ગ અને સામાન્ય વાઇબ.",
    specialRules: "ખાસ નિયમો અને નીતિઓ",
    specialRulesPlaceholder: "દા.ત. એપોઇન્ટમેન્ટ જરૂરી, કોઈ રિફંડ નથી...",
    specialRulesHelper: "એઆઈ એજન્ટે સખત રીતે અમલમાં મૂકવાના નિયમો.",
    aiToneTitle: "એઆઈ કમ્યુનિકેશન ટોન પ્રીસેટ",
    aiToneSubtitle: "સક્રિય વાતચીત થ્રેડો માટે ગોઠવેલ વ્યક્તિત્વ",
    promptPreview: "એઆઈ સિસ્ટમ સૂચના પૂર્વાવલોકન",
    promptPreviewSubtitle: "જેમિનીને મોકલેલ સંકલિત સૂચના પ્રોમ્પ્ટ",
    copyBtn: "કૉપિ કરો",
    copied: "કૉપિ કર્યું!",
    unsavedTitle: "ન સાચવેલા ફેરફારો",
    unsavedSubtitle: "ફેરફારો હજી સુધી લાઇવ એજન્ટ વેક્ટર પર તૈનાત કરવામાં આવ્યા નથી.",
    discard: "રદ કરો",
    save: "પ્રોફાઇલ સાચવો",
    saving: "તૈનાત થઈ રહ્યું છે...",
    lastSaved: "છેલ્લે સાચવેલ",
    tabProfile: "સામાન્ય પ્રોફાઇલ",
    tabProfileDesc: "ઓળખ, ટોન અને ભાષા",
    tabVectors: "જ્ઞાન વેક્ટર્સ",
    tabVectorsDesc: "સેવાઓ, સમય અને નિયમો",
    tabCompiler: "એઆઈ પ્રોમ્પ્ટ કમ્પાઈલર",
    tabCompilerDesc: "લાઇવ કમ્પાઇલ કરેલ પૂર્વાવલોકન"
  }
};

// ─── Settings Row Component ────────────────────────────────────────
interface SettingsRowProps {
  label: string;
  description: string;
  required?: boolean;
  children: React.ReactNode;
}

function SettingsRow({ label, description, required, children }: SettingsRowProps) {
  return (
    <div className="py-6 first:pt-2 last:pb-2 last:border-b-0 border-b border-[var(--border-subtle)] grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      <div className="md:col-span-1 space-y-1">
        <label className="text-sm font-semibold text-[var(--text-primary)] font-display flex items-center gap-1.5">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
        <p className="text-xs text-[var(--text-tertiary)] leading-relaxed max-w-sm">
          {description}
        </p>
      </div>
      <div className="md:col-span-2 space-y-2">
        {children}
      </div>
    </div>
  );
}

// ─── Tags Input Component (Screenshot Style) ──────────────────────
interface TagsInputProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  suggestions: string[];
  placeholder?: string;
}

function TagsInput({ tags, onAddTag, onRemoveTag, suggestions, placeholder = "Add custom option..." }: TagsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        onAddTag(inputValue.trim());
        setInputValue("");
      }
    }
  };

  const filteredSuggestions = suggestions.filter(
    item => item.toLowerCase().includes(inputValue.toLowerCase()) && !tags.some(t => t.toLowerCase() === item.toLowerCase())
  );

  return (
    <div ref={containerRef} className="space-y-3 relative w-full">
      <div className="flex flex-wrap gap-1.5 min-h-[36px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--brand-subtle)] border border-[var(--brand-border)] text-[var(--brand-primary)] animate-fade-in"
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemoveTag(tag)}
              className="text-[var(--brand-text)] hover:text-rose-500 font-bold transition-colors cursor-pointer w-4 h-4 rounded-full flex items-center justify-center hover:bg-[var(--bg-muted)] ml-1"
            >
              &times;
            </button>
          </span>
        ))}
      </div>

      <div className="relative max-w-md">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] flex items-center pointer-events-none">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <input
          type="text"
          value={inputValue}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 h-11 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] font-sans focus:outline-none focus:border-[var(--brand-primary)] focus:shadow-[var(--shadow-focus)] hover:border-[var(--border-strong)] transition-all duration-150"
        />

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && filteredSuggestions.length > 0 && (
          <div className="absolute left-0 right-0 mt-1.5 max-h-56 overflow-y-auto bg-[var(--bg-surface-raised)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] z-50 p-1">
            {filteredSuggestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  onAddTag(item);
                  setInputValue("");
                  setIsOpen(false);
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer transition-colors duration-150"
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const supabase = useMemo(() => createClient(), []);
  const { success: toastSuccess, error: toastError } = useToast();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<"profile" | "vectors" | "compiler" | "integrations">("profile");

  // Active accordion section for mobile collapsible view
  const [activeAccordion, setActiveAccordion] = useState<"profile" | "vectors" | "compiler" | "integrations" | null>("profile");

  // Form states
  const [businessName, setBusinessName] = useState("");
  const [servicesText, setServicesText] = useState("");
  const [hoursText, setHoursText] = useState("");
  const [paymentMethodsText, setPaymentMethodsText] = useState("");
  const [targetAudienceText, setTargetAudienceText] = useState("");
  const [rulesText, setRulesText] = useState("");
  const [botLanguage, setBotLanguage] = useState("English");
  const [aiTone, setAiTone] = useState("Professional");

  // WhatsApp Credentials States
  const [whatsappAccessToken, setWhatsappAccessToken] = useState("");
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState("");
  const [whatsappBusinessAccountId, setWhatsappBusinessAccountId] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [isMetaConnecting, setIsMetaConnecting] = useState(false);
  const [showAdvancedOAuth, setShowAdvancedOAuth] = useState(false);
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // Google Calendar States
  const [tenantId, setTenantId] = useState("");
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [gcalCalendarId, setGcalCalendarId] = useState("");
  const [googleReviewLink, setGoogleReviewLink] = useState("");
  const [subscriptionTier, setSubscriptionTier] = useState("free");

  // Dynamic UI Language
  const [formLanguage, setFormLanguage] = useState<"en" | "hi" | "gu">("en");

  // Toggle visual preview
  const [isCopied, setIsCopied] = useState(false);

  // Loading feedback
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Original state backup for dirty tracking
  const [originalData, setOriginalData] = useState({
    businessName: "",
    servicesText: "",
    hoursText: "",
    paymentMethodsText: "",
    targetAudienceText: "",
    rulesText: "",
    botLanguage: "English",
    aiTone: "Professional",
    gcalCalendarId: "",
    googleReviewLink: "",
    whatsappAccessToken: "",
    whatsappPhoneNumberId: "",
    whatsappBusinessAccountId: "",
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Inject Facebook JavaScript SDK dynamically
  useEffect(() => {
    if (typeof window !== "undefined" && !(window as any).FB) {
      (window as any).fbAsyncInit = function () {
        (window as any).FB.init({
          appId: process.env.NEXT_PUBLIC_META_APP_ID || "1586663712852403",
          cookie: true,
          xfbml: true,
          version: "v19.0",
        });
      };

      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  // Fetch initial configs
  const fetchConfig = React.useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      console.error("[Settings Auth Error]:", authError?.message || "No user or email found");
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("tenants")
      .select("id, is_calendar_connected, gcal_calendar_id, google_review_link, ai_system_instruction, ai_tone, business_name, services_text, hours_text, rules_text, bot_language, payment_methods_text, target_audience_text, subscription_tier, whatsapp_access_token, whatsapp_phone_number_id, whatsapp_business_account_id")
      .eq("owner_email", user.email)
      .single();

    let tenantConfig: TenantConfig | null = data as TenantConfig | null;
    const defaultBusinessName = user.email
      ? user.email.split("@")[0].charAt(0).toUpperCase() + user.email.split("@")[0].slice(1) + "'s Business"
      : "My Business";

    if (error && error.code === "PGRST116") {
      const initialPrompt = `You are the AI Assistant for ${defaultBusinessName}, an elite, hyper-efficient representative. 
You must communicate primarily in English.
Our services are: General support. 
Our hours are: Monday to Friday: 9:00 AM - 6:00 PM. 
We accept these payments: Cash, UPI, Cards.
Our target audience is: General segment.
Follow these rules strictly: Customer satisfaction is paramount.`;

      let { data: newTenant, error: createError } = await supabase
        .from("tenants")
        .insert({
          business_name: defaultBusinessName,
          owner_email: user.email,
          ai_system_instruction: initialPrompt,
          system_prompt: initialPrompt,
          ai_tone: "Professional",
          bot_language: "English",
          services_text: "General services and business support",
          hours_text: "Monday to Friday: 9:00 AM - 6:00 PM",
          rules_text: "Customer satisfaction is paramount.",
          payment_methods_text: "Cash, UPI, Cards",
          target_audience_text: "General segment",
        })
        .select("id, is_calendar_connected, gcal_calendar_id, google_review_link, ai_system_instruction, ai_tone, business_name, services_text, hours_text, rules_text, bot_language, payment_methods_text, target_audience_text, subscription_tier, whatsapp_access_token, whatsapp_phone_number_id, whatsapp_business_account_id")
        .single();

      if (createError) {
        if (createError.code === "23505" || createError.message?.includes("unique constraint")) {
          const { data: existingTenant, error: fetchError } = await supabase
            .from("tenants")
            .select("id, is_calendar_connected, gcal_calendar_id, google_review_link, ai_system_instruction, ai_tone, business_name, services_text, hours_text, rules_text, bot_language, payment_methods_text, target_audience_text, subscription_tier, whatsapp_access_token, whatsapp_phone_number_id, whatsapp_business_account_id")
            .eq("owner_email", user.email)
            .single();
          if (!fetchError) tenantConfig = existingTenant as TenantConfig | null;
        }
      } else {
        tenantConfig = newTenant as TenantConfig | null;
      }
    }

    if (tenantConfig) {
      const tone = tenantConfig.ai_tone || "Professional";
      const name = tenantConfig.business_name || defaultBusinessName;
      const services = tenantConfig.services_text || "";
      const hours = tenantConfig.hours_text || "";
      const payment = tenantConfig.payment_methods_text || "";
      const audience = tenantConfig.target_audience_text || "";
      const rules = tenantConfig.rules_text || "";
      const lang = tenantConfig.bot_language || "English";
      const tId = tenantConfig.id || "";
      const calConnected = tenantConfig.is_calendar_connected || false;
      const calId = tenantConfig.gcal_calendar_id || "";
      const googleLink = tenantConfig.google_review_link || "";
      const tier = tenantConfig.subscription_tier || "free";
      const waToken = tenantConfig.whatsapp_access_token || "";
      const waPhoneId = tenantConfig.whatsapp_phone_number_id || "";
      const waBusinessId = tenantConfig.whatsapp_business_account_id || "";

      setBusinessName(name);
      setServicesText(services);
      setHoursText(hours);
      setPaymentMethodsText(payment);
      setTargetAudienceText(audience);
      setRulesText(rules);
      setBotLanguage(lang);
      setAiTone(tone);
      setTenantId(tId);
      setIsCalendarConnected(calConnected);
      setGcalCalendarId(calId);
      setGoogleReviewLink(googleLink);
      setSubscriptionTier(tier);
      setWhatsappAccessToken(waToken);
      setWhatsappPhoneNumberId(waPhoneId);
      setWhatsappBusinessAccountId(waBusinessId);

      setOriginalData({
        businessName: name,
        servicesText: services,
        hoursText: hours,
        paymentMethodsText: payment,
        targetAudienceText: audience,
        rulesText: rules,
        botLanguage: lang,
        aiTone: tone,
        gcalCalendarId: calId,
        googleReviewLink: googleLink,
        whatsappAccessToken: waToken,
        whatsappPhoneNumberId: waPhoneId,
        whatsappBusinessAccountId: waBusinessId,
      });
    }

    setIsLoading(false);
  }, [supabase]);

  const triggerTokenExchange = React.useCallback(async (payload: { token: string; redirectUri: string }) => {
    setIsMetaConnecting(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("Could not resolve current Supabase authorization session.");
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/meta/exchange-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          token: payload.token, 
          redirectUri: payload.redirectUri 
        }),
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.error || "Token exchange endpoint returned an error.");
      }

      toastSuccess("Meta WhatsApp integration connected successfully!");
      await fetchConfig(false);
    } catch (err: any) {
      console.error("[Meta OAuth Exchange Error]:", err);
      toastError(err.message || "Failed to exchange authorization code.");
    } finally {
      setIsMetaConnecting(false);
    }
  }, [supabase, fetchConfig, toastSuccess, toastError]);

  // Handle receiving the code inside the popup window and posting it back to the opener
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      if (code && window.opener) {
        console.log("[Meta OAuth Popup] Code found in popup URL, sending back to parent window...");
        window.opener.postMessage({ type: "META_OAUTH_CODE", code }, window.location.origin);
        window.close();
      }
    }
  }, []);

  // Listen for Meta OAuth code messages from the popup window
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data && event.data.type === "META_OAUTH_CODE") {
        const authCode = event.data.code;
        const currentUrl = window.location.origin + window.location.pathname;
        console.log("[Meta OAuth Parent] Received auth code from popup, triggering backend exchange with redirectUri:", currentUrl);
        triggerTokenExchange({ token: authCode, redirectUri: currentUrl });
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [triggerTokenExchange]);

  const handleMetaLogin = () => {
    if (!process.env.NEXT_PUBLIC_META_CONFIG_ID) {
      toastError("Meta Configuration ID is missing. Set NEXT_PUBLIC_META_CONFIG_ID in your .env.local file.");
      console.error("[Meta OAuth] NEXT_PUBLIC_META_CONFIG_ID is not set.");
      return;
    }

    setIsMetaConnecting(true);

    const metaConfigId = process.env.NEXT_PUBLIC_META_CONFIG_ID;
    const currentUrl = window.location.origin + window.location.pathname;

    const oauthUrl = `https://www.facebook.com/v19.0/dialog/oauth` +
      `?app_id=${process.env.NEXT_PUBLIC_META_APP_ID || "1586663712852403"}` +
      `&client_id=${process.env.NEXT_PUBLIC_META_APP_ID || "1586663712852403"}` +
      `&redirect_uri=${encodeURIComponent(currentUrl)}` +
      `&config_id=${metaConfigId}` +
      `&response_type=code` +
      `&override_default_response_type=true` +
      `&extras=${encodeURIComponent(JSON.stringify({ feature: "whatsapp_embedded_signup", version: 2, sessionInfoVersion: 2 }))}`;

    const width = 600;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    console.log("[Meta OAuth] Launching manual OAuth popup with URL:", oauthUrl);
    window.open(oauthUrl, 'Meta Login', `width=${width},height=${height},top=${top},left=${left}`);
  };

  // Listen to search params for Google Calendar connection notifications
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("success") === "true") {
        toastSuccess("Google Calendar connected successfully!");
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (params.get("error") === "oauth_failed") {
        toastError("Failed to connect Google Calendar. Please try again.");
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [toastSuccess, toastError]);

  const t = TRANSLATIONS[formLanguage];

  // Sync calendar connection status on tab focus without overwriting other unsaved form inputs
  const syncCalendarConnection = React.useCallback(async () => {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user || !user.email) return;

    const { data, error } = await supabase
      .from("tenants")
      .select("is_calendar_connected")
      .eq("owner_email", user.email)
      .single();

    if (!error && data) {
      setIsCalendarConnected(data.is_calendar_connected || false);
    }
  }, [supabase]);

  // Initial fetch on mount
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Re-fetch only calendar connection status on tab focus to sync OAuth states without losing user inputs
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleFocus = () => {
      syncCalendarConnection();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [syncCalendarConnection]);

  // Check which tabs have unsaved edits
  const hasProfileChanges = 
    businessName !== originalData.businessName ||
    botLanguage !== originalData.botLanguage ||
    aiTone !== originalData.aiTone;

  const hasVectorChanges = 
    servicesText !== originalData.servicesText ||
    hoursText !== originalData.hoursText ||
    paymentMethodsText !== originalData.paymentMethodsText ||
    targetAudienceText !== originalData.targetAudienceText ||
    rulesText !== originalData.rulesText;

  const hasIntegrationChanges = gcalCalendarId !== originalData.gcalCalendarId || googleReviewLink !== originalData.googleReviewLink;
  const hasWhatsappChanges =
    whatsappAccessToken !== originalData.whatsappAccessToken ||
    whatsappPhoneNumberId !== originalData.whatsappPhoneNumberId ||
    whatsappBusinessAccountId !== originalData.whatsappBusinessAccountId;

  // Track global dirty changes
  useEffect(() => {
    setHasChanges(hasProfileChanges || hasVectorChanges || hasIntegrationChanges || hasWhatsappChanges);
  }, [hasProfileChanges, hasVectorChanges, hasIntegrationChanges, hasWhatsappChanges]);

  const navTabs = useMemo(() => [
    { id: "profile", label: t.tabProfile, desc: t.tabProfileDesc, icon: User, hasChanges: hasProfileChanges, isAI: false },
    { id: "vectors", label: t.tabVectors, desc: t.tabVectorsDesc, icon: BookOpen, hasChanges: hasVectorChanges, isAI: false },
    { id: "compiler", label: t.tabCompiler, desc: t.tabCompilerDesc, icon: Terminal, hasChanges: false, isAI: true },
    { id: "integrations", label: "Integrations & Booking", desc: "Connect Google Calendar", icon: Globe, hasChanges: hasIntegrationChanges || hasWhatsappChanges, isAI: false },
  ], [t, hasProfileChanges, hasVectorChanges, hasIntegrationChanges, hasWhatsappChanges]);

  // Compile instructions preview — mirrors the backend's actual prompt structure
  const compiledPrompt = `You are the AI Assistant for ${businessName || "My Business"}, an elite, hyper-efficient representative. 
You must communicate primarily in ${botLanguage}.
Your communication tone is: ${aiTone}.

Our Services & Pricing:
${servicesText || "General services and business support"}

Operating Hours & Location:
${hoursText || "Monday to Friday: 9:00 AM - 6:00 PM"}

Payment Methods Accepted:
${paymentMethodsText || "Cash, UPI, Cards"}

Target Audience & Brand Positioning:
${targetAudienceText || "General segment"}

Business Rules, Policies & FAQs:
${rulesText || "Customer satisfaction is paramount."}`;

  // Helper to compile and highlight active variables inside terminal preview
  const renderHighlightedPrompt = (text: string) => {
    const variables = [
      { key: businessName || "My Business", label: "businessName", style: "bg-[var(--brand-subtle)] text-[var(--brand-primary)] border border-[var(--brand-border)] px-1.5 py-0.5 rounded font-mono font-bold mx-0.5 inline-block" },
      { key: botLanguage, label: "botLanguage", style: "bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--success-border)] px-1.5 py-0.5 rounded font-mono font-bold mx-0.5 inline-block" },
      { key: aiTone, label: "aiTone", style: "bg-[var(--color-ai-bg)] text-[var(--color-ai-text)] border border-[var(--ai-border)] px-1.5 py-0.5 rounded font-mono font-bold mx-0.5 inline-block" },
      { key: servicesText || "General services and business support", label: "servicesText", style: "bg-[var(--color-info-bg)] text-[var(--color-info-text)] border border-[var(--info-border)] px-1.5 py-0.5 rounded font-mono font-bold mx-0.5 inline-block" },
      { key: hoursText || "Monday to Friday: 9:00 AM - 6:00 PM", label: "hoursText", style: "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border border-[var(--warning-border)] px-1.5 py-0.5 rounded font-mono font-bold mx-0.5 inline-block" },
      { key: paymentMethodsText || "Cash, UPI, Cards", label: "paymentMethods", style: "bg-[var(--color-ai-bg)] text-[var(--color-ai-text)] border border-[var(--ai-border)] px-1.5 py-0.5 rounded font-mono font-bold mx-0.5 inline-block" },
      { key: targetAudienceText || "General segment", label: "targetAudience", style: "bg-[var(--brand-subtle)] text-[var(--brand-primary)] border border-[var(--brand-border)] px-1.5 py-0.5 rounded font-mono font-bold mx-0.5 inline-block" },
      { key: rulesText || "Customer satisfaction is paramount.", label: "specialRules", style: "bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] border border-[var(--danger-border)] px-1.5 py-0.5 rounded font-mono font-bold mx-0.5 inline-block" },
    ];

    const validVariables = variables.filter(v => v.key && v.key.trim().length > 0);
    let parts: React.ReactNode[] = [text];

    validVariables.forEach((v) => {
      const nextParts: React.ReactNode[] = [];
      parts.forEach((part) => {
        if (typeof part !== "string") {
          nextParts.push(part);
          return;
        }
        const splitText = part.split(v.key);
        splitText.forEach((t, index) => {
          if (index > 0) {
            nextParts.push(
              <span key={`${v.label}-${index}`} className={v.style} title={`Variable: ${v.label}`}>
                {v.key}
              </span>
            );
          }
          if (t) {
            nextParts.push(t);
          }
        });
      });
      parts = nextParts;
    });

    return parts;
  };

  // Deploy to DB
  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      console.error("[Save Config Error]: No User Session or email");
      toastError("Failed to authenticate session");
      setIsSaving(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("tenants")
        .update({
          ai_system_instruction: compiledPrompt,
          system_prompt: compiledPrompt,
          business_name: businessName,
          services_text: servicesText,
          hours_text: hoursText,
          payment_methods_text: paymentMethodsText,
          target_audience_text: targetAudienceText,
          rules_text: rulesText,
          bot_language: botLanguage,
          ai_tone: aiTone,
          gcal_calendar_id: gcalCalendarId || null,
          google_review_link: googleReviewLink || null,
          whatsapp_access_token: whatsappAccessToken || null,
          whatsapp_phone_number_id: whatsappPhoneNumberId || null,
          whatsapp_business_account_id: whatsappBusinessAccountId || null,
        })
        .eq("owner_email", user.email);

      if (error) throw error;

      setOriginalData({
        businessName,
        servicesText,
        hoursText,
        paymentMethodsText,
        targetAudienceText,
        rulesText,
        botLanguage,
        aiTone,
        gcalCalendarId,
        googleReviewLink,
        whatsappAccessToken,
        whatsappPhoneNumberId,
        whatsappBusinessAccountId,
      });
      setHasChanges(false);
      
      const now = new Date();
      setLastSavedTime(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
      toastSuccess("Profile saved and deployed to Live Agent");
    } catch (err: any) {
      console.error("[Settings Save Error]:", err.message);
      toastError("Failed to deploy configurations");
    } finally {
      setIsSaving(false);
    }
  }

  // Discard changes
  function handleDiscard() {
    setBusinessName(originalData.businessName);
    setServicesText(originalData.servicesText);
    setHoursText(originalData.hoursText);
    setPaymentMethodsText(originalData.paymentMethodsText);
    setTargetAudienceText(originalData.targetAudienceText);
    setRulesText(originalData.rulesText);
    setBotLanguage(originalData.botLanguage);
    setAiTone(originalData.aiTone);
    setGoogleReviewLink(originalData.googleReviewLink);
    setWhatsappAccessToken(originalData.whatsappAccessToken);
    setWhatsappPhoneNumberId(originalData.whatsappPhoneNumberId);
    setWhatsappBusinessAccountId(originalData.whatsappBusinessAccountId);
    toastSuccess("Modifications discarded");
  }

  // Copy to Clipboard
  function handleCopyToClipboard() {
    navigator.clipboard.writeText(compiledPrompt);
    setIsCopied(true);
    toastSuccess("Compiled instructions copied!");
    setTimeout(() => setIsCopied(false), 2000);
  }

  // Google Calendar Connection Controls
  function handleConnectCalendar() {
    if (!tenantId) {
      toastError("Tenant ID not found. Please reload and try again.");
      return;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    window.open(`${apiUrl}/api/calendar/auth?tenant_id=${tenantId}`, '_blank');
  }

  async function handleDisconnectCalendar() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user || !user.email) throw new Error("No user or email found");

      const { error } = await supabase
        .from("tenants")
        .update({
          gcal_access_token: null,
          gcal_refresh_token: null,
          is_calendar_connected: false
        })
        .eq("owner_email", user.email);

      if (error) throw error;

      setIsCalendarConnected(false);
      toastSuccess("Google Calendar disconnected successfully!");
    } catch (err: any) {
      console.error("[Disconnect Error]:", err.message);
      toastError("Failed to disconnect calendar");
    }
  }

  const inputBaseClass = "w-full px-3.5 bg-[var(--bg-subtle)] border border-[var(--border-default)] rounded-[var(--radius-lg)] text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] font-sans focus:outline-none focus:border-[var(--brand-primary)] focus:shadow-[var(--shadow-focus)] hover:border-[var(--border-strong)] transition-all duration-150";

  // ─── Render Sub-panels ──────────────────────────────────────────────

  const renderProfileTab = () => (
    <div className="divide-y divide-[var(--border-subtle)]">
      {/* Business Name */}
      <SettingsRow
        label={t.businessName}
        description={t.businessNameHelper}
        required
      >
        <input
          type="text"
          value={businessName}
          onChange={(e) => {
            setBusinessName(e.target.value);
            setHasChanges(true);
          }}
          placeholder={t.businessNamePlaceholder}
          className={`${inputBaseClass} h-11`}
        />
      </SettingsRow>

      {/* Primary Bot Language */}
      <SettingsRow
        label={t.botLanguage}
        description={t.botLanguageHelper}
        required
      >
        <div className="relative max-w-md">
          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)] pointer-events-none" />
          <select
            value={botLanguage}
            onChange={(e) => {
              setBotLanguage(e.target.value);
              setHasChanges(true);
            }}
            className={`${inputBaseClass} h-11 pl-10 pr-10 cursor-pointer appearance-none`}
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi (हिंदी)</option>
            <option value="Hinglish">Hinglish</option>
            <option value="Spanish">Spanish (Español)</option>
            <option value="Arabic">Arabic (العربية)</option>
            <option value="French">French (Français)</option>
            <option value="Portuguese">Portuguese (Português)</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none select-none">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
      </SettingsRow>

      {/* AI Tone Preset */}
      <SettingsRow
        label={t.aiToneTitle}
        description={t.aiToneSubtitle}
        required
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 select-none">
          {TONE_OPTIONS.map((opt) => {
            const isSelected = aiTone === opt.value;
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setAiTone(opt.value);
                  setHasChanges(true);
                }}
                className={`p-4 rounded-[var(--radius-xl)] border flex flex-col items-start text-left cursor-pointer select-none relative overflow-hidden transition-all duration-200 min-h-[100px] ${
                  isSelected 
                    ? "border-[var(--brand-primary)] bg-[var(--brand-subtle)]/40 shadow-[var(--shadow-sm)] ring-1 ring-[var(--brand-primary)]/20" 
                    : "border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] hover:border-[var(--border-strong)]"
                }`}
              >
                {/* Selection Checkmark Badge */}
                {isSelected && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[var(--brand-primary)] flex items-center justify-center shadow-[var(--shadow-sm)]"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.span>
                )}
                
                <div className={`p-2 rounded-lg mb-2.5 ${isSelected ? "bg-[var(--brand-subtle)] text-[var(--brand-primary)]" : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"}`}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <span className={`text-xs font-bold tracking-tight ${
                  isSelected ? "text-[var(--brand-primary)]" : "text-[var(--text-primary)]"
                }`}>
                  {opt.label}
                </span>
                
                <span className="text-[10px] text-[var(--text-tertiary)] leading-tight mt-1 font-medium select-none pointer-events-none">
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </SettingsRow>
    </div>
  );

  const renderVectorsTab = () => {
    const PREDEFINED_PAYMENTS = ["Cash", "UPI", "Credit Card", "Debit Card", "Bank Transfer", "PayPal", "Stripe", "Apple Pay", "Google Pay"];
    
    const paymentTags = paymentMethodsText
      ? paymentMethodsText.split(",").map(t => t.trim()).filter(Boolean)
      : [];

    const handleRemovePaymentTag = (tagToRemove: string) => {
      const updatedTags = paymentTags.filter(t => t !== tagToRemove);
      setPaymentMethodsText(updatedTags.join(", "));
      setHasChanges(true);
    };

    const handleAddPaymentTag = (newTag: string) => {
      const trimmed = newTag.trim();
      if (!trimmed) return;
      if (!paymentTags.includes(trimmed)) {
        const updatedTags = [...paymentTags, trimmed];
        setPaymentMethodsText(updatedTags.join(", "));
        setHasChanges(true);
      }
    };

    return (
      <div className="divide-y divide-[var(--border-subtle)]">
        {/* Services & Pricing List */}
        <SettingsRow
          label={t.services}
          description={t.servicesHelper}
          required
        >
          <textarea
            value={servicesText}
            onChange={(e) => {
              setServicesText(e.target.value);
              setHasChanges(true);
            }}
            placeholder={t.servicesPlaceholder}
            className={`${inputBaseClass} py-3 leading-relaxed min-h-[120px] resize-y`}
          />
          <div className="text-[10px] text-[var(--text-tertiary)] mt-1.5 text-right font-mono">
            {servicesText?.length || 0} chars
          </div>
        </SettingsRow>

        {/* Working Hours & Location */}
        <SettingsRow
          label={t.hours}
          description={t.hoursHelper}
          required
        >
          <textarea
            value={hoursText}
            onChange={(e) => {
              setHoursText(e.target.value);
              setHasChanges(true);
            }}
            placeholder={t.hoursPlaceholder}
            className={`${inputBaseClass} py-3 leading-relaxed min-h-[120px] resize-y`}
          />
          <div className="text-[10px] text-[var(--text-tertiary)] mt-1.5 text-right font-mono">
            {hoursText?.length || 0} chars
          </div>
        </SettingsRow>

        {/* Payment Methods Accepted */}
        <SettingsRow
          label={t.payments}
          description={t.paymentsHelper}
          required
        >
          <TagsInput
            tags={paymentTags}
            onAddTag={handleAddPaymentTag}
            onRemoveTag={handleRemovePaymentTag}
            suggestions={PREDEFINED_PAYMENTS}
            placeholder="e.g. UPI, Cash, Cards"
          />
        </SettingsRow>

        {/* Target Audience / Brand Vibe */}
        <SettingsRow
          label={t.targetAudience}
          description={t.targetAudienceHelper}
        >
          <textarea
            value={targetAudienceText}
            onChange={(e) => {
              setTargetAudienceText(e.target.value);
              setHasChanges(true);
            }}
            placeholder={t.targetAudiencePlaceholder}
            className={`${inputBaseClass} py-3 leading-relaxed min-h-[100px] resize-y`}
          />
          <div className="text-[10px] text-[var(--text-tertiary)] mt-1.5 text-right font-mono">
            {targetAudienceText?.length || 0} chars
          </div>
        </SettingsRow>

        {/* Special Rules & Policies */}
        <SettingsRow
          label={t.specialRules}
          description={t.specialRulesHelper}
        >
          <textarea
            value={rulesText}
            onChange={(e) => {
              setRulesText(e.target.value);
              setHasChanges(true);
            }}
            placeholder={t.specialRulesPlaceholder}
            className={`${inputBaseClass} py-3 leading-relaxed min-h-[120px] resize-y`}
          />
          <div className="text-[10px] text-[var(--text-tertiary)] mt-1.5 text-right font-mono">
            {rulesText?.length || 0} chars
          </div>
        </SettingsRow>
      </div>
    );
  };

  const renderCompilerTab = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            {t.promptPreview}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">{t.promptPreviewSubtitle}</p>
        </div>

        <button
          type="button"
          onClick={handleCopyToClipboard}
          className="h-9 px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white border border-transparent rounded-[var(--radius-lg)] text-xs font-semibold flex items-center gap-2 cursor-pointer outline-none transition-all duration-150 active:scale-[0.98] shadow-sm self-start sm:self-center"
        >
          {isCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
          <span>{isCopied ? t.copied : t.copyBtn}</span>
        </button>
      </div>

      {/* Compiler Terminal Mockup */}
      <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[#070A13] p-0 relative select-text flex flex-col shadow-[var(--shadow-lg)]">
        {/* Terminal Header */}
        <div className="h-10 bg-[#0B0F19] border-b border-[var(--border-subtle)] flex items-center justify-between px-4 select-none shrink-0">
          <div className="flex items-center gap-1.5 select-none pointer-events-none">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
          </div>
          <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest opacity-80 pointer-events-none flex items-center gap-1.5">
            <FileText className="w-3 h-3 text-[var(--color-ai)] animate-pulse" />
            gemini-system-compiler.sh
          </span>
          <div className="w-14" /> {/* spacer balance */}
        </div>

        {/* Terminal Workspace body with line numbers */}
        <div className="flex text-xs leading-[1.8] font-mono overflow-y-auto max-h-[380px] bg-[#070A13]">
          {/* Line numbers column */}
          <div className="p-5 pr-3 text-slate-600 border-r border-[#0B0F19] text-right select-none bg-[#05070e] shrink-0 font-mono">
            {compiledPrompt.split("\n").map((_, i) => (
              <div key={i}>{String(i + 1).padStart(2, "0")}</div>
            ))}
          </div>
          {/* Content column */}
          <div className="p-5 pl-4 text-slate-300 whitespace-pre-wrap select-text flex-1">
            {renderHighlightedPrompt(compiledPrompt)}
          </div>
        </div>
      </div>

      {/* Variable vector stats helper */}
      <div className="flex items-start gap-3 p-4 rounded-[var(--radius-xl)] bg-[var(--brand-subtle)] border border-[var(--brand-border)] text-xs text-[var(--brand-text)] font-sans leading-relaxed">
        <Info className="w-4 h-4 shrink-0 text-[var(--brand-primary)] mt-0.5" />
        <div>
          <span className="font-bold text-[var(--brand-text-strong)] block mb-0.5">How this compilation works:</span>
          The values you customize in the profile and knowledge tabs are dynamically injected as system prompt inputs inside Gemini. This ensures the live WhatsApp chatbot acts with high context and operates strictly within your rules.
        </div>
      </div>
    </div>
  );

  const renderIntegrationsTab = () => (
    <div className="divide-y divide-[var(--border-subtle)]">
      {/* Google Calendar Section */}
      <SettingsRow
        label="Google Calendar"
        description="Allows your Gemini AI representative to read your schedule, calculate free slots, and book new appointments automatically."
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-xs text-[var(--text-primary)]">Status:</span>
            {isCalendarConnected ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--success-border)] uppercase font-mono">
                <Check className="w-3 h-3 text-emerald-500" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-[var(--bg-muted)] text-[var(--text-tertiary)] border border-[var(--border-subtle)] uppercase font-mono">
                Not Connected
              </span>
            )}
          </div>

          <div>
            {isCalendarConnected ? (
              <button
                type="button"
                onClick={handleDisconnectCalendar}
                className="h-9 px-4 bg-[var(--color-danger-bg)] hover:bg-[var(--color-danger-bg-hover)] border border-[var(--danger-border)] text-[var(--color-danger-text)] rounded-[var(--radius-lg)] text-xs font-semibold cursor-pointer outline-none transition-all duration-150 active:scale-[0.98]"
              >
                Disconnect Calendar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectCalendar}
                className="h-9 px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-[var(--radius-lg)] text-xs font-semibold cursor-pointer outline-none transition-all duration-150 active:scale-[0.98] flex items-center gap-1.5 shadow-[var(--shadow-sm)]"
              >
                <Globe className="w-4 h-4" />
                Connect Google Calendar
              </button>
            )}
          </div>
        </div>

        {isCalendarConnected && (
          <div className="space-y-2 mt-4">
            <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-[1.5px] flex items-center gap-1.5">
              Google Calendar ID
            </label>
            <input
              type="text"
              value={gcalCalendarId}
              onChange={(e) => {
                setGcalCalendarId(e.target.value);
                setHasChanges(true);
              }}
              placeholder="primary (default)"
              className={`${inputBaseClass} h-11`}
            />
            <p className="text-[10px] text-[var(--text-tertiary)] font-sans leading-tight">
              By default, LeadFlow books appointments on your "primary" calendar. Enter a secondary calendar ID here to use a specific schedule sub-calendar.
            </p>
          </div>
        )}
      </SettingsRow>

      {/* WhatsApp Account Integration */}
      <SettingsRow
        label="WhatsApp Account Connection"
        description="Configure your Meta WhatsApp Business integration. Get access token, Phone Number ID, and WhatsApp Business Account ID from Meta's dashboard."
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-[var(--text-primary)]">Status:</span>
              {whatsappPhoneNumberId && whatsappBusinessAccountId ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--success-border)] uppercase font-mono">
                  <Check className="w-3 h-3 text-emerald-500" />
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-[var(--bg-muted)] text-[var(--text-tertiary)] border border-[var(--border-subtle)] uppercase font-mono">
                  Not Connected
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowSetupGuide(!showSetupGuide)}
                className="h-9 px-3.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] text-xs font-bold text-[var(--text-primary)] flex items-center gap-2 cursor-pointer transition-all duration-150 active:scale-[0.98]"
              >
                <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 ${showSetupGuide ? "rotate-180" : ""}`} />
                <span>{showSetupGuide ? "Hide Setup Guide" : "View Setup Guide"}</span>
              </button>
              <a 
                href="https://developers.facebook.com/apps/1586663712852403/use_cases/customize/wa-dev-console/?use_case_enum=WHATSAPP_BUSINESS_MESSAGING&selected_tab=wa-dev-console&product_route=whatsapp-business&business_id=1541013347588467" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="h-9 px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-[var(--radius-lg)] text-xs font-bold flex items-center gap-2 cursor-pointer transition-all duration-150 active:scale-[0.98] shadow-sm inline-flex items-center justify-center"
              >
                <span>Open Meta Console</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {showSetupGuide && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="relative pl-6 sm:pl-8 border-l border-dashed border-[var(--border-subtle)] ml-3 sm:ml-4 space-y-6 py-4">
                  {/* Step 1 */}
                  <div className="relative space-y-2">
                    <div className="absolute -left-[35px] sm:-left-[43px] top-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--brand-primary)] text-white text-[10px] font-bold flex items-center justify-center border-4 border-[var(--bg-surface)] shadow-sm">
                      1
                    </div>
                    <h5 className="font-bold text-xs text-[var(--text-primary)]">Generate Your Meta Access Token</h5>
                    <p className="text-[11px] text-[var(--text-secondary)]">Click the Generate access token button on Meta's dashboard.</p>
                  </div>
                  {/* Step 2 */}
                  <div className="relative space-y-2">
                    <div className="absolute -left-[35px] sm:-left-[43px] top-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--brand-primary)] text-white text-[10px] font-bold flex items-center justify-center border-4 border-[var(--bg-surface)] shadow-sm">
                      2
                    </div>
                    <h5 className="font-bold text-xs text-[var(--text-primary)]">Copy the Phone Number ID</h5>
                    <p className="text-[11px] text-[var(--text-secondary)]">Copy and paste Phone number ID into Waba configurations.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">Phone Number ID</label>
                <input
                  type="text"
                  value={whatsappPhoneNumberId}
                  onChange={(e) => {
                    setWhatsappPhoneNumberId(e.target.value);
                    setHasChanges(true);
                  }}
                  placeholder="e.g., 123456789012345"
                  className={`${inputBaseClass} h-11`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">WABA ID</label>
                <input
                  type="text"
                  value={whatsappBusinessAccountId}
                  onChange={(e) => {
                    setWhatsappBusinessAccountId(e.target.value);
                    setHasChanges(true);
                  }}
                  placeholder="e.g., 987654321098765"
                  className={`${inputBaseClass} h-11`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider">Meta Permanent Access Token</label>
              <div className="relative">
                <input
                  type={showToken ? "text" : "password"}
                  value={whatsappAccessToken}
                  onChange={(e) => {
                    setWhatsappAccessToken(e.target.value);
                    setHasChanges(true);
                  }}
                  placeholder="EA..."
                  className={`${inputBaseClass} h-11 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] focus:outline-none cursor-pointer"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </SettingsRow>

      {/* Reputation Engine */}
      <SettingsRow
        label="Reputation Engine"
        description="Automatically request Google reviews from completed leads. The engine will dispatch a review request 24 hours after a lead is moved to 'Completed'."
      >
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
            Google Maps Review Link
          </label>
          <div className="relative">
            <input
              type="text"
              value={googleReviewLink}
              disabled={subscriptionTier !== "domination"}
              onChange={(e) => {
                setGoogleReviewLink(e.target.value);
                setHasChanges(true);
              }}
              placeholder="e.g., https://g.page/r/your-review-id/review"
              className={`${inputBaseClass} h-11 ${
                subscriptionTier !== "domination"
                  ? "opacity-60 cursor-not-allowed bg-[var(--bg-muted)] pr-36"
                  : ""
              }`}
            />
            {subscriptionTier !== "domination" && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 select-none">
                <span className="inline-flex items-center px-2.5 py-1 rounded bg-violet-600/90 text-white text-[9px] font-bold uppercase tracking-wider shadow-sm font-sans">
                  Advance Feature Required
                </span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-[var(--text-tertiary)] font-sans leading-tight">
            Ensure this is a direct, pre-approved Google Review link. Leave blank to disable automated review messages.
          </p>
        </div>
      </SettingsRow>
    </div>
  );

  return (
    <div className="h-full overflow-hidden bg-[var(--bg-canvas)] select-none flex flex-col">
      
      {/* ─── Scrollable Body Area ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24">
        
        <div className="max-w-[960px] mx-auto select-none font-sans">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[var(--border-subtle)] pb-6 mb-6 gap-4">
            <div className="space-y-1">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight leading-tight">
                {t.title || "Your preferences"}
              </h1>
              {/* Shareable profile URL */}
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-medium">
                <span className="text-[var(--brand-primary)]">leadflow.ai/@{businessName ? businessName.toLowerCase().replace(/[^a-z0-9]/g, "") : "my-business"}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`leadflow.ai/@${businessName ? businessName.toLowerCase().replace(/[^a-z0-9]/g, "") : "my-business"}`);
                    toastSuccess("Profile link copied!");
                  }}
                  className="p-1 hover:bg-[var(--bg-subtle)] rounded transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer"
                  title="Copy profile link"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-3">
              {/* Language switcher */}
              <div className="flex bg-[var(--bg-surface-raised)] p-[3px] rounded-[var(--radius-md)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)] gap-[2px] select-none relative shrink-0">
                {(["en", "hi", "gu"] as const).map((lang) => {
                  const labels = { en: "EN", hi: "हिंदी", gu: "ગુ" };
                  const isSelected = formLanguage === lang;
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setFormLanguage(lang)}
                      className={`px-3 py-1 text-[11px] font-semibold rounded-[var(--radius-sm)] cursor-pointer outline-none transition-all duration-200 relative z-10 ${
                        isSelected
                          ? "text-white"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="active-lang-pill"
                          className="absolute inset-0 bg-[var(--brand-primary)] rounded-[var(--radius-sm)] z-[-1]"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        />
                      )}
                      {labels[lang]}
                    </button>
                  );
                })}
              </div>

              {/* ... Options button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    toastSuccess("LeadFlow Business Agent config active");
                  }}
                  className="p-2.5 rounded-[var(--radius-lg)] border border-[var(--border-default)] hover:border-[var(--border-strong)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer flex items-center justify-center"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                  </svg>
                </button>
              </div>

              {/* Primary action CTA button */}
              <button
                type="button"
                onClick={() => {
                  window.open("/inbox", "_blank");
                }}
                className="h-10 px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-[var(--radius-lg)] text-xs font-semibold cursor-pointer outline-none flex items-center gap-1.5 shadow-[var(--shadow-sm)] whitespace-nowrap transition-all duration-150 active:scale-[0.98]"
              >
                <span>View Live Chatbot</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Horizontal Navigation Tabs */}
          <div className="flex border-b border-[var(--border-subtle)] gap-8 mb-8 overflow-x-auto select-none no-scrollbar">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setActiveAccordion(tab.id as any);
                  }}
                  className={`pb-3.5 text-sm font-medium transition-all relative border-b-2 cursor-pointer outline-none whitespace-nowrap ${
                    isActive 
                      ? "border-[var(--brand-primary)] text-[var(--brand-primary)] font-semibold" 
                      : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {tab.label}
                  {tab.hasChanges && (
                    <span className="absolute top-0 -right-2 w-1.5 h-1.5 rounded-full bg-[var(--color-warning)]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Settings Section Description */}
          <div className="mb-6">
            <h2 className="text-lg font-bold font-display text-[var(--text-primary)]">
              {activeTab === "profile" && "Preferences"}
              {activeTab === "vectors" && "Knowledge Vectors"}
              {activeTab === "compiler" && "AI Prompt Compiler"}
              {activeTab === "integrations" && "Integrations & Channels"}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-sans leading-relaxed">
              {activeTab === "profile" && "Share your business name, tone, and language expectations. These details help guide how the AI handles customer conversations."}
              {activeTab === "vectors" && "Define services, prices, working schedules, and special rules. The AI prompt compiler uses these inputs to keep chatbot responses accurate."}
              {activeTab === "compiler" && "Review the compiled system instruction prompt sent to Gemini. Make sure variables align with your business guidelines."}
              {activeTab === "integrations" && "Connect Google Calendar to enable direct slot bookings, and set up your Meta WhatsApp API credentials."}
            </p>
          </div>

          {/* Main Workspace */}
          {isLoading ? (
            <div className="bg-[var(--bg-surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] p-6 h-96 animate-shimmer" />
          ) : (
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-6 md:p-8 shadow-[var(--shadow-sm)] relative font-sans">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15, ease: "easeInOut" }}
                >
                  {activeTab === "profile" && renderProfileTab()}
                  {activeTab === "vectors" && renderVectorsTab()}
                  {activeTab === "compiler" && renderCompilerTab()}
                  {activeTab === "integrations" && renderIntegrationsTab()}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Render Actions in Layout Header Portal */}
      {mounted && typeof document !== "undefined" && document.getElementById("header-cta-portal") ? (
        createPortal(
          <div className="flex items-center gap-2">
            {hasChanges && (
              <button
                type="button"
                onClick={handleDiscard}
                className="h-9 px-3.5 rounded-[var(--radius-lg)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] cursor-pointer outline-none transition-all duration-150 whitespace-nowrap"
              >
                {t.discard}
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="h-9 px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] disabled:bg-[var(--bg-muted)] text-white disabled:text-[var(--text-tertiary)] rounded-[var(--radius-lg)] text-xs font-semibold cursor-pointer outline-none flex items-center gap-1.5 active:scale-[0.97] disabled:cursor-not-allowed transition-all duration-150 shadow-[var(--shadow-sm)] whitespace-nowrap"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span>{t.saving}</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.save}</span>
                </>
              )}
            </button>
          </div>,
          document.getElementById("header-cta-portal")!
        )
      ) : null}

    </div>
  );
}
