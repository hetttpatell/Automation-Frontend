import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization session." }, { status: 401 });
    }

    const userToken = authHeader.split(" ")[1];

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wugxjvtddnaoosamwlmj.supabase.co";
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseServiceKey) {
      return NextResponse.json({ error: "Server missing Supabase service configuration." }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(userToken);
    if (authError || !user || !user.email) {
      return NextResponse.json({ error: "Unauthorized user session: " + (authError?.message || "Invalid token") }, { status: 401 });
    }

    const { data: tenant, error: tenantError } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("owner_email", user.email)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: "Tenant profile not found for this account." }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const code = body.token || body.code;
    const redirectUri = body.redirectUri || body.redirect_uri;

    if (!code) {
      return NextResponse.json({ error: "Missing authorization code from Meta login." }, { status: 400 });
    }

    let metaAppId = process.env.META_APP_ID || process.env.NEXT_PUBLIC_META_APP_ID;
    let metaAppSecret = process.env.META_APP_SECRET;

    // Secure fallback: If not in process.env (e.g. Vercel deployment without manual env setup),
    // fetch credentials securely from Supabase private config RPC.
    if (!metaAppId || !metaAppSecret) {
      try {
        const { data: creds, error: credsErr } = await supabaseAdmin.rpc("get_meta_credentials");
        if (!credsErr && creds) {
          if (!metaAppId && creds.app_id) metaAppId = creds.app_id;
          if (!metaAppSecret && creds.app_secret) metaAppSecret = creds.app_secret;
        }
      } catch (rpcErr) {
        console.warn("[Meta API Route] RPC fallback error:", rpcErr);
      }
    }

    if (!metaAppId || !metaAppSecret) {
      console.error("[Meta API Route] Missing META_APP_ID or META_APP_SECRET environment variable.");
      return NextResponse.json({
        error: "Server configuration error: META_APP_ID or META_APP_SECRET environment variable is missing."
      }, { status: 500 });
    }

    // Exchange temporary OAuth code for access token
    let tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${metaAppId}&client_secret=${metaAppSecret}&code=${code}`;
    if (redirectUri) {
      tokenUrl += `&redirect_uri=${encodeURIComponent(redirectUri)}`;
    }

    console.log("[Meta API Route] Exchanging code with Meta for redirectUri:", redirectUri);
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("[Meta API Route] Code exchange error:", tokenData);
      return NextResponse.json({
        error: tokenData?.error?.message || "Failed to exchange authorization code with Meta Graph API.",
      }, { status: 400 });
    }

    const initialToken = tokenData.access_token;
    let accessToken = initialToken;

    // Exchange short-lived token for long-lived (60 days) access token
    try {
      const llUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${metaAppId}&client_secret=${metaAppSecret}&fb_exchange_token=${initialToken}`;
      const llRes = await fetch(llUrl);
      if (llRes.ok) {
        const llData = await llRes.json();
        if (llData?.access_token) {
          accessToken = llData.access_token;
          console.log("[Meta API Route] Successfully upgraded to Long-Lived Meta Access Token!");
        }
      }
    } catch (llErr) {
      console.warn("[Meta API Route] Long-lived token exchange warning:", llErr);
    }

    let wabaId: string | null = null;

    // 1. Attempt /me/whatsapp_business_accounts
    try {
      const ownedRes = await fetch(`https://graph.facebook.com/v19.0/me/whatsapp_business_accounts?access_token=${accessToken}`);
      if (ownedRes.ok) {
        const ownedData = await ownedRes.json();
        if (ownedData?.data?.length > 0) {
          wabaId = ownedData.data[0].id;
          console.log(`[Meta API Route] Found owned WABA ID: ${wabaId}`);
        }
      }
    } catch (e) {
      console.warn("[Meta API Route] /me/whatsapp_business_accounts check warning:", e);
    }

    // 2. Attempt Business Manager accounts: /me/businesses -> /{business.id}/whatsapp_business_accounts
    if (!wabaId) {
      try {
        const bizRes = await fetch(`https://graph.facebook.com/v19.0/me/businesses?access_token=${accessToken}`);
        if (bizRes.ok) {
          const bizData = await bizRes.json();
          for (const biz of (bizData?.data || [])) {
            const bizWabaRes = await fetch(`https://graph.facebook.com/v19.0/${biz.id}/whatsapp_business_accounts?access_token=${accessToken}`);
            if (bizWabaRes.ok) {
              const bizWabaData = await bizWabaRes.json();
              if (bizWabaData?.data?.length > 0) {
                wabaId = bizWabaData.data[0].id;
                console.log(`[Meta API Route] Found WABA ID under Business Manager ${biz.id}: ${wabaId}`);
                break;
              }
            }
          }
        }
      } catch (e) {
        console.warn("[Meta API Route] /me/businesses check warning:", e);
      }
    }

    // 3. Attempt /me/client_whatsapp_business_accounts
    if (!wabaId) {
      try {
        const clientRes = await fetch(`https://graph.facebook.com/v19.0/me/client_whatsapp_business_accounts?access_token=${accessToken}`);
        if (clientRes.ok) {
          const clientData = await clientRes.json();
          if (clientData?.data?.length > 0) {
            wabaId = clientData.data[0].id;
            console.log(`[Meta API Route] Found client shared WABA ID: ${wabaId}`);
          }
        }
      } catch (e) {
        console.warn("[Meta API Route] /me/client_whatsapp_business_accounts check warning:", e);
      }
    }

    // 4. Fallback: debug_token granular scopes inspection
    if (!wabaId) {
      try {
        const appAccessToken = `${metaAppId}|${metaAppSecret}`;
        const debugRes = await fetch(`https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appAccessToken}`);
        if (debugRes.ok) {
          const debugData = await debugRes.json();
          const scopes = debugData?.data?.granular_scopes || [];
          const waScope = scopes.find((s: any) => s.scope === "whatsapp_business_management") ||
                          scopes.find((s: any) => s.scope === "whatsapp_business_messaging") ||
                          scopes.find((s: any) => s.target_ids?.length > 0);
          if (waScope?.target_ids?.length > 0) {
            wabaId = waScope.target_ids[0];
            console.log(`[Meta API Route] Found WABA ID in debug_token granular scopes: ${wabaId}`);
          }
        }
      } catch (e) {
        console.warn("[Meta API Route] debug_token fallback warning:", e);
      }
    }

    if (!wabaId) {
      return NextResponse.json({
        error: "Could not resolve WhatsApp Business Account (WABA) ID from your Meta login. Please ensure you selected a WhatsApp Business Account during setup.",
      }, { status: 400 });
    }

    // Fetch Phone Number ID for this WABA
    let phoneId: string | null = null;
    try {
      const phoneRes = await fetch(`https://graph.facebook.com/v19.0/${wabaId}/phone_numbers`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (phoneRes.ok) {
        const phoneData = await phoneRes.json();
        if (phoneData?.data?.length > 0) {
          phoneId = phoneData.data[0].id;
          console.log(`[Meta API Route] Selected Phone Number ID: ${phoneId}`);
        }
      }
    } catch (e) {
      console.error("[Meta API Route] Phone numbers fetch error:", e);
    }

    if (!phoneId) {
      return NextResponse.json({
        error: "No active WhatsApp phone numbers found in the selected WhatsApp Business Account.",
      }, { status: 400 });
    }

    // Update Supabase tenant profile with credentials
    const { error: updateError } = await supabaseAdmin
      .from("tenants")
      .update({
        whatsapp_access_token: accessToken,
        whatsapp_phone_number_id: phoneId,
        waba_id: wabaId,
        whatsapp_business_account_id: wabaId,
      })
      .eq("id", tenant.id);

    if (updateError) {
      console.error("[Meta API Route] Supabase update error:", updateError);
      return NextResponse.json({ error: "Failed to persist credentials into database." }, { status: 500 });
    }

    console.log(`[Meta API Route] Successfully connected tenant ${tenant.id}: WABA ${wabaId}, Phone ${phoneId}`);

    return NextResponse.json({
      success: true,
      message: "WhatsApp Business Account connected successfully.",
      data: {
        wabaId,
        phoneNumberId: phoneId,
      },
    });
  } catch (err: any) {
    console.error("[Meta API Route Exception]:", err);
    return NextResponse.json({
      error: err.message || "An unexpected error occurred during Meta token exchange.",
    }, { status: 500 });
  }
}
