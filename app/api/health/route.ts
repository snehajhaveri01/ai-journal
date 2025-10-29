// app/api/health/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function GET() {
  try {
    const pingRef = adminDb.collection("__health").doc("ping");
    await pingRef.set({ at: new Date().toISOString() }, { merge: true });
    const snap = await pingRef.get();
    return NextResponse.json({ ok: true, data: snap.data() });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
