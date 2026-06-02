"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  Save, 
  Loader2, 
  Sparkles, 
  Check, 
  Eye, 
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
  ChevronDown
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
    lastSaved: "Last saved"
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
    promptPreview: "एआई सिस्टम निर्देश पूर्वावलोकन",
    promptPreviewSubtitle: "जेमिनी को भेजे गए संकलित निर्देश प्रॉम्प्ट",
    copyBtn: "क्लिपबोर्ड पर कॉपी करें",
    copied: "कॉपी किया गया!",
    unsavedTitle: "असुरक्षित परिवर्तन",
    unsavedSubtitle: "संशोधन अभी तक लाइव एजेंट वैक्टर पर तैनात नहीं किए गए हैं।",
    discard: "रद्द करें",
    save: "प्रोफ़ाइल सहेजें",
    saving: "तैनात किया जा रहा है...",
    lastSaved: "अंतिम बार सहेजा गया"
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
    lastSaved: "છેલ્લે સાચવેલ"
  }
};

export default function SettingsPage() {
  const supabase = createClient();
  const { success: toastSuccess, error: toastError } = useToast();

  // Form states
  const [businessName, setBusinessName] = useState("");
  const [servicesText, setServicesText] = useState("");
  const [hoursText, setHoursText] = useState("");
  const [paymentMethodsText, setPaymentMethodsText] = useState("");
  const [targetAudienceText, setTargetAudienceText] = useState("");
  const [rulesText, setRulesText] = useState("");
  const [botLanguage, setBotLanguage] = useState("English");
  const [aiTone, setAiTone] = useState("Professional");

  // Dynamic UI Language
  const [formLanguage, setFormLanguage] = useState<"en" | "hi" | "gu">("en");

  // Toggle visual preview
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
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
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const t = TRANSLATIONS[formLanguage];

  // Fetch initial configs
  useEffect(() => {
    async function fetchConfig() {
      setIsLoading(true);

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error("[Settings Auth Error]:", authError?.message || "No user found");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("tenants")
        .select("ai_system_instruction, ai_tone, business_name, services_text, hours_text, rules_text, bot_language, payment_methods_text, target_audience_text")
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
          .select("ai_system_instruction, ai_tone, business_name, services_text, hours_text, rules_text, bot_language, payment_methods_text, target_audience_text")
          .single();

        if (createError) {
          if (createError.code === "23505" || createError.message?.includes("unique constraint")) {
            const { data: existingTenant, error: fetchError } = await supabase
              .from("tenants")
              .select("ai_system_instruction, ai_tone, business_name, services_text, hours_text, rules_text, bot_language, payment_methods_text, target_audience_text")
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

        setBusinessName(name);
        setServicesText(services);
        setHoursText(hours);
        setPaymentMethodsText(payment);
        setTargetAudienceText(audience);
        setRulesText(rules);
        setBotLanguage(lang);
        setAiTone(tone);

        setOriginalData({
          businessName: name,
          servicesText: services,
          hoursText: hours,
          paymentMethodsText: payment,
          targetAudienceText: audience,
          rulesText: rules,
          botLanguage: lang,
          aiTone: tone,
        });
      }

      setIsLoading(false);
    }

    fetchConfig();
  }, []);

  // Track dirty changes
  useEffect(() => {
    setHasChanges(
      businessName !== originalData.businessName ||
      servicesText !== originalData.servicesText ||
      hoursText !== originalData.hoursText ||
      paymentMethodsText !== originalData.paymentMethodsText ||
      targetAudienceText !== originalData.targetAudienceText ||
      rulesText !== originalData.rulesText ||
      botLanguage !== originalData.botLanguage ||
      aiTone !== originalData.aiTone
    );
  }, [
    businessName, servicesText, hoursText, paymentMethodsText, targetAudienceText, rulesText, botLanguage, aiTone, originalData
  ]);

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
      { key: servicesText || "General services and business support", label: "servicesText", style: "bg-[var(--color-ai-bg)] text-[var(--color-ai-text)] border border-[var(--ai-border)] px-1.5 py-0.5 rounded font-mono font-bold mx-0.5 inline-block" },
      { key: hoursText || "Monday to Friday: 9:00 AM - 6:00 PM", label: "hoursText", style: "bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border border-[var(--warning-border)] px-1.5 py-0.5 rounded font-mono font-bold mx-0.5 inline-block" },
      { key: paymentMethodsText || "Cash, UPI, Cards", label: "paymentMethods", style: "bg-[var(--color-ai-bg)] text-[var(--color-ai)] border border-[var(--ai-border)] px-1.5 py-0.5 rounded font-mono font-bold mx-0.5 inline-block" },
      { key: targetAudienceText || "General segment", label: "targetAudience", style: "bg-[var(--color-info-bg)] text-[var(--color-info-text)] border border-[var(--info-border)] px-1.5 py-0.5 rounded font-mono font-bold mx-0.5 inline-block" },
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
              <span key={`${v.label}-${index}`} className={v.style} title={`Active Vector: ${v.label}`}>
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
    toastSuccess("Modifications discarded");
  }

  // Copy to Clipboard
  function handleCopyToClipboard() {
    navigator.clipboard.writeText(compiledPrompt);
    setIsCopied(true);
    toastSuccess("Compiled instructions copied!");
    setTimeout(() => setIsCopied(false), 2000);
  }

  const inputBaseClass = "w-full px-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] font-sans focus:outline-none focus:border-[var(--brand-primary)] focus:shadow-[var(--shadow-focus)] hover:border-[var(--border-strong)]";

  return (
    <div className="h-full overflow-y-auto bg-[var(--bg-canvas)] select-none relative flex flex-col">
      
      {/* ─── Scrollable Body Area ───────────────────────────────────── */}
      <div className="flex-1 p-6 overflow-y-auto pb-24">
        
        {/* Page Header (with language segmented switcher) */}
        <div className="max-w-[720px] mx-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--brand-subtle)] border border-[var(--brand-border)] text-[10px] font-mono font-bold tracking-wider text-[var(--brand-primary)] uppercase select-none self-start">
              {t.badge}
            </div>

            <div className="space-y-0.5">
              <h1 className="font-display text-2xl font-bold text-[var(--text-primary)] leading-tight">
                {t.title}
              </h1>
              <p className="font-sans text-xs text-[var(--text-secondary)] font-medium max-w-md">
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* 3-Option segmented language control */}
          <div className="flex bg-[var(--bg-subtle)] p-[3px] rounded-[var(--radius-md)] border border-[var(--border-subtle)] self-start sm:self-end shadow-[var(--shadow-sm)] gap-[2px] select-none">
            {(["en", "hi", "gu"] as const).map((lang) => {
              const labels = { en: "EN", hi: "हिंदी", gu: "ગુ" };
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setFormLanguage(lang)}
                  className={`px-3 py-1 text-xs font-semibold rounded-[var(--radius-sm)] cursor-pointer outline-none ${
                    formLanguage === lang
                      ? "bg-[var(--brand-primary)] text-white shadow-[var(--shadow-xs)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
                  }`}
                  style={{ transition: "background-color 150ms ease, color 150ms ease" }}
                >
                  {labels[lang]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Container Cards */}
        <div className="max-w-[720px] mx-auto space-y-4 select-none">
          
          {isLoading ? (
            <div className="bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-6 h-80 animate-shimmer" />
          ) : (
            <>
              
              {/* Section 1: Business Identity */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5 space-y-4 shadow-[var(--shadow-xs)]">
                <h2 className="text-[13px] font-semibold font-display text-[var(--text-primary)] uppercase tracking-[0.5px] pl-2.5 border-l-[3px] border-[var(--brand-primary)] mb-4">
                  {t.identityTitle}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Business Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" />
                      {t.businessName}
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder={t.businessNamePlaceholder}
                      className={`${inputBaseClass} h-10`}
                      style={{ transition: "border-color 150ms ease, box-shadow 150ms ease" }}
                    />
                    <p className="text-[10px] text-[var(--text-tertiary)] font-sans">
                      {t.businessNameHelper}
                    </p>
                  </div>

                  {/* Primary Bot Language */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      {t.botLanguage}
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-tertiary)] pointer-events-none" />
                      <select
                        value={botLanguage}
                        onChange={(e) => setBotLanguage(e.target.value)}
                        className={`${inputBaseClass} h-10 pl-10 pr-10 cursor-pointer appearance-none`}
                        style={{ transition: "border-color 150ms ease, box-shadow 150ms ease" }}
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
                    <p className="text-[10px] text-[var(--text-tertiary)] font-sans">
                      {t.botLanguageHelper}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 2: Core Information */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5 space-y-4 shadow-[var(--shadow-xs)]">
                <h2 className="text-[13px] font-semibold font-display text-[var(--text-primary)] uppercase tracking-[0.5px] pl-2.5 border-l-[3px] border-[var(--brand-primary)] mb-4">
                  {t.coreInfoTitle}
                </h2>

                <div className="space-y-4">
                  {/* Services & Pricing */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" />
                      {t.services}
                    </label>
                    <textarea
                      value={servicesText}
                      onChange={(e) => setServicesText(e.target.value)}
                      placeholder={t.servicesPlaceholder}
                      rows={3}
                      className={`${inputBaseClass} py-2 leading-relaxed resize-vertical`}
                      style={{ height: "80px", transition: "border-color 150ms ease, box-shadow 150ms ease" }}
                    />
                    <p className="text-[10px] text-[var(--text-tertiary)] font-sans">{t.servicesHelper}</p>
                  </div>

                  {/* Working Hours */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {t.hours}
                    </label>
                    <textarea
                      value={hoursText}
                      onChange={(e) => setHoursText(e.target.value)}
                      placeholder={t.hoursPlaceholder}
                      rows={3}
                      className={`${inputBaseClass} py-2 leading-relaxed resize-vertical`}
                      style={{ height: "80px", transition: "border-color 150ms ease, box-shadow 150ms ease" }}
                    />
                    <p className="text-[10px] text-[var(--text-tertiary)] font-sans">{t.hoursHelper}</p>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      {t.payments}
                    </label>
                    <textarea
                      value={paymentMethodsText}
                      onChange={(e) => setPaymentMethodsText(e.target.value)}
                      placeholder={t.paymentsPlaceholder}
                      rows={2}
                      className={`${inputBaseClass} py-2 leading-relaxed resize-vertical`}
                      style={{ height: "60px", transition: "border-color 150ms ease, box-shadow 150ms ease" }}
                    />
                    <p className="text-[10px] text-[var(--text-tertiary)] font-sans">{t.paymentsHelper}</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Brand Voice & Rules */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5 space-y-4 shadow-[var(--shadow-xs)]">
                <h2 className="text-[13px] font-semibold font-display text-[var(--text-primary)] uppercase tracking-[0.5px] pl-2.5 border-l-[3px] border-[var(--brand-primary)] mb-4">
                  {t.brandVoiceTitle}
                </h2>

                <div className="space-y-4">
                  {/* Target Audience */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      {t.targetAudience}
                    </label>
                    <textarea
                      value={targetAudienceText}
                      onChange={(e) => setTargetAudienceText(e.target.value)}
                      placeholder={t.targetAudiencePlaceholder}
                      rows={2}
                      className={`${inputBaseClass} py-2 leading-relaxed resize-vertical`}
                      style={{ height: "80px", transition: "border-color 150ms ease, box-shadow 150ms ease" }}
                    />
                    <p className="text-[10px] text-[var(--text-tertiary)] font-sans">{t.targetAudienceHelper}</p>
                  </div>

                  {/* Special Rules */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      {t.specialRules}
                    </label>
                    <textarea
                      value={rulesText}
                      onChange={(e) => setRulesText(e.target.value)}
                      placeholder={t.specialRulesPlaceholder}
                      rows={3}
                      className={`${inputBaseClass} py-2 leading-relaxed resize-vertical`}
                      style={{ height: "80px", transition: "border-color 150ms ease, box-shadow 150ms ease" }}
                    />
                    <p className="text-[10px] text-[var(--text-tertiary)] font-sans">{t.specialRulesHelper}</p>
                  </div>
                </div>
              </div>

              {/* Section 4: AI Tone Preset Grid */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5 space-y-4 shadow-[var(--shadow-xs)]">
                <h2 className="text-[13px] font-semibold font-display text-[var(--text-primary)] uppercase tracking-[0.5px] pl-2.5 border-l-[3px] border-[var(--brand-primary)] mb-4">
                  {t.aiToneTitle}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 select-none">
                  {TONE_OPTIONS.map((opt) => {
                    const isSelected = aiTone === opt.value;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAiTone(opt.value)}
                        className={`h-[105px] p-3 rounded-[var(--radius-lg)] border flex flex-col items-center justify-center text-center cursor-pointer select-none relative active:scale-[0.98] overflow-hidden ${
                          isSelected 
                            ? "border-[var(--brand-primary)] bg-[var(--brand-subtle)] shadow-[var(--shadow-sm)]" 
                            : "border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] hover:border-[var(--border-strong)]"
                        }`}
                        style={{ transition: "border-color 200ms ease, background-color 200ms ease, box-shadow 200ms ease, transform 100ms ease" }}
                      >
                        {/* Selected Checkmark Badge top-right */}
                        {isSelected && (
                          <span className="absolute top-2 right-2 w-[18px] h-[18px] rounded-full bg-[var(--brand-primary)] flex items-center justify-center shadow-md">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </span>
                        )}
                        
                        <motion.div
                          animate={{ 
                            scale: isSelected ? 1.15 : 1,
                            rotate: isSelected ? [0, 8, -8, 0] : 0
                          }}
                          transition={{ 
                            scale: { type: "spring", stiffness: 350, damping: 20 },
                            rotate: { duration: 0.4, ease: "easeInOut" }
                          }}
                        >
                          <Icon className={`w-[20px] h-[20px] mb-1.5 ${
                            isSelected ? "text-[var(--brand-primary)]" : "text-[var(--text-secondary)]"
                          }`} />
                        </motion.div>
                        
                        <span className={`text-[13px] font-display font-bold leading-none ${
                          isSelected ? "text-[var(--brand-text-strong)]" : "text-[var(--text-primary)]"
                        }`}>
                          {opt.label}
                        </span>
                        
                        <span className="text-[10px] text-[var(--text-secondary)] leading-tight mt-1 font-sans px-1 select-none pointer-events-none opacity-85">
                          {opt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 5: Compiled Preview (Collapsible) */}
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] shadow-[var(--shadow-xs)] overflow-hidden select-none">
                
                {/* Header click */}
                <div 
                  onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                  className="w-full px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-subtle)]"
                  style={{ transition: "background-color 150ms ease" }}
                >
                  <h2 className="text-[13px] font-semibold font-display text-[var(--text-primary)] uppercase tracking-[0.5px] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[var(--brand-primary)] pulse-dot-ai" />
                    {t.promptPreview}
                  </h2>
                  <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" 
                    style={{
                      transform: isPreviewExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 200ms ease"
                    }}
                  />
                </div>

                {/* Body drawer: Dynamic interactive terminal prompt compiler */}
                {isPreviewExpanded && (
                  <div className="overflow-hidden border-t border-[var(--border-subtle)] bg-[#070A13] p-0 relative select-text flex flex-col">
                    {/* Terminal Titlebar header */}
                    <div className="h-9 bg-[#0B0F19]/90 border-b border-[var(--border-subtle)] flex items-center justify-between px-4 select-none shrink-0">
                      <div className="flex items-center gap-1.5 select-none pointer-events-none">
                        <span className="w-2 h-2 rounded-full bg-[#EF4444]/60" />
                        <span className="w-2 h-2 rounded-full bg-[#F59E0B]/60" />
                        <span className="w-2 h-2 rounded-full bg-[#10B981]/60" />
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-tertiary)] uppercase tracking-widest opacity-80 pointer-events-none">
                        gemini-prompt-compiler.sh (live status: ready)
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyToClipboard}
                        className="h-6 px-2.5 bg-[#1E293B]/70 hover:bg-[#1E293B] border border-slate-700/50 rounded-[var(--radius-sm)] text-[10px] font-mono font-bold text-[var(--text-secondary)] hover:text-white flex items-center gap-1 cursor-pointer"
                        style={{ transition: "background-color 150ms ease, color 150ms ease" }}
                      >
                        {isCopied ? <Check className="w-3 h-3 text-[var(--success-icon)]" /> : <Copy className="w-3 h-3" />}
                        <span>{isCopied ? t.copied : t.copyBtn}</span>
                      </button>
                    </div>

                    {/* Prompt content with syntax highlighting */}
                    <div className="p-4 text-xs leading-[1.7] font-mono text-slate-300 overflow-y-auto max-h-[280px] whitespace-pre-wrap select-text">
                      {renderHighlightedPrompt(compiledPrompt)}
                    </div>
                  </div>
                )}
              </div>

            </>
          )}

        </div>
      </div>


      {/* Render Actions in Layout Header Portal */}
      {mounted && typeof document !== "undefined" && document.getElementById("header-cta-portal") ? (
        createPortal(
          <div className="flex items-center gap-2">
            {hasChanges && (
              <button
                onClick={handleDiscard}
                className="h-9 px-3 rounded-[var(--radius-md)] text-[13px] font-display font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] cursor-pointer outline-none transition-all duration-150"
              >
                {t.discard}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="h-9 px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] disabled:bg-[var(--bg-muted)] text-white disabled:text-[var(--text-tertiary)] rounded-[var(--radius-md)] text-[13px] font-display font-medium cursor-pointer outline-none flex items-center gap-1.5 active:scale-[0.97] disabled:cursor-not-allowed transition-all duration-150 shadow-[var(--shadow-sm)]"
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
