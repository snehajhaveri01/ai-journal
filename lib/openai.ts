// lib/openai.ts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface EmotionScores {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
  anxiety: number;
  excitement: number;
}

export interface EntityExtraction {
  people: string[];
  places: string[];
  events: string[];
}

export interface AdvancedAnalysis {
  summary: string;
  mood: "positive" | "neutral" | "negative";
  moodScore: number;
  topics: string[];
  emotions: EmotionScores;
  categories: string[];
  entities: EntityExtraction;
  sentiment: {
    primary: string;
    secondary?: string;
  };
}

export async function summarizeEntryAndDetectMood(
  text: string
): Promise<AdvancedAnalysis> {
  const prompt = `You are an advanced psychological AI assistant that analyzes personal journal entries with deep emotional intelligence.

Analyze the following journal entry and return a comprehensive JSON object with:

1) "summary": A concise, empathetic summary in 1-2 sentences
2) "mood": Overall mood - one of "positive", "neutral", or "negative"
3) "moodScore": Overall emotional valence from 0-100 (0=very negative, 50=neutral, 100=very positive)
4) "topics": Array of 1-5 specific themes mentioned (e.g., ["work stress", "family dinner", "exercise"])

5) "emotions": Object with 8 emotion scores (0-100 each):
   - "joy": Level of happiness, contentment, pleasure
   - "sadness": Level of sorrow, grief, melancholy
   - "anger": Level of frustration, irritation, rage
   - "fear": Level of worry, anxiety about future events
   - "surprise": Level of unexpectedness, astonishment
   - "disgust": Level of revulsion, distaste
   - "anxiety": Level of unease, nervousness, stress
   - "excitement": Level of anticipation, enthusiasm

6) "categories": Array of 1-3 life domains (choose from: "Work", "Relationships", "Health", "Family", "Hobbies", "Finance", "Personal Growth", "Social", "Travel", "Education", "Spirituality", "Mental Health")

7) "entities": Object with:
   - "people": Array of people names mentioned (first names only)
   - "places": Array of locations mentioned
   - "events": Array of significant events or activities

8) "sentiment": Object with:
   - "primary": The dominant emotion (one of: joy, sadness, anger, fear, surprise, disgust, anxiety, excitement, neutral)
   - "secondary": The second most prominent emotion (optional, null if not applicable)

Journal entry:
"""${text}"""

Return ONLY valid JSON matching this exact structure:
{
  "summary": "string",
  "mood": "positive|neutral|negative",
  "moodScore": 0-100,
  "topics": ["topic1", "topic2"],
  "emotions": {
    "joy": 0-100,
    "sadness": 0-100,
    "anger": 0-100,
    "fear": 0-100,
    "surprise": 0-100,
    "disgust": 0-100,
    "anxiety": 0-100,
    "excitement": 0-100
  },
  "categories": ["Category1", "Category2"],
  "entities": {
    "people": ["name1"],
    "places": ["place1"],
    "events": ["event1"]
  },
  "sentiment": {
    "primary": "emotion",
    "secondary": "emotion or null"
  }
}`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  const content = res.choices[0]?.message?.content?.trim() || "{}";
  let parsed: Partial<AdvancedAnalysis>;

  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {};
  }

  // Validate and provide defaults
  const summary = parsed.summary || "Unable to summarize.";

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

  const emotions: EmotionScores = {
    joy: validateScore(parsed.emotions?.joy, 0),
    sadness: validateScore(parsed.emotions?.sadness, 0),
    anger: validateScore(parsed.emotions?.anger, 0),
    fear: validateScore(parsed.emotions?.fear, 0),
    surprise: validateScore(parsed.emotions?.surprise, 0),
    disgust: validateScore(parsed.emotions?.disgust, 0),
    anxiety: validateScore(parsed.emotions?.anxiety, 0),
    excitement: validateScore(parsed.emotions?.excitement, 0),
  };

  const categories = Array.isArray(parsed.categories)
    ? parsed.categories.filter((c) => typeof c === "string").slice(0, 3)
    : [];

  const entities: EntityExtraction = {
    people: Array.isArray(parsed.entities?.people)
      ? parsed.entities.people.filter((p) => typeof p === "string")
      : [],
    places: Array.isArray(parsed.entities?.places)
      ? parsed.entities.places.filter((p) => typeof p === "string")
      : [],
    events: Array.isArray(parsed.entities?.events)
      ? parsed.entities.events.filter((e) => typeof e === "string")
      : [],
  };

  const sentiment = {
    primary: parsed.sentiment?.primary || "neutral",
    secondary: parsed.sentiment?.secondary || undefined,
  };

  return {
    summary,
    mood,
    moodScore,
    topics,
    emotions,
    categories,
    entities,
    sentiment,
  };
}

function validateScore(value: any, defaultValue: number): number {
  if (typeof value === "number" && value >= 0 && value <= 100) {
    return Math.round(value);
  }
  return defaultValue;
}

// Generate smart journal prompts based on user's history
export async function generateSmartPrompt(
  recentEntries: Array<{ text: string; mood: string; topics: string[] }>,
  daysSinceLastEntry: number
): Promise<string> {
  const analysisContext = recentEntries
    .slice(0, 5)
    .map((e, i) => `Entry ${i + 1}: Mood: ${e.mood}, Topics: ${e.topics.join(", ")}`)
    .join("\n");

  const prompt = `You are a supportive journaling coach. Based on the user's recent journal patterns, generate ONE thoughtful, personalized writing prompt.

Recent entries context:
${analysisContext}

Days since last entry: ${daysSinceLastEntry}

Guidelines:
- If they've been stressed, suggest reflection or gratitude
- If they haven't written in a while, make it welcoming and easy
- If they write about specific topics repeatedly, help them explore deeper
- Keep it warm, non-judgmental, and under 20 words
- Use second person ("you")

Return only the prompt text, nothing else.`;

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 100,
  });

  return res.choices[0]?.message?.content?.trim() || "How are you feeling today?";
}

// Analyze patterns in journal entries
export async function analyzePatterns(
  entries: Array<{
    text: string;
    mood: string;
    moodScore: number;
    topics: string[];
    categories: string[];
    emotions: any;
    createdAt: Date;
  }>
): Promise<string[]> {
  // Prepare data summary for AI
  const entriesByDay: Record<string, any[]> = {};
  const entriesByTime: Record<string, any[]> = {};

  entries.forEach((entry) => {
    const dayName = entry.createdAt.toLocaleDateString("en-US", { weekday: "long" });
    const hour = entry.createdAt.getHours();
    const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

    if (!entriesByDay[dayName]) entriesByDay[dayName] = [];
    if (!entriesByTime[timeOfDay]) entriesByTime[timeOfDay] = [];

    entriesByDay[dayName].push(entry);
    entriesByTime[timeOfDay].push(entry);
  });

  // Calculate patterns
  const dayMoodAvgs = Object.entries(entriesByDay).map(([day, entries]) => ({
    day,
    avgMood: entries.reduce((sum, e) => sum + e.moodScore, 0) / entries.length,
    count: entries.length,
  }));

  const timeMoodAvgs = Object.entries(entriesByTime).map(([time, entries]) => ({
    time,
    avgMood: entries.reduce((sum, e) => sum + e.moodScore, 0) / entries.length,
    count: entries.length,
  }));

  // Topic frequency
  const topicCounts: Record<string, number> = {};
  entries.forEach((e) => {
    e.topics.forEach((topic) => {
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
    });
  });

  const topTopics = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Correlation between topics and mood
  const topicMoodCorrelation = topTopics.map(([topic, count]) => {
    const topicEntries = entries.filter((e) => e.topics.includes(topic));
    const avgMood =
      topicEntries.reduce((sum, e) => sum + e.moodScore, 0) / topicEntries.length;
    return { topic, avgMood, count };
  });

  const prompt = `You are a psychological pattern analyst. Detect surprising, actionable patterns from journal data.

DATA:
${entries.length} entries, last 60 days

Day patterns:
${dayMoodAvgs.map((d) => `${d.day}: mood ${d.avgMood.toFixed(0)}/100`).join(", ")}

Time patterns:
${timeMoodAvgs.map((t) => `${t.time}: mood ${t.avgMood.toFixed(0)}/100`).join(", ")}

Topics:
${topicMoodCorrelation.map((t) => `"${t.topic}": ${t.count}x, mood ${t.avgMood.toFixed(0)}`).join(", ")}

Generate 4 detective insights (under 12 words each):
- Specific with numbers
- Focus on correlations
- Surprising patterns

Return JSON: {"insights": ["...", "...", "...", "..."]}`;

  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const content = res.choices[0]?.message?.content?.trim() || "{}";
    const parsed = JSON.parse(content);

    if (parsed.insights && Array.isArray(parsed.insights)) {
      return parsed.insights.slice(0, 5);
    }
    return ["Keep journaling to discover patterns"];
  } catch (error) {
    return ["Write more entries to unlock pattern detection"];
  }
}
