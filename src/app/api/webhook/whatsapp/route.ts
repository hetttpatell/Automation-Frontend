// ⛔ DELETED — This route has been moved to the Node.js backend at /webhook/whatsapp
// This file can be safely deleted. The logic now lives in backend/src/controllers/webhook.controller.js
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "This endpoint has been moved to the dedicated backend server." }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ error: "This endpoint has been moved to the dedicated backend server." }, { status: 410 });
}
