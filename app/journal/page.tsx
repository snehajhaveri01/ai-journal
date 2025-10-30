/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { auth } from "@/lib/firebase/client";
import AuthGate from "@/components/AuthGate";

export default function JournalPage() {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<any[]>([]);

  async function createEntry() {
    if (!text.trim()) return;
    setSaving(true);
    const idToken = await auth.currentUser?.getIdToken();
    const res = await fetch("/api/entries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    setSaving(false);
    if (data.ok) {
      setEntries([data.entry, ...entries]);
      setText("");
    } else {
      alert(data.error || "Error");
    }
  }

  return (
    <AuthGate>
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Journal</h1>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your thoughts…"
          className="w-full h-40 p-3 border rounded-xl"
        />
        <button
          disabled={saving}
          onClick={createEntry}
          className="px-4 py-2 rounded-xl bg-black text-white"
        >
          {saving ? "Summarizing…" : "Save & summarize"}
        </button>

        <section className="space-y-4">
          {entries.map((e, i) => (
            <div key={i} className="border rounded-xl p-4">
              <p className="text-sm text-gray-500">
                {new Date(e.createdAt).toLocaleString?.() || ""}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{e.text}</p>
              <div className="mt-3 p-3 rounded-lg bg-gray-50">
                <p className="font-medium">Summary</p>
                <p className="text-sm">{e.summary}</p>
                <p className="mt-2 text-xs">
                  Mood: <span className="font-medium">{e.moodLabel}</span> (
                  {e.moodScore})
                  {e.topics?.length ? ` · Topics: ${e.topics.join(", ")}` : ""}
                </p>
              </div>
            </div>
          ))}
        </section>
      </main>
    </AuthGate>
  );
}
