import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

// ─── Types ──────────────────────────────────────────────────────────
interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: number;
}

// ─── Phone Number Sanitizer ─────────────────────────────────────────
// Strips +, spaces, dashes, parens to produce a clean E.164 numeric string
// that Meta's Graph API expects (e.g. "919876543210")
function sanitizePhone(phone: string): string {
  return phone.replace(/[\s\-\+\(\)]/g, "");
}

// ─── Meta Error Code Classifier ─────────────────────────────────────
// Parses the Meta API JSON response and extracts the error code + message.
function parseMetaError(responseData: any): {
  code: number;
  message: string;
  isSessionExpired: boolean;
} {
  const err = responseData?.error || {};
  const code = err.code || 0;
  const message = err.message || JSON.stringify(responseData);

  // Meta error codes that indicate a template is required:
  // 131047 — Re-engagement message (24h window expired)
  // 131026 — Message undeliverable (often session-related)
  // 131053 — Media/message outside session
  const sessionCodes = [131047, 131026, 131053];
  const isSessionExpired = sessionCodes.includes(code);

  return { code, message, isSessionExpired };
}

// ─── Meta WhatsApp Cloud API — Send Text Message ────────────────────
// Free-form text message. Only works within the 24-hour customer session window.
async function sendTextMessage(
  toPhone: string,
  messageText: string,
  phoneNumberId: string,
  activeToken: string
): Promise<SendResult> {
  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${activeToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: toPhone,
        type: "text",
        text: { preview_url: false, body: messageText },
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        messageId: data.messages?.[0]?.id || "unknown",
      };
    }

    const parsed = parseMetaError(data);
    return {
      success: false,
      error: parsed.message,
      errorCode: parsed.code,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Network error",
      errorCode: 0,
    };
  }
}

// ─── Meta WhatsApp Cloud API — Send Template Message ────────────────
// Uses a pre-approved template for outbound marketing/utility messages.
// Works outside the 24-hour session window (required for campaign blasts).
//
// Template setup in Meta Business Manager:
//   Name:     The value of WHATSAPP_CAMPAIGN_TEMPLATE_NAME (e.g. "campaign_blast")
//   Category: MARKETING or UTILITY
//   Body:     {{1}}
//   Language: The value of WHATSAPP_CAMPAIGN_TEMPLATE_LANG (e.g. "en")
//
// The single {{1}} parameter receives the full personalized message text.
async function sendTemplateMessage(
  toPhone: string,
  templateName: string,
  languageCode: string,
  bodyText: string,
  phoneNumberId: string,
  activeToken: string
): Promise<SendResult> {
  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${activeToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: toPhone,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components: [
            {
              type: "body",
              parameters: [{ type: "text", text: bodyText }],
            },
          ],
        },
      }),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        messageId: data.messages?.[0]?.id || "unknown",
      };
    }

    const parsed = parseMetaError(data);
    return {
      success: false,
      error: parsed.message,
      errorCode: parsed.code,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || "Network error",
      errorCode: 0,
    };
  }
}

// ─── Orchestrated Campaign Message Sender ───────────────────────────
// Strategy:
//   1. If a template is configured → use template mode (always works for outbound)
//   2. If no template → try text mode, and if it fails with a session-expired
//      error, return an actionable error guiding the user to set up a template.
async function sendCampaignMessage(
  toPhone: string,
  personalizedText: string,
  phoneNumberId: string,
  activeToken: string,
  templateName?: string,
  templateLang?: string
): Promise<SendResult> {
  const cleanPhone = sanitizePhone(toPhone);

  // ── Template mode (preferred for campaigns) ──
  if (templateName) {
    const lang = templateLang || "en";
    console.log(
      `[Campaign] 📨 Sending template "${templateName}" to ${cleanPhone}`
    );
    return sendTemplateMessage(
      cleanPhone,
      templateName,
      lang,
      personalizedText,
      phoneNumberId,
      activeToken
    );
  }

  // ── Text mode (fallback — only works within 24h session window) ──
  console.log(`[Campaign] 📨 Sending text message to ${cleanPhone}`);
  const textResult = await sendTextMessage(
    cleanPhone,
    personalizedText,
    phoneNumberId,
    activeToken
  );

  // If text failed due to session expiry, append actionable guidance
  if (!textResult.success) {
    const parsed = parseMetaError({ error: { code: textResult.errorCode, message: textResult.error } });
    if (parsed.isSessionExpired) {
      return {
        ...textResult,
        error: `Session expired (${textResult.errorCode}): This lead hasn't messaged in 24h. ` +
          `Set WHATSAPP_CAMPAIGN_TEMPLATE_NAME in .env.local to use template-based sending.`,
      };
    }
  }

  return textResult;
}

// ─── Small delay to stay within Meta throughput limits ───────────────
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════
// POST /api/campaigns/send
// ═══════════════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  let body: any;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON request body." },
      { status: 400 }
    );
  }

  try {
    // ── 1. Authenticate ──
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("[Campaign] Auth Error:", authError?.message || "No session");
      return NextResponse.json(
        { success: false, message: "Unauthorized — please log in again." },
        { status: 401 }
      );
    }

    const tenantId = user.id;

    // ── 2. Validate inputs ──
    const { campaign_name, custom_message_body, target_stage } = body;

    if (!campaign_name || !custom_message_body || !target_stage) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: campaign_name, custom_message_body, target_stage",
        },
        { status: 400 }
      );
    }

    // ── 4. Initialize Supabase Admin client (bypasses RLS) ──
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ── 5. Resolve tenant business_name and credentials ──
    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .select("business_name, whatsapp_phone_number_id, whatsapp_access_token")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenant) {
      console.error("[Campaign] Tenant lookup failed:", tenantError?.message);
      return NextResponse.json(
        {
          success: false,
          message: "Could not resolve your business profile. Please try again.",
        },
        { status: 500 }
      );
    }

    // ── 3. Validate Meta credentials (use tenant database values first, fallback to env) ──
    const phoneNumberId = tenant.whatsapp_phone_number_id || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const activeToken = tenant.whatsapp_access_token || process.env.WHATSAPP_ACCESS_TOKEN;

    if (!activeToken) {
      throw new Error("Campaign Failed: Business has no WhatsApp Access Token configured.");
    }

    if (!phoneNumberId) {
      console.error("[Campaign] Missing Meta API credentials.");
      return NextResponse.json(
        {
          success: false,
          message: "Server configuration error: WhatsApp API credentials not found.",
        },
        { status: 500 }
      );
    }

    // Template configuration: body parameter takes precedence.
    // If template_name is not provided in body, fall back to environment variable.
    const templateName = body.hasOwnProperty("template_name")
      ? (body.template_name || "")
      : (process.env.WHATSAPP_CAMPAIGN_TEMPLATE_NAME || "");
    const templateLang = body.hasOwnProperty("template_lang")
      ? (body.template_lang || "en")
      : (process.env.WHATSAPP_CAMPAIGN_TEMPLATE_LANG || "en");

    const businessName = tenant.business_name || "Our Business";

    // ── 6. Query all leads matching target_stage ──
    const { data: leads, error: leadsError } = await supabaseAdmin
      .from("leads")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("kanban_stage", target_stage);

    if (leadsError) {
      console.error("[Campaign] Leads query error:", leadsError.message);
      return NextResponse.json(
        {
          success: false,
          message: `Failed to fetch target leads: ${leadsError.message}`,
        },
        { status: 500 }
      );
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: `No leads found in the '${target_stage}' stage. Nothing to send.`,
        },
        { status: 400 }
      );
    }

    console.log(
      `\n┌─────────────────────────────────────────────────────────┐` +
      `\n│           📣 CAMPAIGN BLAST STARTING                    │` +
      `\n├─────────────────────────────────────────────────────────┤` +
      `\n│ Campaign:  ${campaign_name.substring(0, 42).padEnd(42)}│` +
      `\n│ Stage:     ${target_stage.padEnd(42)}│` +
      `\n│ Leads:     ${String(leads.length).padEnd(42)}│` +
      `\n│ Mode:      ${(templateName ? `Template [${templateName}]` : "Text (session)").padEnd(42)}│` +
      `\n└─────────────────────────────────────────────────────────┘`
    );

    // ── 7. Create campaign record ──
    const { data: campaign, error: campaignInsertError } = await supabaseAdmin
      .from("campaigns")
      .insert({
        tenant_id: tenantId,
        campaign_name,
        custom_message_body,
        target_stage,
        total_messages_sent: 0,
      })
      .select()
      .single();

    if (campaignInsertError || !campaign) {
      console.error("[Campaign] Insert error:", campaignInsertError?.message);
      return NextResponse.json(
        {
          success: false,
          message: `Database error creating campaign: ${campaignInsertError?.message}`,
        },
        { status: 500 }
      );
    }

    const campaignId = campaign.id;

    console.log(`[Campaign] 🔑 Using token source: ${tenant.whatsapp_access_token ? 'Database Tenant Record' : '.env Fallback Overrides'}`);

    // ── 8. BLAST LOOP ──
    let successCount = 0;
    const failures: { phone: string; name: string; reason: string }[] = [];

    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      const customerPhone = lead.customer_phone;
      const customerName = lead.customer_name || "Valued Customer";
      const leadIndex = `[${i + 1}/${leads.length}]`;

      // 8a. Variable placeholder substitution
      const personalizedMessage = custom_message_body
        .replace(/\{customer_name\}/g, customerName)
        .replace(/\{business_name\}/g, businessName);

      // 8b. Dispatch via Meta WhatsApp Cloud API
      const result = await sendCampaignMessage(
        customerPhone,
        personalizedMessage,
        phoneNumberId,
        activeToken,
        templateName || undefined,
        templateLang
      );

      if (result.success) {
        successCount++;
        console.log(
          `[Campaign] ${leadIndex} ✅ ${customerName} (${customerPhone}) — MID: ${result.messageId}`
        );

        // 8c. Resolve or create conversation for message trace
        let conversationId = lead.conversation_id;

        if (!conversationId) {
          const { data: existingConv } = await supabaseAdmin
            .from("conversations")
            .select("id")
            .eq("tenant_id", tenantId)
            .eq("customer_phone", customerPhone)
            .limit(1)
            .maybeSingle();

          if (existingConv) {
            conversationId = existingConv.id;
          } else {
            const { data: newConv, error: convErr } = await supabaseAdmin
              .from("conversations")
              .insert({
                tenant_id: tenantId,
                customer_phone: customerPhone,
                customer_name: customerName,
                is_ai_active: true,
              })
              .select("id")
              .single();

            if (!convErr && newConv) {
              conversationId = newConv.id;
            }
          }
        }

        // 8d. Insert message trace row so it shows in Inbox
        if (conversationId) {
          await supabaseAdmin.from("messages").insert({
            conversation_id: conversationId,
            tenant_id: tenantId,
            sender: "human",
            message_text: `[Campaign: ${campaign_name}] ${personalizedMessage}`,
          });

          // 8e. Bump conversation timestamp so it surfaces in Inbox
          await supabaseAdmin
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", conversationId);
        }
      } else {
        console.error(
          `[Campaign] ${leadIndex} ❌ ${customerName} (${customerPhone}) — ${result.error}`
        );
        failures.push({
          phone: customerPhone,
          name: customerName,
          reason: result.error || "Unknown error",
        });
      }

      // 8f. Throttle between sends (Meta allows ~80 msgs/sec standard tier)
      if (i < leads.length - 1) {
        await delay(100);
      }
    }

    // ── 9. Update campaign with actual sent count ──
    await supabaseAdmin
      .from("campaigns")
      .update({ total_messages_sent: successCount })
      .eq("id", campaignId);

    // ── 10. Build response ──
    const allSent = successCount === leads.length;
    const noneSent = successCount === 0;

    console.log(
      `[Campaign] 🏁 Blast finished — ${successCount}/${leads.length} delivered` +
      (failures.length > 0 ? ` | ${failures.length} failed` : "")
    );

    // Determine the overall success status based on delivery results
    // so the frontend can display the correct toast variant
    return NextResponse.json({
      success: !noneSent,
      message: allSent
        ? `🚀 Campaign sent to all ${successCount} recipients!`
        : noneSent
        ? `❌ Campaign failed — 0/${leads.length} messages delivered. ${failures[0]?.reason || "Check your WhatsApp API configuration."}`
        : `⚠️ Partial delivery: ${successCount}/${leads.length} sent, ${failures.length} failed.`,
      campaign_id: campaignId,
      total_targeted: leads.length,
      total_sent: successCount,
      total_failed: failures.length,
      ...(failures.length > 0 && {
        failed_details: failures.slice(0, 5),
      }),
    });
  } catch (err: any) {
    console.error("[Campaign] Unexpected Error:", err?.message, err?.stack);
    return NextResponse.json(
      {
        success: false,
        message: err?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
