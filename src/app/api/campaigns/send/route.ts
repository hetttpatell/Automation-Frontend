// ⛔ DELETED — This route has been moved to the Node.js backend at /api/campaigns/send
// This file can be safely deleted. The logic now lives in backend/src/controllers/campaign.controller.js
export async function POST() {
  return new Response(JSON.stringify({ error: "This endpoint has been moved to the dedicated backend server." }), { status: 410, headers: { "Content-Type": "application/json" } });
}
