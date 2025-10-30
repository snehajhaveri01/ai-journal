// lib/openai.ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function summarizeEntryAndDetectMood(text: string) {
  // guard
  const prompt = `You are an assistant that analyzes a short personal journal entry.

1) Give a concise summary in <= 2 sentences.
2) Detect overall mood as one of: "positive", "neutral", "negative".
3) Return valid JSON: {"summary": "...", "mood": "positive|neutral|negative"}

Journal entry:
"""${text}"""`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = res.choices[0]?.message?.content?.trim() || "{}";
  let parsed: { summary?: string; mood?: string };
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = { summary: "Unable to summarize.", mood: "neutral" };
  }

  const summary = parsed.summary || "No summary.";
  const mood =
    parsed.mood === "positive" ||
    parsed.mood === "negative" ||
    parsed.mood === "neutral"
      ? parsed.mood
      : "neutral";

  return { summary, mood };
}
