/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { auth } from "@/lib/firebase/client"; // your client initializer exports `auth`

type Props = {
  onSaved?: () => Promise<void> | void; // optional: refresh the list after save
};

export default function EntryComposer({ onSaved }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    summary: string;
    mood: string;
  } | null>(null);

  const handleSubmit = async () => {
    if (loading) return;
    setError(null);
    setLastResult(null);

    if (!text.trim()) {
      setError("Write something first 🙂");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setError("Please sign in first to save your entry.");
      return;
    }

    try {
      setLoading(true);

      const token = await user.getIdToken(true);

      const res = await fetch("/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      // Always try to read JSON if possible; if not, fall back to text.
      let data: any = null;
      const raw = await res.text();
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        // server unexpectedly returned non-JSON; surface it
        throw new Error(raw || `Request failed with ${res.status}`);
      }

      if (!res.ok) {
        throw new Error(data?.error || `Request failed with ${res.status}`);
      }

      setLastResult({ summary: data.summary, mood: data.mood });
      setText(""); // clear the editor

      if (onSaved) await onSaved();
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-lg font-semibold">Journal</label>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write about your day…"
        rows={6}
        className="w-full rounded-xl bg-zinc-900/60 border border-zinc-800 outline-none p-4 text-sm md:text-base
                   focus:border-zinc-500 transition-colors"
      />

      <div className="flex items-center gap-3">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-white text-black font-medium disabled:opacity-60"
        >
          {loading ? "Summarizing…" : "Save & Summarize"}
        </button>

        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>

      {lastResult && (
        <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          <div className="text-sm text-zinc-400">AI Summary</div>
          <div className="mt-1 text-zinc-100">{lastResult.summary}</div>
          <div className="mt-2 text-xs text-zinc-400">
            Mood: {lastResult.mood}
          </div>
        </div>
      )}
    </div>
  );
}
