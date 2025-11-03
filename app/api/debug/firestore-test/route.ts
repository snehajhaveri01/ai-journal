/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function GET() {
  try {
    // Try a simple write to Firestore to validate Admin SDK + API access
    const docRef = await adminDb.collection("debug").add({
      ok: true,
      ts: new Date().toISOString(),
      note: "diagnostic write from /api/debug/firestore-test",
    });

    return NextResponse.json({
      ok: true,
      msg: "Wrote debug document",
      id: docRef.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        message: err?.message ?? String(err),
        name: err?.name,
        stack: process.env.NODE_ENV === "development" ? err?.stack : undefined,
      },
      { status: 500 }
    );
  }
}
