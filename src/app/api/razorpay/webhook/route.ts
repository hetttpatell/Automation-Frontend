import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseServiceRole) {
    console.error("[Razorpay Webhook Error] Supabase credentials missing during execution.");
    return NextResponse.json({ error: "Supabase URL and Service Role Key are required" }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRole);

  const signature = request.headers.get("x-razorpay-signature") || "";
  const rawBody = await request.text();
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "";

  // Signature verification validation
  try {
    if (!signature) {
      console.error("[Razorpay Webhook] Missing x-razorpay-signature header.");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    const isValid = signature === expectedSignature;

    if (!isValid) {
      console.error("[Razorpay Webhook] Signature verification failed.");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    console.log(`[Razorpay Webhook] Signature valid. Processing event: ${event}`);

    if (event === "subscription.charged") {
      const subscription = payload.payload.subscription.entity;
      const notes = subscription.notes || {};
      const tenantId = notes.tenant_id;
      const notesTier = notes.subscription_tier || "";

      if (!tenantId) {
        console.error("[Razorpay Webhook] tenant_id missing from subscription notes.");
        return NextResponse.json({ error: "Missing tenant_id in notes" }, { status: 400 });
      }

      // Map tier to credits balance and limit allocations
      let tier = "free";
      let baseCredits = 50;

      if (notesTier === "starter") {
        tier = "starter";
        baseCredits = 500;
      } else if (notesTier === "growth") {
        tier = "growth";
        baseCredits = 2500;
      } else if (notesTier === "domination") {
        tier = "domination";
        baseCredits = 10000;
      } else {
        // Fallback mapping based on Razorpay plan ID in case subscription_tier notes are blank
        const planId = subscription.plan_id;
        if (planId?.includes("starter")) {
          tier = "starter";
          baseCredits = 500;
        } else if (planId?.includes("growth")) {
          tier = "growth";
          baseCredits = 2500;
        } else if (planId?.includes("domination")) {
          tier = "domination";
          baseCredits = 10000;
        }
      }

      console.log(`[Razorpay Webhook] Refilling credits for tenant: ${tenantId}. Tier: ${tier}, Credits: ${baseCredits}`);

      // Atomically update subscription statuses and credit allocations in Supabase
      const { error: updateError } = await supabase
        .from("tenants")
        .update({
          subscription_tier: tier,
          subscription_status: "active",
          ai_credits_balance: baseCredits,
          ai_credits_limit: baseCredits,
          razorpay_subscription_id: subscription.id,
        })
        .eq("id", tenantId);

      if (updateError) {
        console.error(`[Razorpay Webhook] Supabase update failed:`, updateError.message);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }
    } 
    else if (event === "order.paid" || event === "payment.captured") {
      let entity = null;
      if (event === "order.paid") {
        entity = payload.payload.order.entity;
      } else {
        entity = payload.payload.payment.entity;
      }

      if (!entity) {
        return NextResponse.json({ error: "Missing entity payload" }, { status: 400 });
      }

      const notes = entity.notes || {};
      const tenantId = notes.tenant_id;
      const purchaseType = notes.purchase_type;
      const creditAmount = parseInt(notes.credit_amount || "0", 10);

      if (purchaseType === "top_up" && tenantId && creditAmount > 0) {
        console.log(`[Razorpay Webhook] Incrementing credits for tenant ${tenantId} by ${creditAmount}`);
        
        // Execute atomic increment in PostgreSQL
        const { data: newBalance, error: rpcError } = await supabase.rpc("increment_tenant_credits", {
          tenant_id: tenantId,
          amount: creditAmount,
        });

        if (rpcError) {
          console.error("[Razorpay Webhook] RPC credits increment failed. Attempting fallback direct update.", rpcError.message);
          
          // Fallback direct mathematical increment
          const { data: tenant } = await supabase
            .from("tenants")
            .select("ai_credits_balance, ai_credits_limit")
            .eq("id", tenantId)
            .single();

          if (tenant) {
            const currentBalance = tenant.ai_credits_balance || 0;
            const currentLimit = tenant.ai_credits_limit || 0;
            await supabase
              .from("tenants")
              .update({
                ai_credits_balance: currentBalance + creditAmount,
                ai_credits_limit: currentLimit + creditAmount,
              })
              .eq("id", tenantId);
          }
        } else {
          console.log(`[Razorpay Webhook] Atomic increment completed successfully. New balance: ${newBalance}`);
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("[Razorpay Webhook Error]:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
