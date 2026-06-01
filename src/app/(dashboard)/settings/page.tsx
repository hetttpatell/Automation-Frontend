"use client";

import React, { useState, useEffect } from "react";
import { 
  Bot, 
  Save, 
  Loader2, 
  Sparkles, 
  MessageCircle, 
  CheckCircle2, 
  AlertCircle,
  Building,
  Clock,
  Globe,
  ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";

// ─── Tone Options ───────────────────────────────────────────────────
const TONE_OPTIONS = [
  { value: "Professional", label: "Professional" },
  { value: "Friendly", label: "Friendly" },
  { value: "Enthusiastic", label: "Enthusiastic" },
  { value: "Direct", label: "Direct" },
];

// ─── Translation Dictionary ─────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    badge: "AI BUSINESS PROFILE",
    title: "Business Profile",
    subtitle: "Configure details about your business. Our smart AI compiler automatically generates optimized prompts that guide your customer conversations.",
    cardTitle: "Business Details",
    cardSubtitle: "Help the bot understand your shop policies, pricing, and timing without editing code.",
    businessName: "Business Name",
    businessNamePlaceholder: "e.g., Serenity Spa",
    businessNameHelper: "Type the name of your shop or business.",
    botLanguage: "Primary Bot Language",
    botLanguageHelper: "Which language should the AI use to chat with customers?",
    langEnglish: "English",
    langHindi: "Hindi (हिंदी)",
    langHinglish: "Hinglish (Hindi + English)",
    langSpanish: "Spanish (Español)",
    langArabic: "Arabic (العربية)",
    langFrench: "French (Français)",
    langPortuguese: "Portuguese (Português)",
    coreServices: "Core Services & Pricing",
    coreServicesPlaceholder: "What do you sell and how much is it?\ne.g.,\n1. Haircut - $30\n2. Facial Treatment - $50\n3. Full Spa Massage - $80",
    coreServicesHelper: "List what you sell and how much it costs. Be clear!",
    workingHours: "Working Hours & Location",
    workingHoursPlaceholder: "Specify shop location and timing.\ne.g.,\nMonday to Saturday: 9:00 AM - 7:00 PM (Closed on Sundays)\nAddress: 123 Luxury Avenue, Pune",
    workingHoursHelper: "When are you open? Where is your shop?",
    paymentMethods: "Payment Methods",
    paymentMethodsPlaceholder: "Which payment methods do you accept? e.g., Cash, UPI, GPay, Credit/Debit cards",
    paymentMethodsHelper: "List payment methods accepted at your business.",
    targetAudience: "Target Audience & Tone",
    targetAudiencePlaceholder: "Describe your target audience and brand tone. e.g., High-end luxury clients, or Budget-friendly family shop",
    targetAudienceHelper: "Specify your ideal customer segment and the vibe of your business.",
    specialRules: "Special Rules & Policies",
    specialRulesPlaceholder: "Any rules? e.g., No refunds, appointment required, only cash accepted, etc.",
    specialRulesHelper: "Add rules like refund policies or booking requirements.",
    commTone: "Communication Tone",
    commToneSubtitle: "Select a preset persona configuration used during customer outreach threads.",
    professional: "Professional",
    professionalDesc: "Formal, clean business demeanor",
    friendly: "Friendly",
    friendlyDesc: "Warm, empathetic and energetic",
    enthusiastic: "Enthusiastic",
    enthusiasticDesc: "Highly dynamic, excited, sales-driven",
    direct: "Direct",
    directDesc: "Concise, precise, and objective",
    unsavedTitle: "Unsaved parameter modifications detected",
    unsavedSubtitle: "Modifications made to business details or conversation tones are not yet committed to live agent vectors.",
    discard: "Discard",
    save: "Deploy to Live Agent",
    saving: "Saving...",
    toastSuccess: "Configuration saved successfully"
  },
  hi: {
    badge: "एआई बिजनेस प्रोफाइल",
    title: "बिजनेस प्रोफाइल",
    subtitle: "अपने व्यवसाय के बारे में विवरण कॉन्फ़िगर करें। हमारा स्मार्ट एआई कंपाइलर स्वचालित रूप से अनुकूलित प्रॉम्प्ट जेनरेट करता है जो आपके ग्राहक बातचीत को निर्देशित करता है।",
    cardTitle: "व्यवसाय का विवरण",
    cardSubtitle: "बिना कोड एडिट किए बोट को अपनी दुकान की नीतियों, मूल्य निर्धारण और समय को समझने में मदद करें।",
    businessName: "व्यवसाय का नाम",
    businessNamePlaceholder: "उदा., सेरेनिटी स्पा",
    businessNameHelper: "अपने दुकान या व्यवसाय का नाम लिखें।",
    botLanguage: "मुख्य बोट भाषा",
    botLanguageHelper: "एआई को ग्राहकों से चैट करने के लिए किस भाषा का उपयोग करना चाहिए?",
    langEnglish: "अंग्रेजी (English)",
    langHindi: "हिंदी (Hindi)",
    langHinglish: "हिंग्लिश (Hindi + English)",
    langSpanish: "स्पैनिश (Español)",
    langArabic: "अरबी (العربية)",
    langFrench: "फ्रेंच (Français)",
    langPortuguese: "पुर्तगाली (Português)",
    coreServices: "मुख्य सेवाएं और मूल्य निर्धारण",
    coreServicesPlaceholder: "आप क्या बेचते हैं और उसकी कीमत क्या है?\nउदा.,\n1. हेयरकट - ₹300\n2. फेशियल ट्रीटमेंट - ₹500\n3. फुल स्पा मसाज - ₹800",
    coreServicesHelper: "सूचीबद्ध करें कि आप क्या बेचते हैं और उसकी कीमत क्या है। स्पष्ट रहें!",
    workingHours: "कार्य के घंटे और स्थान",
    workingHoursPlaceholder: "दुकान का स्थान और समय निर्दिष्ट करें।\nउदा.,\nसोमवार से शनिवार: सुबह 9:00 बजे - शाम 7:00 बजे (रविवार को बंद)\nपता: 123 लग्जरी एवेन्यू, पुणे",
    workingHoursHelper: "आप कब खुले रहते हैं? आपकी दुकान कहाँ है?",
    paymentMethods: "भुगतान के तरीके",
    paymentMethodsPlaceholder: "आप कौन से भुगतान के तरीके स्वीकार करते हैं? जैसे: नकद (Cash), यूपीआई (UPI), जीपे (GPay), क्रेडिट/डेबिट कार्ड",
    paymentMethodsHelper: "अपने व्यवसाय में स्वीकार किए जाने वाले भुगतान के तरीके सूचीबद्ध करें।",
    targetAudience: "लक्षित दर्शक और टोन",
    targetAudiencePlaceholder: "अपने लक्षित दर्शकों और ब्रांड वाइब का वर्णन करें। जैसे: हाई-एंड लक्ज़री ग्राहक, या बजट-अनुकूल पारिवारिक दुकान",
    targetAudienceHelper: "अपने आदर्श ग्राहक वर्ग और अपने व्यवसाय की शैली निर्दिष्ट करें।",
    specialRules: "विशेष नियम और नीतियां",
    specialRulesPlaceholder: "कोई नियम? उदा., कोई रिफंड नहीं, अपॉइंटमेंट आवश्यक, केवल नकद स्वीकार्य, आदि।",
    specialRulesHelper: "रिफंड नीतियों या बुकिंग आवश्यकताओं जैसे नियम जोड़ें।",
    commTone: "बातचीत का लहजा (टोन)",
    commToneSubtitle: "ग्राहक आउटरीच थ्रेड्स के दौरान उपयोग की जाने वाली पूर्व-निर्धारित व्यक्तित्व कॉन्फ़िगरेशन चुनें।",
    professional: "पेशेवर (Professional)",
    professionalDesc: "औपचारिक, स्वच्छ व्यावसायिक व्यवहार",
    friendly: "मित्रवत (Friendly)",
    friendlyDesc: "गर्मजोशी से भरा, सहानुभूतिपूर्ण और ऊर्जावान",
    enthusiastic: "उत्साही (Enthusiastic)",
    enthusiasticDesc: "अत्यधिक गतिशील, उत्साहित, बिक्री-उन्मुख",
    direct: "सीधा (Direct)",
    directDesc: "संक्षिप्त, सटीक और उद्देश्यपूर्ण",
    unsavedTitle: "असुरक्षित पैरामीटर संशोधन पाए गए",
    unsavedSubtitle: "व्यवसाय विवरण या बातचीत के लहजे में किए गए संशोधन अभी तक लाइव एजेंट वैक्टर के लिए प्रतिबद्ध नहीं हैं।",
    discard: "रद्द करें",
    save: "लाइव एजेंट पर तैनात करें",
    saving: "सहेज रहा है...",
    toastSuccess: "कॉन्फ़िगरेशन सफलतापूर्वक सहेजा गया"
  },
  gu: {
    badge: "એઆઈ બિઝનેસ પ્રોફાઇલ",
    title: "બિઝનેસ પ્રોફાઇલ",
    subtitle: "તમારા વ્યવસાય વિશેની વિગતો ગોઠવો. અમારું સ્માર્ટ એઆઈ કમ્પાઇલર આપમેળે ઑપ્ટિમાઇઝ કરેલા પ્રોમ્પ્ટ્સ જનરેટ કરે છે જે તમારા ગ્રાહકો સાથેની વાતચીતને માર્ગદર્શન આપે છે.",
    cardTitle: "વ્યવસાયની વિગતો",
    cardSubtitle: "કોડ સંપાદિત કર્યા વિના બૉટને તમારી દુકાનની નીતિઓ, ભાવો અને સમય સમજવામાં સહાય કરો.",
    businessName: "વ્યવસાયનું નામ",
    businessNamePlaceholder: "દા.ત., સેરેનિટી સ્પા",
    businessNameHelper: "તમારી દુકાન અથવા વ્યવસાયનું નામ લખો.",
    botLanguage: "મુખ્ય બૉટ ભાષા",
    botLanguageHelper: "એઆઈએ ગ્રાહકો સાથે વાતચીત કરવા માટે કઈ ભાષાનો ઉપયોગ કરવો જોઈએ?",
    langEnglish: "અંગ્રેજી (English)",
    langHindi: "હિન્દી (Hindi)",
    langHinglish: "હિંગ્લિશ (Hindi + English)",
    langSpanish: "સ્પેનિશ (Español)",
    langArabic: "અરબી (العربية)",
    langFrench: "ફ્રેન્ચ (Français)",
    langPortuguese: "પોર્ટુગીઝ (Português)",
    coreServices: "મુખ્ય સેવાઓ અને કિંમત",
    coreServicesPlaceholder: "તમે શું વેચો છો અને તેની કિંમત કેટલી છે?\nદા.ત.,\n1. હેરકટ - ₹૩૦૦\n2. ફેશિયલ ટ્રીટમેન્ટ - ₹૫૦૦\n3. ફુલ સ્પા મસાજ - ₹૮૦૦",
    coreServicesHelper: "તમે શું વેચો છો અને તેની કિંમત કેટલી છે તે સ્પષ્ટ કરો. સ્પષ્ટ રહો!",
    workingHours: "કામના કલાકો અને સ્થળ",
    workingHoursPlaceholder: "દુકાનનું સ્થળ અને સમય સ્પષ્ટ કરો.\nદા.ત.,\nસોમવારથી શનિવાર: સવારે ૯:૦૦ થી સાંજ ના ૭:૦૦ સુધી (રવિવારે બંધ)\nસરનામું: ૧૨૩ લક્ઝરી એવન્યુ, પુણે",
    workingHoursHelper: "તમે ક્યારે ખુલ્લા છો? તમારી દુકાન ક્યાં છે?",
    paymentMethods: "ચુકવણી પદ્ધતિઓ",
    paymentMethodsPlaceholder: "તમે કઈ ચુકવણી પદ્ધતિઓ સ્વીકારો છો? જેમ કે: રોકડ (Cash), યુપીઆઈ (UPI), જીપે (GPay), ક્રેડિટ/ડેબિટ કાર્ડ",
    paymentMethodsHelper: "તમારા વ્યવસાયમાં સ્વીકારવામાં આવતી ચુકવણી પદ્ધતિઓની સૂચિ બનાવો.",
    targetAudience: "લક્ષ્ય પ્રેક્ષકો અને ટોન",
    targetAudiencePlaceholder: "તમે તમારા લક્ષ્ય પ્રેક્ષકો અને બ્રાન્ડ વાઇબનું વર્ણન કરો. જેમ કે: હાઇ-એન્ડ લક્ઝરી ગ્રાહકો, અથવા બજેટ-અનુકૂળ કૌટુંબિક દુકાન",
    targetAudienceHelper: "તમારા આદર્શ ગ્રાહક વર્ગ અને તમારા વ્યવસાયની શૈલી સ્પષ્ટ કરો.",
    specialRules: "ખાસ નિયમો અને નીતિઓ",
    specialRulesPlaceholder: "કોઈ નિયમો? દા.ત., કોઈ રિફંડ નહીં, એપોઇન્ટમેન્ટ જરૂરી, ફક્ત રોકડ સ્વીકાર્ય, વગેરે.",
    specialRulesHelper: "રિફંડ નીતિઓ અથવા બુકિંગ આવશ્યકતાઓ જેવા નિયમો ઉમેરો.",
    commTone: "વાતચીતનો લહેજો (ટોન)",
    commToneSubtitle: "ગ્રાહક આઉટરીચ થ્રેડો દરમિયાન ઉપયોગમાં લેવાતા પ્રી-સેટ વ્યક્તિત્વ રૂપરેખાંકન પસંદ કરો.",
    professional: "વ્યાવસાયિક (Professional)",
    professionalDesc: "ઔપચારિક, સ્વચ્છ વ્યાવસાયિક વર્તન",
    friendly: "મૈત્રીપૂર્ણ (Friendly)",
    friendlyDesc: "હૂંફાળું, સહાનુભૂતિપૂર્ણ અને ઉર્જાવાન",
    enthusiastic: "અત્સાદી (Enthusiastic)",
    enthusiasticDesc: "અત્યંત ગતિશીલ, ઉત્સાહિત, વેચાણ-લક્ષી",
    direct: "સીધું (Direct)",
    directDesc: "ટૂંકું, સચોટ અને ઉદ્દેશ્યપૂર્ણ",
    unsavedTitle: "અસુરક્ષિત પરિમાણ ફેરફારો મળ્યા છે",
    unsavedSubtitle: "વ્યવસાયની વિગતો અથવા વાતચીતના ટોનમાં કરેલા ફેરફારો હજી સુધી લાઈવ એજન્ટ વેક્ટર માટે પ્રતિબદ્ધ નથી.",
    discard: "રદ કરો",
    save: "લાઈવ એજન્ટ પર તૈનાત કરો",
    saving: "સાચવી રહ્યું છે...",
    toastSuccess: "રૂપરેખાંકન સફળતાપૂર્વક સાચવવામાં આવ્યું છે"
  }
};

// ─── Skeleton Loader ────────────────────────────────────────────────
function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="bg-[#121214] rounded-2xl border border-[#27272A] p-8 h-80 animate-shimmer" />
      <div className="bg-[#121214] rounded-2xl border border-[#27272A] p-8 h-48 animate-shimmer" />
    </div>
  );
}

// ─── Toast Notification ─────────────────────────────────────────────
function SuccessToast({ show, onClose, message }: { show: boolean; onClose: () => void; message: string }) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3500);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-3 bg-[#1C1C1F] text-[#F4F4F5] pl-4 pr-5 py-3.5 rounded-xl shadow-2xl border border-[#27272A]"
        >
          <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0" />
          <span className="text-xs font-semibold font-sans">
            {message}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Component ─────────────────────────────────────────────────
export default function SettingsPage() {
  const supabase = createClient();
  
  // State for form fields
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

  // Loading and feedback states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Original states for dirty-checking
  const [originalBusinessName, setOriginalBusinessName] = useState("");
  const [originalServicesText, setOriginalServicesText] = useState("");
  const [originalHoursText, setOriginalHoursText] = useState("");
  const [originalPaymentMethodsText, setOriginalPaymentMethodsText] = useState("");
  const [originalTargetAudienceText, setOriginalTargetAudienceText] = useState("");
  const [originalRulesText, setOriginalRulesText] = useState("");
  const [originalBotLanguage, setOriginalBotLanguage] = useState("English");
  const [originalTone, setOriginalTone] = useState("Professional");

  const t = TRANSLATIONS[formLanguage];

  useEffect(() => {
    document.title = "Settings | LeadFlow";
  }, []);

  // Fetch tenant config on mount
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

      // Extract default business name from email as fallback
      const defaultBusinessName = user.email
        ? user.email.split("@")[0].charAt(0).toUpperCase() + user.email.split("@")[0].slice(1) + "'s Business"
        : "My Business";

      if (error && error.code === "PGRST116") {
        // Auto-create tenant config if not found
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
            // Retry fetch in case of concurrent creations
            const { data: existingTenant, error: fetchError } = await supabase
              .from("tenants")
              .select("ai_system_instruction, ai_tone, business_name, services_text, hours_text, rules_text, bot_language, payment_methods_text, target_audience_text")
              .eq("owner_email", user.email)
              .single();

            if (fetchError) {
              console.error("[Settings Tenant Auto-creation Retry Error]:", fetchError.message);
            } else {
              tenantConfig = existingTenant;
            }
          } else {
            console.error("[Settings Tenant Auto-creation Error]:", createError.message);
          }
        } else {
          tenantConfig = newTenant;
        }
      } else if (error) {
        console.error("[Fetch Config Error]:", error.message);
      }

      if (tenantConfig) {
        const tone = tenantConfig.ai_tone || "Professional";
        const bName = tenantConfig.business_name || defaultBusinessName;
        const services = tenantConfig.services_text || "";
        const hours = tenantConfig.hours_text || "";
        const payment = tenantConfig.payment_methods_text || "";
        const audience = tenantConfig.target_audience_text || "";
        const rules = tenantConfig.rules_text || "";
        const lang = tenantConfig.bot_language || "English";

        setBusinessName(bName);
        setServicesText(services);
        setHoursText(hours);
        setPaymentMethodsText(payment);
        setTargetAudienceText(audience);
        setRulesText(rules);
        setBotLanguage(lang);
        setAiTone(tone);

        setOriginalBusinessName(bName);
        setOriginalServicesText(services);
        setOriginalHoursText(hours);
        setOriginalPaymentMethodsText(payment);
        setOriginalTargetAudienceText(audience);
        setOriginalRulesText(rules);
        setOriginalBotLanguage(lang);
        setOriginalTone(tone);
      }

      setIsLoading(false);
    }

    fetchConfig();
  }, []);

  // Track dirty state
  useEffect(() => {
    setHasChanges(
      businessName !== originalBusinessName ||
      servicesText !== originalServicesText ||
      hoursText !== originalHoursText ||
      paymentMethodsText !== originalPaymentMethodsText ||
      targetAudienceText !== originalTargetAudienceText ||
      rulesText !== originalRulesText ||
      botLanguage !== originalBotLanguage ||
      aiTone !== originalTone
    );
  }, [
    businessName,
    servicesText,
    hoursText,
    paymentMethodsText,
    targetAudienceText,
    rulesText,
    botLanguage,
    aiTone,
    originalBusinessName,
    originalServicesText,
    originalHoursText,
    originalPaymentMethodsText,
    originalTargetAudienceText,
    originalRulesText,
    originalBotLanguage,
    originalTone
  ]);

  // Save handler
  async function handleSave() {
    setIsSaving(true);

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[Save Auth Error]:", authError?.message || "No user found");
      setIsSaving(false);
      return;
    }

    // Client-side Prompt Compiler Logic
    const compiledInstruction = `You are the LeadFlow AI Assistant, an elite, hyper-efficient sales representative for ${businessName}. 
You must communicate primarily in ${botLanguage}.
Our services are: ${servicesText}. 
Our hours are: ${hoursText}. 
We accept these payments: ${paymentMethodsText}.
Our target audience is: ${targetAudienceText}.
Follow these rules strictly: ${rulesText}.`;

    const { error } = await supabase
      .from("tenants")
      .update({
        ai_system_instruction: compiledInstruction,
        system_prompt: compiledInstruction, // Save compiled prompt to both columns
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

    if (error) {
      console.error("[Save Error]:", error.message);
      alert("Failed to save configuration. Please try again.");
    } else {
      setOriginalBusinessName(businessName);
      setOriginalServicesText(servicesText);
      setOriginalHoursText(hoursText);
      setOriginalPaymentMethodsText(paymentMethodsText);
      setOriginalTargetAudienceText(targetAudienceText);
      setOriginalRulesText(rulesText);
      setOriginalBotLanguage(botLanguage);
      setOriginalTone(aiTone);
      setHasChanges(false);
      setShowToast(true);
    }

    setIsSaving(false);
  }

  // Discard handler
  function handleDiscard() {
    setBusinessName(originalBusinessName);
    setServicesText(originalServicesText);
    setHoursText(originalHoursText);
    setPaymentMethodsText(originalPaymentMethodsText);
    setTargetAudienceText(originalTargetAudienceText);
    setRulesText(originalRulesText);
    setBotLanguage(originalBotLanguage);
    setAiTone(originalTone);
  }

  return (
    <>
      <div className="max-w-4xl mx-auto py-2 flex flex-col gap-8 pb-28 select-none">

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        >
          <div className="space-y-4">
            {/* Section Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6366F1]/10 border border-[#6366F1]/20 text-[10px] font-mono font-bold tracking-wider text-[#6366F1] uppercase select-none self-start">
              {t.badge}
            </div>

            <div className="space-y-2">
              <h1 className="font-calistoga text-4xl text-[#F4F4F5] leading-tight">
                {t.title}
              </h1>
              <p className="font-sans text-sm text-[#71717A] font-medium max-w-xl">
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* Dynamic Language Toggle */}
          <div className="flex bg-[#121214] p-1 rounded-xl border border-[#27272A] self-start md:self-end shadow-md">
            {(["en", "hi", "gu"] as const).map((lang) => {
              const labelMap = { en: "English", hi: "हिंदी", gu: "ગુજરાતી" };
              const isActive = formLanguage === lang;
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setFormLanguage(lang)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#6366F1] text-white shadow-sm"
                      : "text-[#71717A] hover:text-[#F4F4F5] hover:bg-white/[0.02]"
                  }`}
                >
                  {labelMap[lang]}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Content Panels */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <SettingsSkeleton />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-8"
            >

              {/* Card 1: Core Business Questionnaire */}
              <div className="bg-[#121214] rounded-2xl border border-[#27272A] p-8 shadow-xl hover:shadow-2xl transition-all duration-300 space-y-8">
                <div className="flex items-center gap-3 border-b border-[#27272A] pb-4">
                  <div className="w-9 h-9 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center">
                    <Sparkles className="w-4.5 h-4.5 text-[#6366F1]" />
                  </div>
                  <div>
                    <h2 className="font-calistoga text-base text-[#F4F4F5]">
                      {t.cardTitle}
                    </h2>
                    <p className="text-[11px] text-[#71717A] font-sans">
                      {t.cardSubtitle}
                    </p>
                  </div>
                </div>

                {/* Grid Container for Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                  {/* Input 1: Business Name */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-[#F4F4F5] font-sans">
                      {t.businessName}
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder={t.businessNamePlaceholder}
                      className="w-full px-4 py-3.5 bg-[#09090B] border border-[#27272A] rounded-xl text-xs text-[#F4F4F5] placeholder-[#71717A] font-sans transition-all duration-200 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] hover:border-[#71717A]/50"
                    />
                    <p className="text-sm text-[#A1A1AA] font-sans">
                      {t.businessNameHelper}
                    </p>
                  </div>

                  {/* Input 2: Bot Language */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-[#F4F4F5] font-sans">
                      {t.botLanguage}
                    </label>
                    <div className="relative">
                      <select
                        value={botLanguage}
                        onChange={(e) => setBotLanguage(e.target.value)}
                        className="w-full px-4 pr-10 py-3.5 bg-[#09090B] border border-[#27272A] rounded-xl text-xs text-[#F4F4F5] placeholder-[#71717A] font-sans transition-all duration-200 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] hover:border-[#71717A]/50 appearance-none cursor-pointer"
                      >
                        <option value="English">{t.langEnglish}</option>
                        <option value="Hindi">{t.langHindi}</option>
                        <option value="Hinglish">{t.langHinglish}</option>
                        <option value="Spanish">{t.langSpanish}</option>
                        <option value="Arabic">{t.langArabic}</option>
                        <option value="French">{t.langFrench}</option>
                        <option value="Portuguese">{t.langPortuguese}</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#71717A] pointer-events-none">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <p className="text-sm text-[#A1A1AA] font-sans">
                      {t.botLanguageHelper}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  {/* Input 3: Core Services & Pricing */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-[#F4F4F5] font-sans">
                      {t.coreServices}
                    </label>
                    <textarea
                      value={servicesText}
                      onChange={(e) => setServicesText(e.target.value)}
                      placeholder={t.coreServicesPlaceholder}
                      rows={4}
                      className="w-full px-4 py-3.5 bg-[#09090B] border border-[#27272A] rounded-xl text-xs text-[#F4F4F5] placeholder-[#71717A] font-sans leading-relaxed resize-none transition-all duration-200 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] hover:border-[#71717A]/50 min-h-[110px]"
                    />
                    <p className="text-sm text-[#A1A1AA] font-sans">
                      {t.coreServicesHelper}
                    </p>
                  </div>

                  {/* Input 4: Working Hours & Location */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-[#F4F4F5] font-sans">
                      {t.workingHours}
                    </label>
                    <textarea
                      value={hoursText}
                      onChange={(e) => setHoursText(e.target.value)}
                      placeholder={t.workingHoursPlaceholder}
                      rows={4}
                      className="w-full px-4 py-3.5 bg-[#09090B] border border-[#27272A] rounded-xl text-xs text-[#F4F4F5] placeholder-[#71717A] font-sans leading-relaxed resize-none transition-all duration-200 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] hover:border-[#71717A]/50 min-h-[110px]"
                    />
                    <p className="text-sm text-[#A1A1AA] font-sans">
                      {t.workingHoursHelper}
                    </p>
                  </div>

                  {/* Input 5: Payment Methods Accepted */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-[#F4F4F5] font-sans">
                      {t.paymentMethods}
                    </label>
                    <textarea
                      value={paymentMethodsText}
                      onChange={(e) => setPaymentMethodsText(e.target.value)}
                      placeholder={t.paymentMethodsPlaceholder}
                      rows={3}
                      className="w-full px-4 py-3.5 bg-[#09090B] border border-[#27272A] rounded-xl text-xs text-[#F4F4F5] placeholder-[#71717A] font-sans leading-relaxed resize-none transition-all duration-200 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] hover:border-[#71717A]/50 min-h-[90px]"
                    />
                    <p className="text-sm text-[#A1A1AA] font-sans">
                      {t.paymentMethodsHelper}
                    </p>
                  </div>

                  {/* Input 6: Target Audience / Brand Vibe */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-[#F4F4F5] font-sans">
                      {t.targetAudience}
                    </label>
                    <textarea
                      value={targetAudienceText}
                      onChange={(e) => setTargetAudienceText(e.target.value)}
                      placeholder={t.targetAudiencePlaceholder}
                      rows={3}
                      className="w-full px-4 py-3.5 bg-[#09090B] border border-[#27272A] rounded-xl text-xs text-[#F4F4F5] placeholder-[#71717A] font-sans leading-relaxed resize-none transition-all duration-200 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] hover:border-[#71717A]/50 min-h-[90px]"
                    />
                    <p className="text-sm text-[#A1A1AA] font-sans">
                      {t.targetAudienceHelper}
                    </p>
                  </div>

                  {/* Input 7: Special Rules & Policies */}
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-[#F4F4F5] font-sans">
                      {t.specialRules}
                    </label>
                    <textarea
                      value={rulesText}
                      onChange={(e) => setRulesText(e.target.value)}
                      placeholder={t.specialRulesPlaceholder}
                      rows={4}
                      className="w-full px-4 py-3.5 bg-[#09090B] border border-[#27272A] rounded-xl text-xs text-[#F4F4F5] placeholder-[#71717A] font-sans leading-relaxed resize-none transition-all duration-200 focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1] hover:border-[#71717A]/50 min-h-[110px]"
                    />
                    <p className="text-sm text-[#A1A1AA] font-sans">
                      {t.specialRulesHelper}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: AI Tone Selection */}
              <div className="bg-[#121214] rounded-2xl border border-[#27272A] p-8 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-1.5">
                  <div className="w-9 h-9 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 flex items-center justify-center">
                    <MessageCircle className="w-4.5 h-4.5 text-[#6366F1]" />
                  </div>
                  <div>
                    <h2 className="font-calistoga text-base text-[#F4F4F5]">
                      {t.commTone}
                    </h2>
                  </div>
                </div>
                <p className="text-[11px] text-[#71717A] font-sans mb-5 ml-12">
                  {t.commToneSubtitle}
                </p>

                {/* Tone Selection Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  {TONE_OPTIONS.map((option) => {
                    const isSelected = aiTone === option.value;
                    const toneKey = option.value.toLowerCase() as "professional" | "friendly" | "enthusiastic" | "direct";
                    const toneLabel = t[toneKey];
                    const toneDescription = t[`${toneKey}Desc` as const];

                    return (
                      <motion.button
                        key={option.value}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setAiTone(option.value)}
                        className={`relative flex flex-col items-center gap-1.5 px-4 py-4.5 rounded-xl border-2 transition-all duration-200 cursor-pointer select-none text-center ${
                          isSelected
                            ? "border-[#6366F1] bg-[#6366F1]/5 shadow-[0_0_12px_rgba(99,102,241,0.06)]"
                            : "border-[#27272A] bg-[#09090B] hover:border-[#71717A]/50 hover:bg-[#09090B]/80"
                        }`}
                      >
                        {/* Check circle indicator */}
                        {isSelected && (
                          <motion.div
                            layoutId="tone-indicator-settings"
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#6366F1] flex items-center justify-center shadow-md border border-[#09090B]"
                            transition={{ type: "spring", stiffness: 380, damping: 35 }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          </motion.div>
                        )}

                        <span className={`text-xs font-semibold font-sans transition-colors duration-200 ${
                          isSelected ? "text-[#6366F1]" : "text-[#F4F4F5]"
                        }`}>
                          {toneLabel}
                        </span>
                        <span className={`text-[9px] font-sans leading-relaxed transition-colors duration-200 ${
                          isSelected ? "text-white/60" : "text-[#71717A]"
                        }`}>
                          {toneDescription}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Unsaved Action Card Banner */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: "spring", stiffness: 220, damping: 28 }}
            className="fixed bottom-6 inset-x-0 md:left-72 md:right-8 z-40 flex items-center justify-center px-4"
          >
            <div className="bg-[#1C1C1F] border border-amber-500/20 shadow-2xl rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-3xl w-full">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#F4F4F5]">
                    ⚠️ {t.unsavedTitle}
                  </h3>
                  <p className="text-[10px] text-[#71717A] font-sans mt-0.5">
                    {t.unsavedSubtitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDiscard}
                  className="px-3.5 py-1.5 rounded-xl border border-[#27272A] text-[11px] text-[#71717A] hover:bg-white/[0.02] hover:text-[#F4F4F5] transition-colors duration-150 cursor-pointer"
                >
                  {t.discard}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3.5 py-1.5 rounded-xl text-[11px] font-semibold bg-[#6366F1] text-white hover:bg-[#4F46E5] transition-colors duration-150 cursor-pointer flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {t.saving}
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      {t.save}
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SuccessToast show={showToast} onClose={() => setShowToast(false)} message={t.toastSuccess} />
    </>
  );
}
