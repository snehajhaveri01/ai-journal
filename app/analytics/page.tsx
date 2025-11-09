"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import AuthGate from "@/components/AuthGate";
import DetectiveInsights from "@/components/DetectiveInsights";
import Link from "next/link";

interface AnalyticsData {
  totalEntries: number;
  avgMoodScore: number;
  moodDistribution: { positive: number; neutral: number; negative: number };
  topEmotions: Array<{ name: string; avgScore: number }>;
  topCategories: Array<{ name: string; count: number }>;
  topTopics: Array<{ name: string; count: number }>;
  writingStreak: number;
  entriesThisWeek: number;
  entriesThisMonth: number;
  moodTrend: "improving" | "declining" | "stable";
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "entries"),
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const entries = snapshot.docs.map((doc) => doc.data());

      // Calculate analytics
      const totalEntries = entries.length;

      const moodScores = entries
        .map((e: any) => e.moodScore)
        .filter((s: number) => typeof s === "number");
      const avgMoodScore =
        moodScores.length > 0
          ? Math.round(
              moodScores.reduce((a: number, b: number) => a + b, 0) /
                moodScores.length
            )
          : 50;

      // Mood distribution
      const moods = entries.map((e: any) => e.mood || "neutral");
      const moodDistribution = {
        positive: moods.filter((m: string) => m === "positive").length,
        neutral: moods.filter((m: string) => m === "neutral").length,
        negative: moods.filter((m: string) => m === "negative").length,
      };

      // Top emotions
      const emotionTotals: Record<string, number[]> = {};
      entries.forEach((e: any) => {
        if (e.emotions) {
          Object.entries(e.emotions).forEach(([emotion, score]) => {
            if (!emotionTotals[emotion]) emotionTotals[emotion] = [];
            emotionTotals[emotion].push(score as number);
          });
        }
      });

      const topEmotions = Object.entries(emotionTotals)
        .map(([name, scores]) => ({
          name,
          avgScore: Math.round(
            scores.reduce((a, b) => a + b, 0) / scores.length
          ),
        }))
        .sort((a, b) => b.avgScore - a.avgScore)
        .slice(0, 5);

      // Top categories
      const categoryCount: Record<string, number> = {};
      entries.forEach((e: any) => {
        (e.categories || []).forEach((cat: string) => {
          categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });
      });

      const topCategories = Object.entries(categoryCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Top topics
      const topicCount: Record<string, number> = {};
      entries.forEach((e: any) => {
        (e.topics || []).forEach((topic: string) => {
          topicCount[topic] = (topicCount[topic] || 0) + 1;
        });
      });

      const topTopics = Object.entries(topicCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate streaks and time-based metrics
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const entriesThisWeek = entries.filter((e: any) => {
        const date = e.createdAt?.toDate();
        return date && date >= oneWeekAgo;
      }).length;

      const entriesThisMonth = entries.filter((e: any) => {
        const date = e.createdAt?.toDate();
        return date && date >= oneMonthAgo;
      }).length;

      // Calculate mood trend (last 10 entries vs previous 10)
      const recentMoodScores = entries
        .slice(0, 10)
        .map((e: any) => e.moodScore)
        .filter((s: number) => typeof s === "number");
      const previousMoodScores = entries
        .slice(10, 20)
        .map((e: any) => e.moodScore)
        .filter((s: number) => typeof s === "number");

      const recentAvg =
        recentMoodScores.length > 0
          ? recentMoodScores.reduce((a: number, b: number) => a + b, 0) /
            recentMoodScores.length
          : 50;
      const previousAvg =
        previousMoodScores.length > 0
          ? previousMoodScores.reduce((a: number, b: number) => a + b, 0) /
            previousMoodScores.length
          : 50;

      let moodTrend: "improving" | "declining" | "stable" = "stable";
      if (recentAvg > previousAvg + 5) moodTrend = "improving";
      else if (recentAvg < previousAvg - 5) moodTrend = "declining";

      // Simple writing streak (consecutive days with entries)
      let writingStreak = 0;
      const sortedDates = entries
        .map((e: any) => {
          const date = e.createdAt?.toDate();
          return date
            ? new Date(date.getFullYear(), date.getMonth(), date.getDate())
            : null;
        })
        .filter((d) => d !== null)
        .sort((a: any, b: any) => b.getTime() - a.getTime());

      if (sortedDates.length > 0) {
        writingStreak = 1;
        for (let i = 0; i < sortedDates.length - 1; i++) {
          const diff = Math.floor(
            ((sortedDates[i] as any).getTime() -
              (sortedDates[i + 1] as any).getTime()) /
              (1000 * 60 * 60 * 24)
          );
          if (diff === 1) writingStreak++;
          else break;
        }
      }

      setData({
        totalEntries,
        avgMoodScore,
        moodDistribution,
        topEmotions,
        topCategories,
        topTopics,
        writingStreak,
        entriesThisWeek,
        entriesThisMonth,
        moodTrend,
      });
    } catch (error) {
      console.error("Failed to load analytics", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGate>
      <main className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <Link
            href="/journal"
            className="px-4 py-2 text-sm rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
          >
            ← Back to Journal
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <svg
              className="animate-spin h-8 w-8 text-purple-600"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        ) : !data ? (
          <div className="text-center p-12 text-gray-500">
            <p>No data available</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Journal Detective */}
            <DetectiveInsights />

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Total Entries"
                value={data.totalEntries.toString()}
                icon="📝"
                color="purple"
              />
              <StatsCard
                title="Average Mood"
                value={`${data.avgMoodScore}%`}
                icon={data.avgMoodScore >= 60 ? "😊" : data.avgMoodScore >= 40 ? "😐" : "😔"}
                color="blue"
              />
              <StatsCard
                title="Writing Streak"
                value={`${data.writingStreak} days`}
                icon="🔥"
                color="orange"
              />
              <StatsCard
                title="This Month"
                value={`${data.entriesThisMonth} entries`}
                icon="📅"
                color="green"
              />
            </div>

            {/* Mood Trend */}
            <div className="p-6 rounded-2xl border border-gray-200 bg-white">
              <h2 className="text-lg font-semibold mb-4">Mood Trend</h2>
              <div className="flex items-center gap-4">
                {data.moodTrend === "improving" && (
                  <>
                    <div className="text-4xl">📈</div>
                    <div>
                      <p className="font-semibold text-green-600">Improving</p>
                      <p className="text-sm text-gray-600">
                        Your mood has been trending upward recently
                      </p>
                    </div>
                  </>
                )}
                {data.moodTrend === "declining" && (
                  <>
                    <div className="text-4xl">📉</div>
                    <div>
                      <p className="font-semibold text-red-600">Declining</p>
                      <p className="text-sm text-gray-600">
                        Your mood has been trending downward recently
                      </p>
                    </div>
                  </>
                )}
                {data.moodTrend === "stable" && (
                  <>
                    <div className="text-4xl">📊</div>
                    <div>
                      <p className="font-semibold text-blue-600">Stable</p>
                      <p className="text-sm text-gray-600">
                        Your mood has been relatively consistent
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Mood Distribution */}
            <div className="p-6 rounded-2xl border border-gray-200 bg-white">
              <h2 className="text-lg font-semibold mb-4">Mood Distribution</h2>
              <div className="space-y-3">
                <MoodBar
                  label="Positive"
                  emoji="😊"
                  count={data.moodDistribution.positive}
                  total={data.totalEntries}
                  color="green"
                />
                <MoodBar
                  label="Neutral"
                  emoji="😐"
                  count={data.moodDistribution.neutral}
                  total={data.totalEntries}
                  color="gray"
                />
                <MoodBar
                  label="Negative"
                  emoji="😔"
                  count={data.moodDistribution.negative}
                  total={data.totalEntries}
                  color="red"
                />
              </div>
            </div>

            {/* Top Emotions */}
            {data.topEmotions.length > 0 && (
              <div className="p-6 rounded-2xl border border-gray-200 bg-white">
                <h2 className="text-lg font-semibold mb-4">Top Emotions</h2>
                <div className="space-y-2">
                  {data.topEmotions.map((emotion, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="capitalize font-medium">
                        {emotion.name}
                      </span>
                      <span className="text-gray-600">{emotion.avgScore}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Categories */}
              {data.topCategories.length > 0 && (
                <div className="p-6 rounded-2xl border border-gray-200 bg-white">
                  <h2 className="text-lg font-semibold mb-4">Top Categories</h2>
                  <div className="space-y-2">
                    {data.topCategories.map((cat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="font-medium">{cat.name}</span>
                        <span className="text-gray-600">
                          {cat.count} entries
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Topics */}
              {data.topTopics.length > 0 && (
                <div className="p-6 rounded-2xl border border-gray-200 bg-white">
                  <h2 className="text-lg font-semibold mb-4">Top Topics</h2>
                  <div className="space-y-2">
                    {data.topTopics.map((topic, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="font-medium">{topic.name}</span>
                        <span className="text-gray-600">
                          {topic.count} mentions
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </AuthGate>
  );
}

function StatsCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: string;
  color: string;
}) {
  const colorClasses = {
    purple: "from-purple-50 to-pink-50 border-purple-200",
    blue: "from-blue-50 to-cyan-50 border-blue-200",
    orange: "from-orange-50 to-yellow-50 border-orange-200",
    green: "from-green-50 to-emerald-50 border-green-200",
  }[color];

  return (
    <div
      className={`p-6 rounded-2xl border bg-gradient-to-br ${colorClasses}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-600 uppercase mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

function MoodBar({
  label,
  emoji,
  count,
  total,
  color,
}: {
  label: string;
  emoji: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  const colorClasses = {
    green: "bg-green-500",
    gray: "bg-gray-400",
    red: "bg-red-500",
  }[color];

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="flex items-center gap-2">
          <span>{emoji}</span>
          <span className="font-medium">{label}</span>
        </span>
        <span className="text-gray-600">
          {count} ({percentage}%)
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
