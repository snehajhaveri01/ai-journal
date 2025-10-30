/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/entries/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { summarizeEntryAndDetectMood } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    // ---- Auth: Bearer <ID_TOKEN> from Firebase client ----
    const auth = req.headers.get("authorization") || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    if (!m) {
      return NextResponse.json(
        { error: "Missing Authorization Bearer token" },
        { status: 401 }
      );
    }

    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(m[1]);
    } catch (e: any) {
      return NextResponse.json(
        {
          error:
            "Decoding Firebase ID token failed. Pass the full JWT from Firebase Auth. " +
            "See https://firebase.google.com/docs/auth/admin/verify-id-tokens",
          details: e?.message ?? String(e),
        },
        { status: 401 }
      );
    }

    // ---- body ----
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Missing 'text' string" },
        { status: 400 }
      );
    }

    // ---- AI summary + mood ----
    const { summary, mood } = await summarizeEntryAndDetectMood(text);

    // ---- Store in Firestore ----
    const uid = decoded.uid;
    const docRef = await adminDb
      .collection("users")
      .doc(uid)
      .collection("entries")
      .add({
        text,
        summary,
        mood,
        createdAt: Date.now(),
      });

    return NextResponse.json({ id: docRef.id, summary, mood }, { status: 200 });
  } catch (err: any) {
    // always JSON (prevents "Unexpected token <" on client)
    return NextResponse.json(
      { error: "Internal error", details: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
