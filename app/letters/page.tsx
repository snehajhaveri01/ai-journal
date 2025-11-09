"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/client";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import AuthGate from "@/components/AuthGate";
import Link from "next/link";

interface Letter {
  id: string;
  title: string;
  content: string;
  openDate: Date;
  createdAt: Date;
  isOpened: boolean;
}

export default function LettersPage() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [daysUntilOpen, setDaysUntilOpen] = useState("30");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "letters"), where("uid", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lettersData: Letter[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || "",
          content: data.content || "",
          openDate: data.openDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          isOpened: data.isOpened || false,
        };
      });
      setLetters(
        lettersData.sort((a, b) => a.openDate.getTime() - b.openDate.getTime())
      );
    });

    return () => unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Please sign in");

      const openDate = new Date();
      openDate.setDate(openDate.getDate() + parseInt(daysUntilOpen));

      await addDoc(collection(db, "letters"), {
        uid: user.uid,
        title: title.trim(),
        content: content.trim(),
        openDate: Timestamp.fromDate(openDate),
        createdAt: Timestamp.now(),
        isOpened: false,
      });

      setTitle("");
      setContent("");
      setDaysUntilOpen("30");
      setShowForm(false);
    } catch (error) {
      alert("Failed to create letter");
    } finally {
      setLoading(false);
    }
  }

  async function openLetter(id: string) {
    try {
      const letterRef = doc(db, "letters", id);
      await deleteDoc(letterRef);
    } catch (error) {
      console.error("Failed to open letter", error);
    }
  }

  const unopenedLetters = letters.filter(
    (l) => !l.isOpened && l.openDate <= new Date()
  );
  const futureLetters = letters.filter((l) => !l.isOpened && l.openDate > new Date());

  return (
    <AuthGate>
      <main className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Future Self Letters</h1>
            <p className="text-gray-600 text-sm mt-1">
              Write to your future self and rediscover your thoughts later
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transition-all"
            >
              {showForm ? "Cancel" : "✍️ Write Letter"}
            </button>
            <Link
              href="/journal"
              className="px-4 py-2 text-sm rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* Create Letter Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 p-6 rounded-2xl border-2 border-blue-200 bg-blue-50"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>💌</span> Write to Your Future Self
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Letter Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Reflections from December 2024"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Message
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Dear future me..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={8}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Open in...
                </label>
                <select
                  value={daysUntilOpen}
                  onChange={(e) => setDaysUntilOpen(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="7">1 week</option>
                  <option value="30">1 month</option>
                  <option value="90">3 months</option>
                  <option value="180">6 months</option>
                  <option value="365">1 year</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold"
              >
                {loading ? "Sealing letter..." : "🔒 Seal & Send to Future"}
              </button>
            </div>
          </form>
        )}

        {/* Ready to Open */}
        {unopenedLetters.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>📬</span> Ready to Open ({unopenedLetters.length})
            </h2>
            <div className="space-y-4">
              {unopenedLetters.map((letter) => (
                <div
                  key={letter.id}
                  className="p-6 rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 animate-pulse"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-green-900">
                        {letter.title}
                      </h3>
                      <p className="text-sm text-green-700 mt-1">
                        Written {letter.createdAt.toLocaleDateString()} · Ready now!
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Open "${letter.title}"? The letter will be revealed.`
                          )
                        ) {
                          alert(`Letter from your past self:\n\n${letter.content}`);
                          openLetter(letter.id);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-all font-semibold"
                    >
                      📖 Open Letter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Future Letters */}
        {futureLetters.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span>🔒</span> Sealed Letters ({futureLetters.length})
            </h2>
            <div className="space-y-4">
              {futureLetters.map((letter) => {
                const daysRemaining = Math.ceil(
                  (letter.openDate.getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                return (
                  <div
                    key={letter.id}
                    className="p-6 rounded-2xl border border-gray-200 bg-white hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{letter.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Written {letter.createdAt.toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          📅 Opens on {letter.openDate.toLocaleDateString()} ({daysRemaining}{" "}
                          days remaining)
                        </p>
                      </div>
                      <div className="text-4xl opacity-30">🔒</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {letters.length === 0 && !showForm && (
          <div className="text-center p-12 text-gray-500">
            <div className="text-6xl mb-4">💌</div>
            <p className="text-lg mb-2">No letters yet</p>
            <p className="text-sm">Write a letter to your future self!</p>
          </div>
        )}
      </main>
    </AuthGate>
  );
}
