"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase/client";
import {
  Timestamp,
  addDoc,
  collection,
  getCountFromServer,
  query,
  where,
} from "firebase/firestore";
import Paywall from "./Paywall";

type Props = {
  isPro: boolean;
};

export default function EntryComposer({ isPro }: Props) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  useEffect(() => {
    // Count today's entries to enforce free limit
    (async () => {
      const u = auth.currentUser;
      if (!u) return;
      const q = query(
        collection(db, "entries"),
        where("uid", "==", u.uid),
        where("createdAt", ">=", Timestamp.fromDate(todayStart))
      );
      const snap = await getCountFromServer(q);
      setTodayCount(snap.data().count);
    })();
  }, [todayStart]);

  async function createEntry() {
    const user = auth.currentUser;
    if (!user) return alert("Please sign in first.");
    if (!isPro && todayCount >= 3) {
      setShowPaywall(true);
      return;
    }
    const idToken = await user.getIdToken();

    try {
      setSaving(true);
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Failed");

      // Optimistic local write for snappy UI (server also writes)
      await addDoc(collection(db, "entries"), {
        uid: user.uid,
        text,
        summary: data.entry?.summary ?? "",
        moodScore: data.entry?.moodScore ?? 0,
        moodLabel: data.entry?.moodLabel ?? "neutral",
        topics: data.entry?.topics ?? [],
        createdAt: Timestamp.fromDate(new Date()),
      });

      setText("");
      setTodayCount((c) => c + 1);
    } catch (e: any) {
      alert(e.message || "Error");
    } finally {
      setSaving(false);
    }
  }

  function startDictation() {
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return alert("Speech Recognition not supported in this browser.");
    const rec = new SR();
    rec.lang = "en-US";
    rec.onresult = (e: any) => {
      const t = e.results?.[0]?.[0]?.transcript ?? "";
      setText((prev) => (prev ? prev + " " + t : t));
    };
    rec.start();
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {isPro
            ? "Pro: unlimited entries"
            : `Free: ${Math.max(0, 3 - todayCount)} entries left today`}
        </p>
        <button
          type="button"
          onClick={startDictation}
          className="text-sm underline"
          title="Dictate your entry"
        >
          🎙️ Dictate
        </button>
      </div>

      <textarea
        className="w-full min-h-40 border rounded-2xl p-3"
        placeholder="What’s on your mind today?"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex gap-2">
        <button
          onClick={createEntry}
          disabled={saving || !text.trim()}
          className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-60"
        >
          {saving ? "Summarizing…" : "Save & summarize"}
        </button>
      </div>

      {showPaywall && <Paywall onClose={() => setShowPaywall(false)} />}
    </div>
  );
}
