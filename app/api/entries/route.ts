import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { openai } from "@/lib/openai";

export async function POST(req: NextRequest) {
  try {
    const idToken = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!idToken)
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

    const { uid } = await adminAuth.verifyIdToken(idToken);

    const { text } = await req.json();
    if (!text || text.length < 5)
      return NextResponse.json({ error: "empty" }, { status: 400 });

    // call OpenAI once for summary + mood
    const prompt = `You are a journaling assistant. 
Summarize the entry in 2 sentences. Then output a JSON with: 
{ "summary": "...", "moodScore": -1..1, "moodLabel": "very negative|negative|neutral|positive|very positive", "topics": ["..."] }.
Entry: """${text}"""`;

    const resp = await openai.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
    });

    const raw = resp.output_text ?? "{}";
    const parsed = JSON.parse(raw);

    const doc = {
      uid,
      text,
      summary: parsed.summary ?? "",
      moodScore: Number(parsed.moodScore ?? 0),
      moodLabel: parsed.moodLabel ?? "neutral",
      topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 5) : [],
      createdAt: new Date(),
    };

    await adminDb.collection("entries").add(doc);
    return NextResponse.json({ ok: true, entry: doc });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "error" }, { status: 500 });
  }
}
