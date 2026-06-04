import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import Razorpay from "razorpay";

// Initialize Razorpay SDK
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dummy",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_secret",
});

const PLAN_MAPPING: Record<string, string> = {
  starter: process.env.RAZORPAY_PLAN_STARTER || "plan_starter_id",
  growth: process.env.RAZORPAY_PLAN_GROWTH || "plan_growth_id",
  domination: process.env.RAZORPAY_PLAN_DOMINATION || "plan_domination_id",
};

export async function POST(request: NextRequest) {
  try {
    const { planId } = await request.json();
    if (!planId || !PLAN_MAPPING[planId]) {
      return NextResponse.json({ error: "Invalid planId provided." }, { status: 400 });
    }

    // Resolve Supabase user session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized user session." }, { status: 401 });
    }

    // Fetch user's tenant
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, business_name, owner_email, razorpay_customer_id")
      .eq("owner_email", user.email)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
    }

    let customerId = tenant.razorpay_customer_id;

    // Create Razorpay Customer if it doesn't exist yet
    if (!customerId) {
      console.log(`Creating Razorpay Customer for business: ${tenant.business_name}`);
      try {
        const customer = await razorpay.customers.create({
          name: tenant.business_name,
          email: tenant.owner_email || user.email || "",
        });
        customerId = customer.id;

        // Save Customer ID in Supabase
        await supabase
          .from("tenants")
          .update({ razorpay_customer_id: customerId })
          .eq("id", tenant.id);
      } catch (err: any) {
        console.error("Error creating Razorpay Customer:", err);
        return NextResponse.json({ error: "Failed to create payment customer context." }, { status: 500 });
      }
    }

    // Create Subscription in Razorpay
    const razorpayPlanId = PLAN_MAPPING[planId];
    console.log(`Creating Razorpay Subscription for plan: ${planId} (${razorpayPlanId})`);

    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      total_count: 12,
      customer_notify: 1,
      notes: {
        tenant_id: tenant.id,
        subscription_tier: planId,
      },
    });

    return NextResponse.json(subscription, { status: 200 });
  } catch (error: any) {
    console.error("Subscription create error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
