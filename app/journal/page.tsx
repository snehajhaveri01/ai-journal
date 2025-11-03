/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";
import EntryList from "@/components/EntryList";
import AuthGate from "@/components/AuthGate";
import Toast from "@/components/Toast";

export default function JournalPage() {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [entryCount, setEntryCount] = useState(0);

  const MAX_WORDS = 500;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  // Keyboard shortcut: Cmd/Ctrl + Enter to save
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (text.trim() && !saving) {
          createEntry();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [text, saving]);

  async function createEntry() {
    if (!text.trim()) return;

    if (wordCount > MAX_WORDS) {
      setToastType("error");
      setToastMessage(`Please keep your entry under ${MAX_WORDS} words`);
      return;
    }

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

      // Show success feedback with Toast
      const mood = data.mood || "neutral";
      const emojiMap: Record<string, string> = {
        positive: "😊",
        neutral: "😐",
        negative: "😔",
      };
      const emoji = emojiMap[mood as keyof typeof emojiMap] || "📝";
      setToastType("success");
      setToastMessage(`${emoji} Entry saved! Mood: ${mood}`);
    } catch (err: any) {
      setError(err.message || "Failed to save entry");
      setToastType("error");
      setToastMessage(err.message || "Failed to save entry");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthGate>
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}
      <main className="max-w-2xl mx-auto p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Journal</h1>
              {entryCount > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {entryCount} {entryCount === 1 ? "entry" : "entries"}
                </p>
              )}
            </div>
            <button
              onClick={() => auth.signOut()}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Sign out
            </button>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="How are you feeling today? (Cmd/Ctrl + Enter to save)"
                className="w-full h-40 p-4 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-shadow resize-none"
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {wordCount}/{MAX_WORDS} words
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                {error}
              </p>
            )}

            <div className="flex justify-end">
              <button
                disabled={saving || !text.trim() || wordCount > MAX_WORDS}
                onClick={createEntry}
                className="px-6 py-2 rounded-xl bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:hover:bg-black transition-colors"
              >
                {saving ? "Analyzing..." : "Save & analyze"}
              </button>
            </div>
          </div>

          <EntryList onCountChange={setEntryCount} />
        </div>
      </main>
    </AuthGate>
  );
}
