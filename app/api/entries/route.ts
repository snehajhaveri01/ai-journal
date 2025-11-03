import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { summarizeEntryAndDetectMood } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";

    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing Authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1].trim();
    if (!token) {
      return NextResponse.json({ error: "Empty token" }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);

    const { text } = await req.json();
    if (!text?.trim())
      return NextResponse.json({ error: "Text required" }, { status: 400 });

    // Use the improved OpenAI helper with mood score and topics
    const { summary, mood, moodScore, topics } =
      await summarizeEntryAndDetectMood(text);

    // Save entry with all AI analysis data
    const entriesCollection = adminDb.collection("entries");
    const docRef = await entriesCollection.add({
      uid: decoded.uid,
      text,
      summary,
      mood,
      moodLabel: mood,
      moodScore,
      topics,
      createdAt: new Date(),
    });

    return NextResponse.json({
      id: docRef.id,
      summary,
      mood,
      moodScore,
      topics,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create entry" },
      { status: 500 }
    );
  }
}
