"use client";

import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase/client";

export default function DetectiveInsights() {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInsights();
  }, []);

  async function loadInsights() {
    setLoading(true);
    setError(null);
    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      if (!idToken) throw new Error("Please sign in");

      const res = await fetch("/api/insights", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to load insights");
      }

      const data = await res.json();
      setInsights(data.insights || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">🔍</div>
          <div>
            <h2 className="text-lg font-bold text-purple-900">
              Journal Detective
            </h2>
            <p className="text-xs text-purple-700">
              Analyzing your patterns...
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center p-8">
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
      </div>
    );
  }

  if (error || insights.length === 0) {
    return (
      <div className="p-6 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-3xl">🔍</div>
          <div>
            <h2 className="text-lg font-bold text-purple-900">
              Journal Detective
            </h2>
            <p className="text-xs text-purple-700">Patterns you don't see</p>
          </div>
        </div>
        <div className="text-center p-6">
          <p className="text-sm text-gray-600">
            {error || "Write at least 5 entries to unlock pattern detection"}
          </p>
          <button
            onClick={loadInsights}
            className="mt-4 px-4 py-2 text-sm rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-all"
          >
            🔄 Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-300 rounded-full blur-3xl opacity-20" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-300 rounded-full blur-3xl opacity-20" />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🔍</div>
            <div>
              <h2 className="text-lg font-bold text-purple-900">
                Journal Detective
              </h2>
              <p className="text-xs text-purple-700">
                Patterns discovered in your entries
              </p>
            </div>
          </div>
          <button
            onClick={loadInsights}
            className="p-2 rounded-lg hover:bg-purple-100 transition-colors"
            title="Refresh insights"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-purple-700"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {insights.map((insight, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-4 rounded-xl bg-white border border-purple-100 hover:border-purple-300 transition-all hover:shadow-md"
            >
              <div className="text-xl mt-0.5">💡</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{insight}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-purple-200">
          <p className="text-xs text-purple-700 text-center italic">
            Insights update as you journal more
          </p>
        </div>
      </div>
    </div>
  );
}
