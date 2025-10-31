/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase/client";
import EntryList from "@/components/EntryList";
import AuthGate from "@/components/AuthGate";

export default function JournalPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.replace("/signin");
      }
    });
    return () => unsubscribe();
  }, [router]);

  async function createEntry() {
    if (!text.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      if (!idToken) {
        throw new Error("Please sign in to continue");
      }

      const res = await fetch("/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save entry");
      }

      const data = await res.json();
      setText("");

      // Show success feedback
      const mood = data.mood || "neutral";
      const emojiMap: Record<string, string> = {
        positive: "😊",
        neutral: "😐",
        negative: "😔",
      };
      const emoji = emojiMap[mood as keyof typeof emojiMap] || "📝";
      alert(`${emoji} Entry saved!\n\nSummary: ${data.summary}\nMood: ${mood}`);
    } catch (err: any) {
      console.error("Save error:", err);
      setError(err.message || "Failed to save entry");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthGate>
      <main className="max-w-2xl mx-auto p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Journal</h1>
            <button
              onClick={() => auth.signOut()}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>

          <div className="space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="How are you feeling today?"
              className="w-full h-40 p-4 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-shadow resize-none"
            />

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex justify-end">
              <button
                disabled={saving || !text.trim()}
                onClick={createEntry}
                className="px-6 py-2 rounded-xl bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-black transition-colors"
              >
                {saving ? "Analyzing..." : "Save & analyze"}
              </button>
            </div>
          </div>

          <EntryList />
        </div>
      </main>
    </AuthGate>
  );
}
