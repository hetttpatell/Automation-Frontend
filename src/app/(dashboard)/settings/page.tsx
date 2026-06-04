"use client";

import React, { useState, useEffect } from "react";
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
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/Toast";

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
    tabCompilerDesc: "लाइव कंपाइल निर्देश पूर्वावलोकन"
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

export default function SettingsPage() {
  const supabase = createClient();
  const { success: toastSuccess, error: toastError } = useToast();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<"profile" | "vectors" | "compiler" | "integrations">("profile");

  // Form states
  const [businessName, setBusinessName] = useState("");
  const [servicesText, setServicesText] = useState("");
  const [hoursText, setHoursText] = useState("");
  const [paymentMethodsText, setPaymentMethodsText] = useState("");
  const [targetAudienceText, setTargetAudienceText] = useState("");
  const [rulesText, setRulesText] = useState("");
  const [botLanguage, setBotLanguage] = useState("English");
  const [aiTone, setAiTone] = useState("Professional");

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
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Fetch initial configs
  const fetchConfig = React.useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[Settings Auth Error]:", authError?.message || "No user found");
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("tenants")
      .select("id, is_calendar_connected, gcal_calendar_id, google_review_link, ai_system_instruction, ai_tone, business_name, services_text, hours_text, rules_text, bot_language, payment_methods_text, target_audience_text, subscription_tier")
      .eq("owner_email", user.email)
      .single();

    let tenantConfig = data;
    const defaultBusinessName = user.email
      ? user.email.split("@")[0].charAt(0).toUpperCase() + user.email.split("@")[0].slice(1) + "'s Business"
      : "My Business";

    if (error && error.code === "PGRST116") {
      const initialPrompt = `You are the LeadFlow AI Assistant, an elite, hyper-efficient sales representative for ${defaultBusinessName}. 
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
        .select("id, is_calendar_connected, gcal_calendar_id, google_review_link, ai_system_instruction, ai_tone, business_name, services_text, hours_text, rules_text, bot_language, payment_methods_text, target_audience_text, subscription_tier")
        .single();

      if (createError) {
        if (createError.code === "23505" || createError.message?.includes("unique constraint")) {
          const { data: existingTenant, error: fetchError } = await supabase
            .from("tenants")
            .select("id, is_calendar_connected, gcal_calendar_id, google_review_link, ai_system_instruction, ai_tone, business_name, services_text, hours_text, rules_text, bot_language, payment_methods_text, target_audience_text, subscription_tier")
            .eq("owner_email", user.email)
            .single();
          if (!fetchError) tenantConfig = existingTenant;
        }
      } else {
        tenantConfig = newTenant;
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
      });
    }

    setIsLoading(false);
  }, [supabase]);

  // Initial fetch on mount
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Re-fetch config on tab focus (syncs connected state if they completed OAuth in the newly opened tab)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleFocus = () => {
      // Re-fetch silently without showing full-screen loader to keep it seamless
      fetchConfig(false);
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchConfig]);

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

  // Track global dirty changes
  useEffect(() => {
    setHasChanges(hasProfileChanges || hasVectorChanges || hasIntegrationChanges);
  }, [hasProfileChanges, hasVectorChanges, hasIntegrationChanges]);

  // Compile instructions preview
  const compiledPrompt = `You are the LeadFlow AI Assistant, an elite, hyper-efficient sales representative for ${businessName || "My Business"}. 
You must communicate primarily in ${botLanguage}.
Our services are: ${servicesText || "General services and business support"}. 
Our hours are: ${hoursText || "Monday to Friday: 9:00 AM - 6:00 PM"}. 
We accept these payments: ${paymentMethodsText || "Cash, UPI, Cards"}.
Our target audience is: ${targetAudienceText || "General segment"}.
Follow these rules strictly: ${rulesText || "Customer satisfaction is paramount."}`;

  // Helper to compile and highlight active variables inside terminal preview
  const renderHighlightedPrompt = (text: string) => {
    const variables = [
      { key: businessName || "My Business", label: "businessName", style: "bg-[var(--brand-subtle)] text-[var(--brand-primary)] border border-[var(--brand-border)] px-1.5 py-0.5 rounded font-mono font-bold mx-0.5 inline-block" },
      { key: botLanguage, label: "botLanguage", style: "bg-[var(--color-success-bg)] text-[var(--color-success-text)] border border-[var(--success-border)] px-1.5 py-0.5 rounded font-mono font-bold mx-0.5 inline-block" },
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

    if (authError || !user) {
      console.error("[Save Config Error]: No User Session");
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
          google_review_link: googleReviewLink || null
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
    // Open OAuth endpoint in a new tab to bypass iframe sandboxing limits
    window.open(`http://localhost:3001/api/calendar/auth?tenant_id=${tenantId}`, '_blank');
  }

  async function handleDisconnectCalendar() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("No user found");

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

  return (
    <div className="h-full overflow-hidden bg-[var(--bg-canvas)] select-none flex flex-col">
      
      {/* ─── Scrollable Body Area ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24">
        
        {/* Page Header (with language segmented switcher) */}
        <div className="max-w-[1000px] mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--brand-subtle)] border border-[var(--brand-border)] text-[10px] font-mono font-bold tracking-wider text-[var(--brand-primary)] uppercase select-none self-start">
              {t.badge}
            </div>

            <div className="space-y-1">
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight leading-tight">
                {t.title}
              </h1>
              <p className="font-sans text-xs text-[var(--text-secondary)] font-medium max-w-xl">
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* 3-Option segmented language control */}
          <div className="flex bg-[var(--bg-surface)] p-[4px] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] self-start md:self-center shadow-[var(--shadow-sm)] gap-[2px] select-none">
            {(["en", "hi", "gu"] as const).map((lang) => {
              const labels = { en: "EN", hi: "हिंदी", gu: "ગુ" };
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setFormLanguage(lang)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] cursor-pointer outline-none transition-all duration-150 ${
                    formLanguage === lang
                      ? "bg-[var(--brand-primary)] text-white shadow-[var(--shadow-sm)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
                  }`}
                >
                  {labels[lang]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Settings Grid Workspace */}
        <div className="max-w-[1000px] mx-auto select-none">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 space-y-3">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-14 bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] animate-shimmer" />
                ))}
              </div>
              <div className="md:col-span-3 bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-6 h-96 animate-shimmer" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
              
              {/* Sidebar Tabs (Vertical on Desktop, Horizontal Pill List on Mobile) */}
              <nav className="md:col-span-1 flex flex-row md:flex-col overflow-x-auto md:overflow-visible pb-2 md:pb-0 gap-1.5 select-none scrollbar-none border-b md:border-b-0 border-[var(--border-subtle)]">
                
                {/* Profile Tab Link */}
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={`flex-1 md:flex-none text-left flex items-center md:items-start gap-3 p-3 rounded-[var(--radius-lg)] border cursor-pointer select-none transition-all duration-150 relative whitespace-nowrap shrink-0 ${
                    activeTab === "profile"
                      ? "bg-[var(--bg-surface)] border-[var(--brand-border)] shadow-[var(--shadow-sm)] text-[var(--brand-primary)]"
                      : "bg-[var(--bg-canvas)] border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                  }`}
                >
                  <div className={`p-1.5 rounded-md ${activeTab === "profile" ? "bg-[var(--brand-subtle)]" : "bg-[var(--bg-subtle)]"}`}>
                    <User className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold leading-tight">{t.tabProfile}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)] font-normal truncate max-w-[130px]">{t.tabProfileDesc}</span>
                  </div>
                  <span className="md:hidden text-xs font-bold">{t.tabProfile}</span>

                  {/* Unsaved Changes Indicator Dot */}
                  {hasProfileChanges && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--color-warning)] shadow-sm animate-pulse" />
                  )}
                </button>

                {/* Vectors Tab Link */}
                <button
                  type="button"
                  onClick={() => setActiveTab("vectors")}
                  className={`flex-1 md:flex-none text-left flex items-center md:items-start gap-3 p-3 rounded-[var(--radius-lg)] border cursor-pointer select-none transition-all duration-150 relative whitespace-nowrap shrink-0 ${
                    activeTab === "vectors"
                      ? "bg-[var(--bg-surface)] border-[var(--brand-border)] shadow-[var(--shadow-sm)] text-[var(--brand-primary)]"
                      : "bg-[var(--bg-canvas)] border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                  }`}
                >
                  <div className={`p-1.5 rounded-md ${activeTab === "vectors" ? "bg-[var(--brand-subtle)]" : "bg-[var(--bg-subtle)]"}`}>
                    <BookOpen className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold leading-tight">{t.tabVectors}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)] font-normal truncate max-w-[130px]">{t.tabVectorsDesc}</span>
                  </div>
                  <span className="md:hidden text-xs font-bold">{t.tabVectors}</span>

                  {/* Unsaved Changes Indicator Dot */}
                  {hasVectorChanges && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--color-warning)] shadow-sm animate-pulse" />
                  )}
                </button>

                {/* Compiler Tab Link */}
                <button
                  type="button"
                  onClick={() => setActiveTab("compiler")}
                  className={`flex-1 md:flex-none text-left flex items-center md:items-start gap-3 p-3 rounded-[var(--radius-lg)] border cursor-pointer select-none transition-all duration-150 relative whitespace-nowrap shrink-0 ${
                    activeTab === "compiler"
                      ? "bg-[var(--bg-surface)] border-[var(--brand-border)] shadow-[var(--shadow-sm)] text-[var(--brand-primary)]"
                      : "bg-[var(--bg-canvas)] border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                  }`}
                >
                  <div className={`p-1.5 rounded-md ${activeTab === "compiler" ? "bg-[var(--brand-subtle)]" : "bg-[var(--bg-subtle)]"}`}>
                    <Terminal className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold leading-tight">{t.tabCompiler}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)] font-normal truncate max-w-[130px]">{t.tabCompilerDesc}</span>
                  </div>
                  <span className="md:hidden text-xs font-bold">{t.tabCompiler}</span>

                  {/* Compiling live highlight indicator dot */}
                  <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[var(--color-ai)] pulse-dot-ai" />
                </button>

                {/* Integrations Tab Link */}
                <button
                  type="button"
                  onClick={() => setActiveTab("integrations")}
                  className={`flex-1 md:flex-none text-left flex items-center md:items-start gap-3 p-3 rounded-[var(--radius-lg)] border cursor-pointer select-none transition-all duration-150 relative whitespace-nowrap shrink-0 ${
                    activeTab === "integrations"
                      ? "bg-[var(--bg-surface)] border-[var(--brand-border)] shadow-[var(--shadow-sm)] text-[var(--brand-primary)]"
                      : "bg-[var(--bg-canvas)] border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                  }`}
                >
                  <div className={`p-1.5 rounded-md ${activeTab === "integrations" ? "bg-[var(--brand-subtle)]" : "bg-[var(--bg-subtle)]"}`}>
                    <Globe className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs font-bold leading-tight">Integrations & Booking</span>
                    <span className="text-[10px] text-[var(--text-tertiary)] font-normal truncate max-w-[130px]">Connect Google Calendar</span>
                  </div>
                  <span className="md:hidden text-xs font-bold">Integrations</span>

                  {/* Unsaved Changes Indicator Dot */}
                  {hasIntegrationChanges && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--color-warning)] shadow-sm animate-pulse" />
                  )}
                </button>
              </nav>

              {/* Active Tab Panel Content */}
              <div className="md:col-span-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-5 sm:p-6 shadow-[var(--shadow-sm)] min-h-[380px] relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15, ease: "easeInOut" }}
                    className="h-full"
                  >
                    {/* ─── TAB: Profile & Identity ──────────────────────────────── */}
                    {activeTab === "profile" && (
                      <div className="space-y-6">
                        <div className="border-b border-[var(--border-subtle)] pb-4">
                          <h2 className="text-sm font-bold font-display text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-[var(--brand-primary)]" />
                            {t.identityTitle}
                          </h2>
                          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">{t.identitySubtitle}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Business Name Field */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5" />
                              {t.businessName}
                            </label>
                            <input
                              type="text"
                              value={businessName}
                              onChange={(e) => setBusinessName(e.target.value)}
                              placeholder={t.businessNamePlaceholder}
                              className={`${inputBaseClass} h-11`}
                            />
                            <p className="text-[10px] text-[var(--text-tertiary)] font-sans leading-tight">
                              {t.businessNameHelper}
                            </p>
                          </div>

                          {/* Primary Bot Language Field */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5" />
                              {t.botLanguage}
                            </label>
                            <div className="relative">
                              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)] pointer-events-none" />
                              <select
                                value={botLanguage}
                                onChange={(e) => setBotLanguage(e.target.value)}
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
                            <p className="text-[10px] text-[var(--text-tertiary)] font-sans leading-tight">
                              {t.botLanguageHelper}
                            </p>
                          </div>
                        </div>

                        {/* Tone Presets Selector */}
                        <div className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
                          <div>
                            <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                              {t.aiToneTitle}
                            </label>
                            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{t.aiToneSubtitle}</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 select-none">
                            {TONE_OPTIONS.map((opt) => {
                              const isSelected = aiTone === opt.value;
                              const Icon = opt.icon;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => setAiTone(opt.value)}
                                  className={`p-4 rounded-[var(--radius-lg)] border flex flex-col items-center justify-center text-center cursor-pointer select-none relative active:scale-[0.98] overflow-hidden min-h-[110px] ${
                                    isSelected 
                                      ? "border-[var(--brand-primary)] bg-[var(--brand-subtle)] shadow-[var(--shadow-sm)]" 
                                      : "border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] hover:border-[var(--border-strong)]"
                                  }`}
                                  style={{ transition: "border-color 150ms ease, background-color 150ms ease, box-shadow 150ms ease, transform 100ms ease" }}
                                >
                                  {/* Selection Checkmark Badge */}
                                  {isSelected && (
                                    <span className="absolute top-2 right-2 w-[18px] h-[18px] rounded-full bg-[var(--brand-primary)] flex items-center justify-center shadow-md">
                                      <Check className="w-2.5 h-2.5 text-white" />
                                    </span>
                                  )}
                                  
                                  <motion.div
                                    animate={{ 
                                      scale: isSelected ? 1.15 : 1,
                                      rotate: isSelected ? [0, 6, -6, 0] : 0
                                    }}
                                    transition={{ 
                                      scale: { type: "spring", stiffness: 350, damping: 20 },
                                      rotate: { duration: 0.4, ease: "easeInOut" }
                                    }}
                                  >
                                    <Icon className={`w-5 h-5 mb-2 ${
                                      isSelected ? "text-[var(--brand-primary)]" : "text-[var(--text-secondary)]"
                                    }`} />
                                  </motion.div>
                                  
                                  <span className={`text-[12px] font-display font-bold leading-none ${
                                    isSelected ? "text-[var(--brand-text-strong)]" : "text-[var(--text-primary)]"
                                  }`}>
                                    {opt.label}
                                  </span>
                                  
                                  <span className="text-[10px] text-[var(--text-secondary)] leading-tight mt-1 px-1 opacity-85 select-none pointer-events-none">
                                    {opt.desc}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ─── TAB: Knowledge Vectors ────────────────────────────────── */}
                    {activeTab === "vectors" && (
                      <div className="space-y-6">
                        <div className="border-b border-[var(--border-subtle)] pb-4">
                          <h2 className="text-sm font-bold font-display text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-[var(--brand-primary)]" />
                            {t.coreInfoTitle}
                          </h2>
                          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">{t.coreInfoSubtitle}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Services & Pricing Field */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                              <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
                              {t.services}
                            </label>
                            <textarea
                              value={servicesText}
                              onChange={(e) => setServicesText(e.target.value)}
                              placeholder={t.servicesPlaceholder}
                              className={`${inputBaseClass} py-3.5 leading-relaxed min-h-[90px] resize-y`}
                            />
                            <p className="text-[10px] text-[var(--text-tertiary)] leading-tight">{t.servicesHelper}</p>
                          </div>

                          {/* Working Hours Field */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              {t.hours}
                            </label>
                            <textarea
                              value={hoursText}
                              onChange={(e) => setHoursText(e.target.value)}
                              placeholder={t.hoursPlaceholder}
                              className={`${inputBaseClass} py-3.5 leading-relaxed min-h-[90px] resize-y`}
                            />
                            <p className="text-[10px] text-[var(--text-tertiary)] leading-tight">{t.hoursHelper}</p>
                          </div>

                          {/* Payment Methods Field */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                              <CreditCard className="w-3.5 h-3.5 text-purple-500" />
                              {t.payments}
                            </label>
                            <textarea
                              value={paymentMethodsText}
                              onChange={(e) => setPaymentMethodsText(e.target.value)}
                              placeholder={t.paymentsPlaceholder}
                              className={`${inputBaseClass} py-3.5 leading-relaxed min-h-[90px] resize-y`}
                            />
                            <p className="text-[10px] text-[var(--text-tertiary)] leading-tight">{t.paymentsHelper}</p>
                          </div>

                          {/* Target Audience Field */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                              {t.targetAudience}
                            </label>
                            <textarea
                              value={targetAudienceText}
                              onChange={(e) => setTargetAudienceText(e.target.value)}
                              placeholder={t.targetAudiencePlaceholder}
                              className={`${inputBaseClass} py-3.5 leading-relaxed min-h-[90px] resize-y`}
                            />
                            <p className="text-[10px] text-[var(--text-tertiary)] leading-tight">{t.targetAudienceHelper}</p>
                          </div>
                        </div>

                        {/* Special Rules & Policies Field */}
                        <div className="space-y-2 pt-4 border-t border-[var(--border-subtle)]">
                          <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                            {t.specialRules}
                          </label>
                          <textarea
                            value={rulesText}
                            onChange={(e) => setRulesText(e.target.value)}
                            placeholder={t.specialRulesPlaceholder}
                            className={`${inputBaseClass} py-3.5 leading-relaxed min-h-[90px] resize-y`}
                          />
                          <p className="text-[10px] text-[var(--text-tertiary)] leading-tight">{t.specialRulesHelper}</p>
                        </div>
                      </div>
                    )}

                    {/* ─── TAB: Prompt Compiler ──────────────────────────────────── */}
                    {activeTab === "compiler" && (
                      <div className="space-y-6">
                        <div className="border-b border-[var(--border-subtle)] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <h2 className="text-sm font-bold font-display text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                              <Terminal className="w-4 h-4 text-[var(--brand-primary)]" />
                              {t.promptPreview}
                            </h2>
                            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">{t.promptPreviewSubtitle}</p>
                          </div>

                          <button
                            type="button"
                            onClick={handleCopyToClipboard}
                            className="h-9 px-3 bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer outline-none transition-all duration-150 self-start sm:self-center"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[var(--text-secondary)]" />}
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
                              <FileText className="w-3 h-3 text-[var(--color-ai)]" />
                              gemini-system-compiler.sh
                            </span>
                            <div className="w-14" /> {/* spacer balance */}
                          </div>

                          {/* Terminal Workspace body */}
                          <div className="p-5 text-xs leading-[1.8] font-mono text-slate-300 overflow-y-auto max-h-[360px] whitespace-pre-wrap select-text">
                            {renderHighlightedPrompt(compiledPrompt)}
                          </div>
                        </div>

                        {/* Variable vector stats helper */}
                        <div className="flex items-start gap-2.5 p-3.5 rounded-[var(--radius-lg)] bg-[var(--brand-subtle)] border border-[var(--brand-border)] text-xs text-[var(--brand-text)] font-sans leading-relaxed">
                          <Info className="w-4 h-4 shrink-0 text-[var(--brand-primary)] mt-0.5" />
                          <div>
                            <span className="font-semibold block">How this compilation works:</span>
                            The values you customize in the profile and knowledge tabs are dynamically injected as system prompt inputs inside Gemini. This ensures the live WhatsApp chatbot acts with high context and operates strictly within your rules.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ─── TAB: Integrations & Booking ─────────────────────────────── */}
                    {activeTab === "integrations" && (
                      <div className="space-y-6">
                        <div className="border-b border-[var(--border-subtle)] pb-4">
                          <h2 className="text-sm font-bold font-display text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                            <Globe className="w-4 h-4 text-[var(--brand-primary)]" />
                            Integrations & Booking
                          </h2>
                          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                            Connect your external calendar services to empower AI bookings.
                          </p>
                        </div>

                        <div className="p-6 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-[var(--text-primary)]">Google Calendar</span>
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
                            <p className="text-xs text-[var(--text-secondary)] max-w-xl">
                              Allows your Gemini AI representative to read your schedule, calculate free slots, and book new detailing appointments automatically.
                            </p>
                          </div>

                          <div className="shrink-0">
                            {isCalendarConnected ? (
                              <button
                                type="button"
                                onClick={handleDisconnectCalendar}
                                className="h-10 px-4 bg-[var(--color-danger-bg)] hover:bg-[var(--color-danger-bg-hover)] border border-[var(--danger-border)] text-[var(--color-danger-text)] rounded-[var(--radius-lg)] text-xs font-semibold cursor-pointer outline-none transition-all duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-red-500"
                              >
                                Disconnect Calendar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={handleConnectCalendar}
                                className="h-10 px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-[var(--radius-lg)] text-xs font-semibold cursor-pointer outline-none transition-all duration-150 active:scale-[0.98] flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
                              >
                                <Globe className="w-4 h-4" />
                                Connect Google Calendar
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Calendar Settings */}
                        {isCalendarConnected && (
                          <div className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
                            <div className="space-y-2">
                              <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
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
                                By default, LeadFlow books appointments on your "primary" calendar. Enter a secondary calendar ID here if you want to use a specific schedule sub-calendar.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Reputation Engine Section */}
                        <div className="space-y-4 pt-6 mt-6 border-t border-[var(--border-subtle)]">
                          <div>
                            <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-amber-500" />
                              Reputation Engine (Pro Feature)
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
                              Automatically request Google reviews from completed leads. The engine will dispatch a review request 24 hours after a lead is moved to "Completed".
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                              <Globe className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
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
                              Ensure this is a direct, pre-approved Google Review link (e.g. g.page/r/...) so that customers can open the review portal in one click. Leave blank to disable automated review messages.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

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
                className="h-9 px-3.5 rounded-[var(--radius-lg)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] cursor-pointer outline-none transition-all duration-150"
              >
                {t.discard}
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="h-9 px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] disabled:bg-[var(--bg-muted)] text-white disabled:text-[var(--text-tertiary)] rounded-[var(--radius-lg)] text-xs font-semibold cursor-pointer outline-none flex items-center gap-1.5 active:scale-[0.97] disabled:cursor-not-allowed transition-all duration-150 shadow-[var(--shadow-sm)]"
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
