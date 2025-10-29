import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic"; // ensure Node runtime

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;
const PAYPAL_WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID!; // the exact webhook id you created in PayPal

const PAYPAL_API_BASE =
  process.env.PAYPAL_LIVE === "true"
    ? "https://api.paypal.com"
    : "https://api.sandbox.paypal.com";

async function getPayPalAccessToken() {
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString(
          "base64"
        ),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }),
  });
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();

    // Gather PayPal verification headers
    const transmissionId = req.headers.get("paypal-transmission-id") ?? "";
    const transmissionTime = req.headers.get("paypal-transmission-time") ?? "";
    const certUrl = req.headers.get("paypal-cert-url") ?? "";
    const authAlgo = req.headers.get("paypal-auth-algo") ?? "";
    const transmissionSig = req.headers.get("paypal-transmission-sig") ?? "";

    // Verify signature with PayPal
    const accessToken = await getPayPalAccessToken();
    const verifyRes = await fetch(
      `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth_algo: authAlgo,
          cert_url: certUrl,
          transmission_id: transmissionId,
          transmission_sig: transmissionSig,
          transmission_time: transmissionTime,
          webhook_id: PAYPAL_WEBHOOK_ID,
          webhook_event: JSON.parse(raw),
        }),
      }
    );

    const verifyData = (await verifyRes.json()) as {
      verification_status?: string;
    };
    if (verifyData.verification_status !== "SUCCESS") {
      return NextResponse.json(
        { error: "verification_failed" },
        { status: 400 }
      );
    }

    const event = JSON.parse(raw) as {
      event_type: string;
      resource?: any;
    };

    // Expecting a subscription event. You must include the user's UID when creating
    // the subscription (e.g., as custom_id), so we can map subscription -> user.
    // We try common locations where a custom id might be stored:
    const customId =
      event?.resource?.custom_id ||
      event?.resource?.plan_id || // fallback if you tie plan_id to a single product
      event?.resource?.id ||
      null;

    // You should store a mapping when creating the subscription (sub_id -> uid).
    // For a simple MVP, store uid under resource.custom_id and pass Firebase UID from client.
    let uid = null as string | null;
    if (typeof customId === "string" && customId.startsWith("uid:")) {
      uid = customId.replace("uid:", "");
    }

    // Decide based on event type
    const type = event.event_type;
    const activateTypes = new Set([
      "BILLING.SUBSCRIPTION.ACTIVATED",
      "BILLING.SUBSCRIPTION.UPDATED",
      "PAYMENT.SALE.COMPLETED",
    ]);
    const cancelTypes = new Set([
      "BILLING.SUBSCRIPTION.CANCELLED",
      "BILLING.SUBSCRIPTION.SUSPENDED",
    ]);

    if (!uid) {
      // If we cannot resolve UID, no-op but acknowledge so PayPal stops retrying.
      return NextResponse.json({ ok: true, note: "no-uid-found" });
    }

    if (activateTypes.has(type)) {
      await adminDb
        .collection("users")
        .doc(uid)
        .set({ isPro: true }, { merge: true });
      return NextResponse.json({ ok: true, set: "pro" });
    }

    if (cancelTypes.has(type)) {
      await adminDb
        .collection("users")
        .doc(uid)
        .set({ isPro: false }, { merge: true });
      return NextResponse.json({ ok: true, set: "free" });
    }

    // Unknown event, just ack.
    return NextResponse.json({ ok: true, ignored: type });
  } catch (e: any) {
    console.error("paypal-webhook error", e);
    return NextResponse.json({ error: e.message ?? "error" }, { status: 500 });
  }
}
