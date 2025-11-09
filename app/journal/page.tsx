/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";
import EntryList from "@/components/EntryList";
import AuthGate from "@/components/AuthGate";
import Toast from "@/components/Toast";
import FancyLoader from "@/components/FancyLoader";
import ExportButton from "@/components/ExportButton";
import VoiceRecorder from "@/components/VoiceRecorder";
import Link from "next/link";

export default function JournalPage() {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [entryCount, setEntryCount] = useState(0);
  const [smartPrompt, setSmartPrompt] = useState("How are you feeling today?");
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const MAX_WORDS = 500;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  // Load smart prompt on mount
  useEffect(() => {
    fetchSmartPrompt();
  }, []);

  async function fetchSmartPrompt() {
    setLoadingPrompt(true);
    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      if (!idToken) return;

      const res = await fetch("/api/prompts", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setSmartPrompt(data.prompt || "How are you feeling today?");
      }
    } catch (err) {
      // Silently fail and use default prompt
    } finally {
      setLoadingPrompt(false);
    }
  }

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

      // Fetch new smart prompt after saving
      fetchSmartPrompt();
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
      {saving && <FancyLoader message="Analyzing your entry..." />}
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}
      <main className="max-w-7xl mx-auto p-6 mt-10">
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
            <div className="flex items-center gap-3">
              <Link
                href="/analytics"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                title="View analytics"
              >
                📊 Analytics
              </Link>
              <Link
                href="/goals"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                title="Track goals"
              >
                🎯 Goals
              </Link>
              <Link
                href="/letters"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                title="Future self letters"
              >
                💌 Letters
              </Link>
              <Link
                href="/chapters"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                title="Life chapters"
              >
                📖 Chapters
              </Link>
              <ExportButton />
              <button
                onClick={() => auth.signOut()}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Smart Prompt Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs font-semibold text-purple-700 mb-1">
                  ✨ Today's Prompt
                </p>
                <p className="text-sm text-gray-700 italic">"{smartPrompt}"</p>
              </div>
              <button
                onClick={fetchSmartPrompt}
                disabled={loadingPrompt}
                className="flex-shrink-0 p-2 rounded-lg hover:bg-white/50 transition-colors disabled:opacity-50"
                title="Get new prompt"
              >
                {loadingPrompt ? (
                  <svg
                    className="animate-spin h-4 w-4 text-purple-600"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-purple-600"
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
                )}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Toggle between text and voice */}
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setShowVoiceRecorder(false)}
                className={`px-4 py-2 text-sm rounded-lg transition-all ${
                  !showVoiceRecorder
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                ✍️ Type
              </button>
              <button
                onClick={() => setShowVoiceRecorder(true)}
                className={`px-4 py-2 text-sm rounded-lg transition-all ${
                  showVoiceRecorder
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                🎤 Voice
              </button>
            </div>

            {showVoiceRecorder ? (
              <VoiceRecorder onTranscript={(transcript) => setText((prev) => prev + " " + transcript)} />
            ) : (
              <div className="relative">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={`${smartPrompt} (Cmd/Ctrl + Enter to save)`}
                  className="w-full h-40 p-4 border rounded-xl focus:ring-2 focus:ring-black focus:border-transparent transition-shadow resize-none"
                />
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                  {wordCount}/{MAX_WORDS} words
                </div>
              </div>
            )}

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
