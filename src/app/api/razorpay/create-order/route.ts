import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import Razorpay from "razorpay";

// Initialize Razorpay SDK
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dummy",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "dummy_secret",
});

const PACKS: Record<string, { amount: number; credits: number }> = {
  mini: { amount: 49900, credits: 500 }, // ₹499 = 49900 Paisa
  pro: { amount: 89900, credits: 1000 },  // ₹899 = 89900 Paisa
  mega: { amount: 199900, credits: 2500 }, // ₹1,999 = 199900 Paisa
};

export async function POST(request: NextRequest) {
  try {
    const { packId } = await request.json();
    if (!packId || !PACKS[packId]) {
      return NextResponse.json({ error: "Invalid packId provided." }, { status: 400 });
    }

    const pack = PACKS[packId];

    // Resolve Supabase user session
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized user session." }, { status: 401 });
    }

    // Fetch user's tenant
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id")
      .eq("owner_email", user.email)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json({ error: "Tenant not found." }, { status: 404 });
    }

    console.log(`Creating Razorpay Order for top-up pack: ${packId} (${pack.credits} credits)`);

    // Create Order in Razorpay
    const order = await razorpay.orders.create({
      amount: pack.amount,
      currency: "INR",
      notes: {
        tenant_id: tenant.id,
        purchase_type: "top_up",
        credit_amount: String(pack.credits),
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: pack.amount,
      credits: pack.credits,
    }, { status: 200 });
  } catch (error: any) {
    console.error("Order create error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
