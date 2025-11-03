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

interface EntryListProps {
  onCountChange?: (count: number) => void;
}

export default function EntryList({ onCountChange }: EntryListProps) {
  const [items, setItems] = useState<(Entry & { id: string })[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setError("Please sign in to view your entries");
        setReady(true);
        return;
      }

      const q = query(
        collection(db, "entries"),
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubQuery = onSnapshot(
        q,
        (snap) => {
          try {
            const next = snap.docs.map((d) => {
              const data = d.data() as DocumentData;
              return {
                id: d.id,
                ...(data as Entry),
                createdAt: data.createdAt?.toDate() || new Date(),
              };
            });
            setItems(next);
            setReady(true);
            setError(null);

            // Notify parent of count change
            onCountChange?.(next.length);
          } catch (e) {
            setError("Error loading entries. Please try again.");
          }
        },
        (err) => {
          setError(err.message);
          setReady(true);
        }
      );

      return () => {
        unsubQuery();
        unsubAuth();
      };
    });

    return () => {};
  }, [onCountChange]);

  async function deleteEntry(id: string) {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    setDeleting(id);
    try {
      const idToken = await auth.currentUser?.getIdToken(true);
      if (!idToken) throw new Error("Please sign in");

      const res = await fetch(`/api/entries/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete entry");
    } finally {
      setDeleting(null);
    }
  }

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
      <div className="text-center p-8 text-gray-500">
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
            className="group border rounded-2xl p-4 transition-all hover:shadow-lg relative"
          >
            <div className="flex justify-between items-start">
              <p className="text-xs text-gray-500">{when}</p>
              <button
                onClick={() => deleteEntry(e.id)}
                disabled={deleting === e.id}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 disabled:opacity-50"
                title="Delete entry"
              >
                {deleting === e.id ? (
                  <svg
                    className="animate-spin h-4 w-4"
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
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                )}
              </button>
            </div>
            <p className="mt-2 whitespace-pre-wrap">{e.text}</p>

            {(e.summary || e.moodLabel) && (
              <div className="mt-3 p-3 rounded-xl bg-gray-50 text-black">
                {e.summary && (
                  <>
                    <p className="text-sm font-medium">Summary</p>
                    <p className="text-sm ">{e.summary}</p>
                  </>
                )}
                <p className="mt-2 text-xs text-gray-600">
                  Mood:{" "}
                  <span className="font-medium text-black">
                    {e.moodLabel ?? "—"}
                  </span>
                  {typeof e.moodScore === "number" ? ` (${e.moodScore}/100)` : ""}
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
