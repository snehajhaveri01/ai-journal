// lib/openai.ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function summarizeEntryAndDetectMood(text: string) {
  const prompt = `You are an assistant that analyzes a short personal journal entry.

Analyze the following journal entry and return a JSON object with:
1) "summary": A concise summary in 1-2 sentences
2) "mood": One of "positive", "neutral", or "negative"
3) "moodScore": A number from 0-100 representing emotional intensity (0=very negative, 50=neutral, 100=very positive)
4) "topics": An array of 1-5 key themes or topics mentioned (e.g., ["work", "relationships", "health"])

Journal entry:
"""${text}"""

Return valid JSON matching this structure:
{
  "summary": "...",
  "mood": "positive|neutral|negative",
  "moodScore": 0-100,
  "topics": ["topic1", "topic2"]
}`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = res.choices[0]?.message?.content?.trim() || "{}";
  let parsed: {
    summary?: string;
    mood?: string;
    moodScore?: number;
    topics?: string[];
  };

  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {
      summary: "Unable to summarize.",
      mood: "neutral",
      moodScore: 50,
      topics: [],
    };
  }

  const summary = parsed.summary || "No summary.";
  const mood =
    parsed.mood === "positive" ||
    parsed.mood === "negative" ||
    parsed.mood === "neutral"
      ? parsed.mood
      : "neutral";

  const moodScore =
    typeof parsed.moodScore === "number" &&
    parsed.moodScore >= 0 &&
    parsed.moodScore <= 100
      ? Math.round(parsed.moodScore)
      : mood === "positive"
      ? 75
      : mood === "negative"
      ? 25
      : 50;

  const topics = Array.isArray(parsed.topics)
    ? parsed.topics.filter((t) => typeof t === "string").slice(0, 5)
    : [];

  return { summary, mood, moodScore, topics };
}
