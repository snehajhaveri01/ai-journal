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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setError("Please sign in to view your entries");
        setReady(true);
        return;
      }

      // Create the query with proper ordering
      const q = query(
        collection(db, "entries"),
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      // Set up real-time listener with error handling
      const unsubQuery = onSnapshot(
        q,
        (snap) => {
          try {
            const next = snap.docs.map((d) => {
              const data = d.data() as DocumentData;
              return {
                id: d.id,
                ...(data as Entry),
                // Ensure createdAt is always a valid date
                createdAt: data.createdAt?.toDate() || new Date(),
              };
            });
            setItems(next);
            setReady(true);
            setError(null);
          } catch (e) {
            console.error("Error processing entries:", e);
            setError("Error loading entries. Please try again.");
          }
        },
        (err) => {
          console.error("Firestore error:", err);
          setError(err.message);
          setReady(true);
        }
      );

      // Clean up both subscriptions
      return () => {
        unsubQuery();
        unsubAuth();
      };
    });

    // Return a noop function for the outer useEffect
    return () => {};
  }, []);

  if (!ready) {
    return (
      <div className="flex items-center justify-center p-4 text-sm text-black">
        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
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
        Loading entries...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-50 text-red-600 text-sm">
        <p className="font-medium">Error loading entries</p>
        <p>{error}</p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="text-center p-8 text-white">
        <p className="text-sm">No entries yet</p>
        <p className="text-xs mt-1">Start writing to see your entries here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((e) => {
        const when =
          e.createdAt instanceof Date
            ? e.createdAt.toLocaleString()
            : new Date().toLocaleString();
        return (
          <article
            key={e.id}
            className="border rounded-2xl p-4 transition-all hover:shadow-lg"
          >
            <p className="text-xs text-white">{when}</p>
            <p className="mt-2 whitespace-pre-wrap">{e.text}</p>

            {(e.summary || e.moodLabel) && (
              <div className="mt-3 p-3 rounded-xl bg-gray-50 text-black">
                {e.summary && (
                  <>
                    <p className="text-sm font-medium">Summary</p>
                    <p className="text-sm ">{e.summary}</p>
                  </>
                )}
                <p className="mt-2 text-xs text-black">
                  Mood:{" "}
                  <span className="font-medium text-black">{e.moodLabel ?? "—"}</span>
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
