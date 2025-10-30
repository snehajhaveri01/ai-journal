/* eslint-disable @typescript-eslint/no-explicit-any */
// app/api/entries/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    console.log("🔐 Auth header:", authHeader.slice(0, 40) + "...");

    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing Authorization: Bearer <idToken>" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    console.log("✅ Firebase user verified:", decoded.uid);

    const { text } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const prompt = `Summarize this journal entry in 1-2 sentences and guess a mood (one word):\n\n${text}`;
    const ai = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    });

    const summary = ai.choices[0].message?.content?.trim() || "";
    const mood =
      /mood:\s*([a-z]+)/i.exec(summary)?.[1]?.toLowerCase() || "neutral";

    const docRef = await adminDb.collection("entries").add({
      uid: decoded.uid,
      text,
      summary,
      mood,
      createdAt: new Date(),
    });

    return NextResponse.json({ id: docRef.id, summary, mood });
  } catch (err: any) {
    console.error("❌ API error:", err);
    return NextResponse.json(
      { error: err.message || "Unauthorized" },
      { status: 401 }
    );
  }
}
