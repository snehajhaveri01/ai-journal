import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { analyzePatterns } from "@/lib/openai";

export async function GET(req: NextRequest) {
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

    // Get entries from last 60 days
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const snapshot = await adminDb
      .collection("entries")
      .where("uid", "==", decoded.uid)
      .where("createdAt", ">=", sixtyDaysAgo)
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const entries = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        text: data.text || "",
        mood: data.mood || "neutral",
        moodScore: data.moodScore || 50,
        topics: data.topics || [],
        categories: data.categories || [],
        emotions: data.emotions || {},
        createdAt: data.createdAt?.toDate() || new Date(),
      };
    });

    if (entries.length < 5) {
      return NextResponse.json({
        insights: [],
        message: "Not enough entries to detect patterns. Write at least 5 entries!",
      });
    }

    // Analyze patterns with AI
    const insights = await analyzePatterns(entries);

    return NextResponse.json({ insights });
  } catch (err: any) {
    console.error("Insights error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate insights" },
      { status: 500 }
    );
  }
}
