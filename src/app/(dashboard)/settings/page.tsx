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
      // Get current Supabase session
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
      // Refresh config to sync credentials state (tokens, IDs)
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
      // Security: Only accept messages from the same origin
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
    // Open OAuth endpoint in a new tab to bypass iframe sandboxing limits
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
          <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-[1.5px] flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            {t.businessName}
          </label>
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
          <p className="text-[10px] text-[var(--text-tertiary)] font-sans leading-tight">
            {t.businessNameHelper}
          </p>
        </div>

        {/* Primary Bot Language Field */}
        <div className="space-y-2">
          <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-[1.5px] flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            {t.botLanguage}
          </label>
          <div className="relative">
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
          <p className="text-[10px] text-[var(--text-tertiary)] font-sans leading-tight">
            {t.botLanguageHelper}
          </p>
        </div>
      </div>

      {/* Tone Presets Selector */}
      <div className="space-y-4 pt-5 border-t border-[var(--border-subtle)]">
        <div>
          <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-[1.5px] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--brand-primary)] animate-pulse" />
            {t.aiToneTitle}
          </label>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">{t.aiToneSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 select-none">
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
                className={`p-4 rounded-[var(--radius-xl)] border flex flex-col items-center justify-center text-center cursor-pointer select-none relative overflow-hidden transition-all duration-200 min-h-[120px] ${
                  isSelected 
                    ? "border-[var(--brand-primary)] bg-[var(--brand-subtle)]/40 shadow-[var(--shadow-md)] ring-2 ring-[var(--brand-primary)]/20" 
                    : "border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)]"
                }`}
                style={{ transform: isSelected ? "scale(1.02)" : "scale(1)" }}
              >
                {/* Animated background glow for selected state */}
                {isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-[var(--brand-primary)]/5 to-transparent pointer-events-none" />
                )}

                {/* Selection Checkmark Badge */}
                {isSelected && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[var(--brand-primary)] flex items-center justify-center shadow-[var(--shadow-sm)]"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.span>
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
                  className={`p-2.5 rounded-xl mb-2.5 ${isSelected ? "bg-[var(--brand-subtle)] text-[var(--brand-primary)]" : "bg-[var(--bg-muted)] text-[var(--text-secondary)]"}`}
                >
                  <Icon className="w-5 h-5" />
                </motion.div>
                
                <span className={`text-xs font-bold tracking-tight ${
                  isSelected ? "text-[var(--brand-primary)]" : "text-[var(--text-primary)]"
                }`}>
                  {opt.label}
                </span>
                
                <span className="text-[10px] text-[var(--text-tertiary)] leading-tight mt-1.5 px-1 font-medium select-none pointer-events-none">
                  {opt.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderVectorsTab = () => (
    <div className="space-y-6">
      <div className="border-b border-[var(--border-subtle)] pb-4">
        <h2 className="text-sm font-bold font-display text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[var(--brand-primary)]" />
          {t.coreInfoTitle}
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">{t.coreInfoSubtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Services & Pricing Field */}
        <div className="glass-card rounded-[var(--radius-xl)] p-5 border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all duration-200 flex flex-col gap-2.5">
          <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-[1.5px] flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-indigo-500" />
            {t.services}
          </label>
          <textarea
            value={servicesText}
            onChange={(e) => {
              setServicesText(e.target.value);
              setHasChanges(true);
            }}
            placeholder={t.servicesPlaceholder}
            className={`${inputBaseClass} py-3 leading-relaxed min-h-[120px] resize-y`}
          />
          <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
            <span>{t.servicesHelper}</span>
            <span className="font-mono">{servicesText?.length || 0} chars</span>
          </div>
        </div>

        {/* Working Hours Field */}
        <div className="glass-card rounded-[var(--radius-xl)] p-5 border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all duration-200 flex flex-col gap-2.5">
          <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-[1.5px] flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-500" />
            {t.hours}
          </label>
          <textarea
            value={hoursText}
            onChange={(e) => {
              setHoursText(e.target.value);
              setHasChanges(true);
            }}
            placeholder={t.hoursPlaceholder}
            className={`${inputBaseClass} py-3 leading-relaxed min-h-[120px] resize-y`}
          />
          <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
            <span>{t.hoursHelper}</span>
            <span className="font-mono">{hoursText?.length || 0} chars</span>
          </div>
        </div>

        {/* Payment Methods Field */}
        <div className="glass-card rounded-[var(--radius-xl)] p-5 border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all duration-200 flex flex-col gap-2.5">
          <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-[1.5px] flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-purple-500" />
            {t.payments}
          </label>
          <textarea
            value={paymentMethodsText}
            onChange={(e) => {
              setPaymentMethodsText(e.target.value);
              setHasChanges(true);
            }}
            placeholder={t.paymentsPlaceholder}
            className={`${inputBaseClass} py-3 leading-relaxed min-h-[120px] resize-y`}
          />
          <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
            <span>{t.paymentsHelper}</span>
            <span className="font-mono">{paymentMethodsText?.length || 0} chars</span>
          </div>
        </div>

        {/* Target Audience Field */}
        <div className="glass-card rounded-[var(--radius-xl)] p-5 border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all duration-200 flex flex-col gap-2.5">
          <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-[1.5px] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-pink-500" />
            {t.targetAudience}
          </label>
          <textarea
            value={targetAudienceText}
            onChange={(e) => {
              setTargetAudienceText(e.target.value);
              setHasChanges(true);
            }}
            placeholder={t.targetAudiencePlaceholder}
            className={`${inputBaseClass} py-3 leading-relaxed min-h-[120px] resize-y`}
          />
          <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
            <span>{t.targetAudienceHelper}</span>
            <span className="font-mono">{targetAudienceText?.length || 0} chars</span>
          </div>
        </div>
      </div>

      {/* Special Rules & Policies Field */}
      <div className="glass-card rounded-[var(--radius-xl)] p-5 border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-all duration-200 flex flex-col gap-2.5 mt-5">
        <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-[1.5px] flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-rose-500 animate-pulse" />
          {t.specialRules}
        </label>
        <textarea
          value={rulesText}
          onChange={(e) => {
            setRulesText(e.target.value);
            setHasChanges(true);
          }}
          placeholder={t.specialRulesPlaceholder}
          className={`${inputBaseClass} py-3 leading-relaxed min-h-[120px] resize-y`}
        />
        <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
          <span>{t.specialRulesHelper}</span>
          <span className="font-mono">{rulesText?.length || 0} chars</span>
        </div>
      </div>
    </div>
  );

  const renderCompilerTab = () => (
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

      {/* Google Calendar Section */}
      <div className="p-5 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
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
          <p className="text-xs text-[var(--text-secondary)] max-w-xl leading-relaxed">
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
              className="h-10 px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-[var(--radius-lg)] text-xs font-semibold cursor-pointer outline-none transition-all duration-150 active:scale-[0.98] flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] shadow-[var(--shadow-sm)]"
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
            <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-[1.5px] flex items-center gap-1.5">
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

      {/* WhatsApp API Settings */}
      <div className="space-y-6 pt-6 mt-6 border-t border-[var(--border-subtle)]">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            WhatsApp API Settings
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
            Configure your Meta WhatsApp Business integration. We recommend using Manual API Configuration for local or customized environments.
          </p>
        </div>

        {/* Helper Link Guide */}
        <div className="p-5 sm:p-6 rounded-[var(--radius-xl)] bg-[var(--bg-canvas)] border border-[var(--brand-border)] border-l-4 border-l-[var(--brand-primary)] shadow-[var(--shadow-sm)] flex flex-col gap-5 relative overflow-hidden transition-all duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-[var(--brand-subtle)] border border-[var(--brand-border)] text-[var(--brand-primary)] shrink-0 self-start md:self-center">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
                  Meta Developer Configuration
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-xl">
                  To configure your live chatbot, retrieve your access token, Phone Number ID, and WhatsApp Business Account ID from Meta's dashboard.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowSetupGuide(!showSetupGuide)}
                className="h-9 px-3.5 bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] text-xs font-bold text-[var(--text-primary)] flex items-center gap-2 cursor-pointer transition-all duration-150 active:scale-[0.98] outline-none"
              >
                <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 ${showSetupGuide ? "rotate-180" : ""}`} />
                <span>{showSetupGuide ? "Hide Setup Guide" : "View Setup Guide"}</span>
              </button>
              <a 
                href="https://developers.facebook.com/apps/1586663712852403/use_cases/customize/wa-dev-console/?use_case_enum=WHATSAPP_BUSINESS_MESSAGING&selected_tab=wa-dev-console&product_route=whatsapp-business&business_id=1541013347588467" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="h-9 px-4 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded-[var(--radius-lg)] text-xs font-bold flex items-center gap-2 cursor-pointer transition-all duration-150 active:scale-[0.98] shadow-sm outline-none inline-flex items-center justify-center"
              >
                <span>Open Meta Console</span>
                <ExternalLink className="w-3.5 h-3.5 animate-pulse" />
              </a>
            </div>
          </div>
          
          <div className="pt-0">
            <AnimatePresence initial={false}>
              {showSetupGuide && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="relative pl-6 sm:pl-8 border-l border-dashed border-[var(--border-subtle)] ml-3 sm:ml-4 space-y-8 pt-6 pb-2">
                    
                    {/* Step 1 */}
                    <div className="relative space-y-3">
                      {/* Timeline Node Bullet */}
                      <div className="absolute -left-[35px] sm:-left-[43px] top-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--brand-primary)] text-white text-[10px] font-bold flex items-center justify-center border-4 border-[var(--bg-surface-raised)] shadow-sm">
                        1
                      </div>
                      <div className="space-y-1">
                        <h5 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                          Generate Your Meta Access Token
                        </h5>
                        <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] leading-relaxed max-w-xl">
                          Click the blue <strong>Generate access token</strong> button to create a temporary token for your development environment.
                        </p>
                      </div>
                      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 max-w-2xl shadow-[var(--shadow-md)] hover:scale-[1.01] transition-transform duration-200">
                        <img 
                          src="/setup/step1.png" 
                          alt="Step 1: Generate Access Token" 
                          className="w-full h-auto object-contain max-h-[300px] rounded-[var(--radius-md)] pointer-events-none select-none"
                        />
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="relative space-y-3">
                      {/* Timeline Node Bullet */}
                      <div className="absolute -left-[35px] sm:-left-[43px] top-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--brand-primary)] text-white text-[10px] font-bold flex items-center justify-center border-4 border-[var(--bg-surface-raised)] shadow-sm">
                        2
                      </div>
                      <div className="space-y-1">
                        <h5 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                          Copy the Phone Number ID
                        </h5>
                        <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] leading-relaxed max-w-xl">
                          Copy the <strong>Phone number ID</strong> (Example ID: <code className="font-mono bg-[var(--bg-subtle)] px-1 py-0.5 rounded border border-[var(--border-subtle)]">123456789012345</code>) by clicking the copy icon next to it. Paste this in the Phone Number ID input below.
                        </p>
                      </div>
                      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 max-w-2xl shadow-[var(--shadow-md)] hover:scale-[1.01] transition-transform duration-200">
                        <img 
                          src="/setup/step2.png" 
                          alt="Step 2: Copy Phone Number ID" 
                          className="w-full h-auto object-contain max-h-[300px] rounded-[var(--radius-md)] pointer-events-none select-none"
                        />
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="relative space-y-3">
                      {/* Timeline Node Bullet */}
                      <div className="absolute -left-[35px] sm:-left-[43px] top-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[var(--brand-primary)] text-white text-[10px] font-bold flex items-center justify-center border-4 border-[var(--bg-surface-raised)] shadow-sm">
                        3
                      </div>
                      <div className="space-y-1">
                        <h5 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                          Copy the WhatsApp Business Account ID
                        </h5>
                        <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] leading-relaxed max-w-xl">
                          Copy the <strong>WhatsApp Business Account ID</strong> (Example ID: <code className="font-mono bg-[var(--bg-subtle)] px-1 py-0.5 rounded border border-[var(--border-subtle)]">987654321098765</code>) using the copy icon. Paste this in the WABA ID input below.
                        </p>
                      </div>
                      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 max-w-2xl shadow-[var(--shadow-md)] hover:scale-[1.01] transition-transform duration-200">
                        <img 
                          src="/setup/step3.png" 
                          alt="Step 3: Copy WhatsApp Business Account ID" 
                          className="w-full h-auto object-contain max-h-[300px] rounded-[var(--radius-md)] pointer-events-none select-none"
                        />
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Connection Badge Status */}
        <div className="p-5 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-[1.5px] block">
              Integration Status
            </span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[var(--text-primary)]">WhatsApp Account Connection</span>
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
            <p className="text-xs text-[var(--text-secondary)] max-w-xl leading-relaxed">
              {whatsappPhoneNumberId && whatsappBusinessAccountId ? (
                <>
                  Active Phone Number ID: <code className="font-mono text-xs bg-[var(--bg-surface)] px-1 py-0.5 rounded border border-[var(--border-subtle)]">{whatsappPhoneNumberId}</code> and WABA ID: <code className="font-mono text-xs bg-[var(--bg-surface)] px-1 py-0.5 rounded border border-[var(--border-subtle)]">{whatsappBusinessAccountId}</code>.
                </>
              ) : (
                "Credentials not configured. Please fill in the Manual API Configuration below."
              )}
            </p>
          </div>
        </div>

        {/* Manual API Configuration Card */}
        <div className="p-5 sm:p-6 rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-4 shadow-[var(--shadow-sm)]">
          <div className="border-b border-[var(--border-subtle)] pb-2.5">
            <h4 className="text-xs font-bold font-display text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-[var(--brand-primary)]" />
              Manual API Credentials
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Enter your Meta Developer details manually. All fields are saved securely to your tenant configurations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone Number ID */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1">
                Phone Number ID
              </label>
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

            {/* WABA ID */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1">
                WhatsApp Business Account ID (WABA ID)
              </label>
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

          {/* Access Token */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1">
              Meta Permanent Access Token
            </label>
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
                aria-label={showToken ? "Hide token" : "Show token"}
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

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
  );

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
          <div className="flex bg-[var(--bg-surface-raised)] p-[4px] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] self-start md:self-center shadow-[var(--shadow-sm)] gap-[2px] select-none relative">
            {(["en", "hi", "gu"] as const).map((lang) => {
              const labels = { en: "EN", hi: "हिंदी", gu: "ગુ" };
              const isSelected = formLanguage === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setFormLanguage(lang)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] cursor-pointer outline-none transition-all duration-200 relative z-10 ${
                    isSelected
                      ? "text-white"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="active-lang-pill"
                      className="absolute inset-0 bg-[var(--brand-primary)] rounded-[var(--radius-md)] z-[-1]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
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
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-14 bg-[var(--bg-surface)] rounded-[var(--radius-lg)] border border-[var(--border-subtle)] animate-shimmer" />
                ))}
              </div>
              <div className="md:col-span-3 bg-[var(--bg-surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] p-6 h-96 animate-shimmer" />
            </div>
          ) : (
            <>
              {/* DESKTOP VIEW: Sidebar Layout */}
              <div className="hidden md:grid grid-cols-4 gap-6 items-start">
                
                {/* Categorized Desktop Sidebar */}
                <nav className="col-span-1 flex flex-col gap-5 select-none bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-4 shadow-[var(--shadow-sm)]">
                  
                  {/* Category 1: AI Agent Setup */}
                  <div className="space-y-2.5">
                    <span className="px-2.5 text-[10px] font-mono font-bold text-[var(--text-tertiary)] uppercase tracking-[1.5px] block">
                      AI Agent Setup
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {navTabs.filter(t => t.id !== "integrations").map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`text-left flex items-center gap-3 p-3 rounded-[var(--radius-xl)] border cursor-pointer select-none transition-all duration-200 relative whitespace-nowrap shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${
                              isActive
                                ? "bg-[var(--bg-surface)] border-[var(--border-subtle)] shadow-[var(--shadow-sm)] text-[var(--brand-primary)] font-bold"
                                : "bg-transparent border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]/50"
                            }`}
                          >
                            {/* Sliding active border or background */}
                            {isActive && (
                              <>
                                <motion.div
                                  layoutId="active-settings-tab-border-desktop"
                                  className="absolute left-1 top-3 bottom-3 w-1 bg-[var(--brand-primary)] rounded-full z-10"
                                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                                <motion.div
                                  layoutId="active-settings-tab-bg"
                                  className="absolute inset-0 bg-[var(--brand-subtle)]/30 rounded-[var(--radius-xl)] z-0 pointer-events-none"
                                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                              </>
                            )}

                            <div className={`p-2 rounded-lg relative z-10 ${isActive ? "bg-[var(--brand-subtle)] text-[var(--brand-primary)]" : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"}`}>
                              <Icon className="w-4 h-4 shrink-0" />
                              {tab.isAI && (
                                <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-[var(--color-ai)] border-2 border-[var(--bg-surface)] pulse-dot-ai" />
                              )}
                            </div>

                            <div className="flex flex-col text-left relative z-10 font-display">
                              <span className={`text-xs font-bold leading-tight ${isActive ? "text-[var(--brand-primary)]" : "text-[var(--text-primary)]"}`}>
                                {tab.label}
                              </span>
                              <span className="text-[10px] text-[var(--text-tertiary)] font-normal truncate max-w-[140px] mt-0.5">
                                {tab.desc}
                              </span>
                            </div>

                            {/* Unsaved changes indicator */}
                            {tab.hasChanges && (
                              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--color-warning)] shadow-[var(--shadow-sm)] animate-pulse z-20" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category 2: Connections */}
                  <div className="space-y-2.5 pt-4 border-t border-[var(--border-subtle)]">
                    <span className="px-2.5 text-[10px] font-mono font-bold text-[var(--text-tertiary)] uppercase tracking-[1.5px] block">
                      System Channels
                    </span>
                    <div className="flex flex-col gap-1.5">
                      {navTabs.filter(t => t.id === "integrations").map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`text-left flex items-center gap-3 p-3 rounded-[var(--radius-xl)] border cursor-pointer select-none transition-all duration-200 relative whitespace-nowrap shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] ${
                              isActive
                                ? "bg-[var(--bg-surface)] border-[var(--border-subtle)] shadow-[var(--shadow-sm)] text-[var(--brand-primary)] font-bold"
                                : "bg-transparent border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]/50"
                            }`}
                          >
                            {/* Sliding active border or background */}
                            {isActive && (
                              <>
                                <motion.div
                                  layoutId="active-settings-tab-border-desktop"
                                  className="absolute left-1 top-3 bottom-3 w-1 bg-[var(--brand-primary)] rounded-full z-10"
                                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                                <motion.div
                                  layoutId="active-settings-tab-bg"
                                  className="absolute inset-0 bg-[var(--brand-subtle)]/30 rounded-[var(--radius-xl)] z-0 pointer-events-none"
                                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                />
                              </>
                            )}

                            <div className={`p-2 rounded-lg relative z-10 ${isActive ? "bg-[var(--brand-subtle)] text-[var(--brand-primary)]" : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"}`}>
                              <Icon className="w-4 h-4 shrink-0" />
                            </div>

                            <div className="flex flex-col text-left relative z-10 font-display">
                              <span className={`text-xs font-bold leading-tight ${isActive ? "text-[var(--brand-primary)]" : "text-[var(--text-primary)]"}`}>
                                {tab.label}
                              </span>
                              <span className="text-[10px] text-[var(--text-tertiary)] font-normal truncate max-w-[140px] mt-0.5">
                                {tab.desc}
                              </span>
                            </div>

                            {/* Unsaved changes indicator */}
                            {tab.hasChanges && (
                              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[var(--color-warning)] shadow-[var(--shadow-sm)] animate-pulse z-20" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </nav>

                {/* Desktop Content Panel */}
                <div className="col-span-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-xl)] p-5 sm:p-6 shadow-[var(--shadow-sm)] min-h-[420px] relative overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.15, ease: "easeInOut" }}
                      className="h-full"
                    >
                      {activeTab === "profile" && renderProfileTab()}
                      {activeTab === "vectors" && renderVectorsTab()}
                      {activeTab === "compiler" && renderCompilerTab()}
                      {activeTab === "integrations" && renderIntegrationsTab()}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* MOBILE VIEW: Collapsible Accordion Stack */}
              <div className="flex flex-col gap-4 md:hidden">
                {navTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isExpanded = activeAccordion === tab.id;
                  return (
                    <div 
                      key={tab.id}
                      className={`rounded-[var(--radius-xl)] border transition-all duration-200 overflow-hidden ${
                        isExpanded 
                          ? "border-[var(--brand-primary)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)]" 
                          : "border-[var(--border-subtle)] bg-[var(--bg-surface)]/50 hover:bg-[var(--bg-surface)]"
                      }`}
                    >
                      {/* Accordion Header */}
                      <button
                        type="button"
                        onClick={() => setActiveAccordion(isExpanded ? null : tab.id as any)}
                        className="w-full flex items-center justify-between p-4 cursor-pointer text-left focus:outline-none select-none relative"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg ${isExpanded ? "bg-[var(--brand-subtle)] text-[var(--brand-primary)]" : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"}`}>
                            <Icon className="w-4 h-4 shrink-0" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-[var(--text-primary)] font-display leading-snug">
                              {tab.label}
                            </span>
                            <span className="text-[10px] text-[var(--text-secondary)] leading-tight mt-0.5 max-w-[200px] truncate">
                              {tab.desc}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Unsaved changes indicator */}
                          {tab.hasChanges && (
                            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-warning)] shadow-[var(--shadow-sm)] animate-pulse" />
                          )}
                          {tab.isAI && (
                            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-ai)] border-2 border-[var(--bg-surface)] pulse-dot-ai" />
                          )}
                          <ChevronDown className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                        </div>
                      </button>

                      {/* Accordion Content Panel */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className="border-t border-[var(--border-subtle)] overflow-hidden"
                          >
                            <div className="p-4 sm:p-5 bg-[var(--bg-surface)] select-none">
                              {tab.id === "profile" && renderProfileTab()}
                              {tab.id === "vectors" && renderVectorsTab()}
                              {tab.id === "compiler" && renderCompilerTab()}
                              {tab.id === "integrations" && renderIntegrationsTab()}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
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
                  <span>
                    <span className="hidden sm:inline">{t.saving}</span>
                    <span className="inline sm:hidden">
                      {formLanguage === "en" ? "Saving..." : formLanguage === "hi" ? "सहेजा जा रहा है..." : "સાચવી રહ્યું છે..."}
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    <span className="hidden sm:inline">{t.save}</span>
                    <span className="inline sm:hidden">
                      {formLanguage === "en" ? "Save" : formLanguage === "hi" ? "सहेजें" : "સાચવો"}
                    </span>
                  </span>
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
