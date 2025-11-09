"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/client";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import AuthGate from "@/components/AuthGate";
import Link from "next/link";

interface Chapter {
  title: string;
  period: string;
  entries: number;
  avgMood: number;
  dominantTopic: string;
  startDate: Date;
  endDate: Date;
  description: string;
}

export default function ChaptersPage() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChapters();
  }, []);

  async function loadChapters() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "entries"),
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snapshot = await getDocs(q);
      const entries = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          text: data.text || "",
          mood: data.mood || "neutral",
          moodScore: data.moodScore || 50,
          topics: data.topics || [],
          categories: data.categories || [],
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });

      // Auto-segment into chapters (monthly for now)
      const chaptersByMonth: Record<string, any[]> = {};

      entries.forEach((entry) => {
        const monthKey = `${entry.createdAt.getFullYear()}-${String(
          entry.createdAt.getMonth() + 1
        ).padStart(2, "0")}`;
        if (!chaptersByMonth[monthKey]) chaptersByMonth[monthKey] = [];
        chaptersByMonth[monthKey].push(entry);
      });

      const detectedChapters: Chapter[] = Object.entries(chaptersByMonth).map(
        ([monthKey, entries]) => {
          const [year, month] = monthKey.split("-");
          const monthName = new Date(
            parseInt(year),
            parseInt(month) - 1
          ).toLocaleDateString("en-US", { month: "long", year: "numeric" });

          const avgMood =
            entries.reduce((sum, e) => sum + e.moodScore, 0) / entries.length;

          // Find dominant topic
          const topicCounts: Record<string, number> = {};
          entries.forEach((e) => {
            e.topics.forEach((t: string) => {
              topicCounts[t] = (topicCounts[t] || 0) + 1;
            });
          });
          const dominantTopic =
            Object.entries(topicCounts).sort(([, a], [, b]) => b - a)[0]?.[0] ||
            "Life Updates";

          // Generate AI-like description
          let description = "";
          if (avgMood >= 70) {
            description = `A joyful period filled with ${dominantTopic.toLowerCase()} and positive experiences`;
          } else if (avgMood >= 50) {
            description = `A balanced chapter of ${dominantTopic.toLowerCase()} and personal reflection`;
          } else {
            description = `A challenging time focused on ${dominantTopic.toLowerCase()} and growth`;
          }

          const sortedEntries = entries.sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
          );

          return {
            title: monthName,
            period: `${sortedEntries[0].createdAt.toLocaleDateString()} - ${
              sortedEntries[sortedEntries.length - 1].createdAt.toLocaleDateString()
            }`,
            entries: entries.length,
            avgMood: Math.round(avgMood),
            dominantTopic,
            startDate: sortedEntries[0].createdAt,
            endDate: sortedEntries[sortedEntries.length - 1].createdAt,
            description,
          };
        }
      );

      setChapters(detectedChapters.sort((a, b) => b.startDate.getTime() - a.startDate.getTime()));
    } catch (error) {
      console.error("Failed to load chapters", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthGate>
      <main className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Life Chapters</h1>
            <p className="text-gray-600 text-sm mt-1">
              Your journal automatically segmented into life phases
            </p>
          </div>
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
        ) : chapters.length === 0 ? (
          <div className="text-center p-12 text-gray-500">
            <div className="text-6xl mb-4">📖</div>
            <p className="text-lg mb-2">No chapters yet</p>
            <p className="text-sm">
              Start journaling to see your life story unfold
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-pink-500" />

            <div className="space-y-6">
              {chapters.map((chapter, idx) => (
                <div key={idx} className="relative pl-20">
                  {/* Timeline dot */}
                  <div className="absolute left-6 top-6 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-4 border-white shadow-lg" />

                  <div className="p-6 rounded-2xl border-2 border-gray-200 bg-white hover:shadow-xl transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {chapter.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {chapter.period}
                        </p>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-3xl mb-1 ${
                            chapter.avgMood >= 70
                              ? "😊"
                              : chapter.avgMood >= 50
                              ? "😐"
                              : "😔"
                          }`}
                        >
                          {chapter.avgMood >= 70
                            ? "😊"
                            : chapter.avgMood >= 50
                            ? "😐"
                            : "😔"}
                        </div>
                        <p className="text-xs text-gray-600">
                          {chapter.avgMood}% mood
                        </p>
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4 italic">
                      {chapter.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <span>📝</span> {chapter.entries} entries
                      </span>
                      <span className="flex items-center gap-1">
                        <span>🏷️</span> {chapter.dominantTopic}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </AuthGate>
  );
}
