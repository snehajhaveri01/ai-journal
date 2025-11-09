import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { generateSmartPrompt } from "@/lib/openai";

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

    // Get user's recent entries (last 5)
    const entriesRef = adminDb
      .collection("entries")
      .where("uid", "==", decoded.uid)
      .orderBy("createdAt", "desc")
      .limit(5);

    const snapshot = await entriesRef.get();

    const recentEntries = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        text: data.text || "",
        mood: data.mood || "neutral",
        topics: data.topics || [],
      };
    });

    // Calculate days since last entry
    let daysSinceLastEntry = 0;
    if (snapshot.docs.length > 0) {
      const lastEntry = snapshot.docs[0].data();
      const lastEntryDate = lastEntry.createdAt?.toDate() || new Date();
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - lastEntryDate.getTime());
      daysSinceLastEntry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Generate smart prompt
    const prompt = await generateSmartPrompt(recentEntries, daysSinceLastEntry);

    return NextResponse.json({ prompt });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to generate prompt" },
      { status: 500 }
    );
  }
}
