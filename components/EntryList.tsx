"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase/client";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
  DocumentData,
} from "firebase/firestore";

type Entry = {
  text: string;
  summary?: string;
  moodLabel?: string;
  moodScore?: number;
  topics?: string[];
  createdAt: Timestamp | Date;
};

export default function EntryList() {
  const [items, setItems] = useState<(Entry & { id: string })[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    const q = query(
      collection(db, "entries"),
      where("uid", "==", u.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const next = snap.docs.map((d) => {
        const data = d.data() as DocumentData;
        return { id: d.id, ...(data as Entry) };
      });
      setItems(next);
      setReady(true);
    });
    return () => unsub();
  }, []);

  if (!ready)
    return <div className="text-sm text-gray-500">Loading entries…</div>;
  if (!items.length)
    return <div className="text-sm text-gray-500">No entries yet.</div>;

  return (
    <div className="space-y-4">
      {items.map((e) => {
        const when =
          (e.createdAt as any)?.toDate?.()?.toLocaleString() ??
          new Date(e.createdAt as any).toLocaleString();
        return (
          <article key={e.id} className="border rounded-2xl p-4">
            <p className="text-xs text-gray-500">{when}</p>
            <p className="mt-2 whitespace-pre-wrap">{e.text}</p>

            {(e.summary || e.moodLabel) && (
              <div className="mt-3 p-3 rounded-xl bg-gray-50">
                {e.summary && (
                  <>
                    <p className="text-sm font-medium">Summary</p>
                    <p className="text-sm">{e.summary}</p>
                  </>
                )}
                <p className="mt-2 text-xs text-gray-600">
                  Mood:{" "}
                  <span className="font-medium">{e.moodLabel ?? "—"}</span>
                  {typeof e.moodScore === "number" ? ` (${e.moodScore})` : ""}
                  {e.topics?.length ? ` · Topics: ${e.topics.join(", ")}` : ""}
                </p>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
