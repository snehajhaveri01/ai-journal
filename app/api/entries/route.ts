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

    // Use the advanced AI analysis
    const analysis = await summarizeEntryAndDetectMood(text);

    // Save entry with comprehensive AI analysis data
    const entriesCollection = adminDb.collection("entries");
    const docRef = await entriesCollection.add({
      uid: decoded.uid,
      text,
      summary: analysis.summary,
      mood: analysis.mood,
      moodLabel: analysis.mood,
      moodScore: analysis.moodScore,
      topics: analysis.topics,

      // Advanced features
      emotions: analysis.emotions,
      categories: analysis.categories,
      entities: analysis.entities,
      sentiment: analysis.sentiment,

      createdAt: new Date(),
    });

    return NextResponse.json({
      id: docRef.id,
      ...analysis,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to create entry" },
      { status: 500 }
    );
  }
}
