import { NextRequest, NextResponse } from "next/server";

// ─── GET  /api/webhook/whatsapp ──────────────────────────────────────
// Meta sends a one-time verification handshake when you register the
// webhook URL.  We echo back `hub.challenge` only if the tokens match.
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
      // Respond with 200 OK and the RAW challenge token (Not JSON!)
      return new NextResponse(challenge, { status: 200 });
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return new NextResponse("Bad Request", { status: 400 });
}

// ─── POST  /api/webhook/whatsapp ─────────────────────────────────────
// Receives every incoming message / status update from Meta's Cloud API.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log the full payload for debugging during development
    console.log(
      "Incoming WhatsApp Webhook Payload:",
      JSON.stringify(body, null, 2)
    );

    // ── Safely extract core message fields ──────────────────────────
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;

    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (message && contact) {
      const phoneNumber = message.from; // e.g. "919876543210"
      const senderName = contact.profile?.name ?? "Unknown";
      const messageBody = message.text?.body ?? "";

      console.log(
        `📩 New message from ${senderName} (${phoneNumber}): "${messageBody}"`
      );
    }

    // Respond immediately so Meta doesn't retry
    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("❌ Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
