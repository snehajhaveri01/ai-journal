/* eslint-disable @typescript-eslint/no-explicit-any */
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
import Modal from "./Modal";
import Toast from "./Toast";
import EmotionChart from "./EmotionChart";
import MoodMusic from "./MoodMusic";
import SearchFilter, { SearchFilterOptions } from "./SearchFilter";

interface EmotionScores {
  joy: number;
  sadness: number;
  anger: number;
  fear: number;
  surprise: number;
  disgust: number;
  anxiety: number;
  excitement: number;
}

interface EntityExtraction {
  people: string[];
  places: string[];
  events: string[];
}

type Entry = {
  text: string;
  summary?: string;
  moodLabel?: string;
  moodScore?: number;
  topics?: string[];
  emotions?: EmotionScores;
  categories?: string[];
  entities?: EntityExtraction;
  sentiment?: {
    primary: string;
    secondary?: string;
  };
  createdAt: Timestamp | Date;
};

interface EntryListProps {
  onCountChange?: (count: number) => void;
}

export default function EntryList({ onCountChange }: EntryListProps) {
  const [items, setItems] = useState<(Entry & { id: string })[]>([]);
  const [filteredItems, setFilteredItems] = useState<(Entry & { id: string })[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    entryId: string | null;
  }>({ isOpen: false, entryId: null });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [filters, setFilters] = useState<SearchFilterOptions>({
    searchQuery: "",
    moodFilter: "",
    categoryFilter: "",
    dateRange: "all",
  });

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

  // Apply filters whenever items or filters change
  useEffect(() => {
    let result = [...items];

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.text.toLowerCase().includes(query) ||
          item.summary?.toLowerCase().includes(query) ||
          item.topics?.some((t) => t.toLowerCase().includes(query))
      );
    }

    // Mood filter
    if (filters.moodFilter) {
      result = result.filter((item) => item.moodLabel === filters.moodFilter);
    }

    // Category filter
    if (filters.categoryFilter) {
      result = result.filter((item) =>
        item.categories?.includes(filters.categoryFilter)
      );
    }

    // Date range filter
    if (filters.dateRange !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      result = result.filter((item) => {
        const itemDate = item.createdAt instanceof Date ? item.createdAt : new Date();

        switch (filters.dateRange) {
          case "today":
            return itemDate >= today;
          case "week":
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return itemDate >= weekAgo;
          case "month":
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return itemDate >= monthAgo;
          case "year":
            const yearAgo = new Date(today);
            yearAgo.setFullYear(yearAgo.getFullYear() - 1);
            return itemDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    setFilteredItems(result);
  }, [items, filters]);

  function confirmDelete(id: string) {
    setDeleteModal({ isOpen: true, entryId: id });
  }

  async function handleDelete() {
    const id = deleteModal.entryId;
    if (!id) return;

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

      setToastType("success");
      setToastMessage("Entry deleted successfully");
    } catch (err: any) {
      setToastType("error");
      setToastMessage(err.message || "Failed to delete entry");
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

  // Get unique categories for filter
  const allCategories = Array.from(
    new Set(items.flatMap((item) => item.categories || []))
  ).sort();

  if (!items.length) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p className="text-sm">No entries yet</p>
        <p className="text-xs mt-1">Start writing to see your entries here</p>
      </div>
    );
  }

  // Format relative time
  function getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  // Get mood emoji
  function getMoodEmoji(mood: string): string {
    const emojiMap: Record<string, string> = {
      positive: "😊",
      neutral: "😐",
      negative: "😔",
    };
    return emojiMap[mood] || "😐";
  }

  return (
    <>
      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, entryId: null })}
        title="Delete Entry"
        message="Are you sure you want to delete this entry? This action cannot be undone."
        type="confirm"
        onConfirm={handleDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Search and Filter */}
      <SearchFilter onFilterChange={setFilters} categories={allCategories} />

      {/* Results count */}
      {filteredItems.length !== items.length && (
        <p className="text-sm text-gray-600">
          Showing {filteredItems.length} of {items.length} entries
        </p>
      )}

      {filteredItems.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          <p className="text-sm">No entries match your filters</p>
          <p className="text-xs mt-1">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredItems.map((e) => {
          const when =
            e.createdAt instanceof Date
              ? e.createdAt
              : new Date();
          const relativeTime = getRelativeTime(when);
          const fullDate = when.toLocaleString();

          return (
            <article
              key={e.id}
              className="group border border-gray-200 rounded-3xl p-6 transition-all hover:shadow-xl hover:border-gray-300 relative bg-white overflow-hidden"
            >
              {/* Decorative gradient bar on top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />

              {/* Header with date and delete button */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {e.moodLabel && (
                    <div className="text-2xl" title={`Mood: ${e.moodLabel}`}>
                      {getMoodEmoji(e.moodLabel)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900" title={fullDate}>
                      {relativeTime}
                    </p>
                    <p className="text-xs text-gray-500">{fullDate}</p>
                  </div>
                </div>
                <button
                  onClick={() => confirmDelete(e.id)}
                  disabled={deleting === e.id}
                  className="opacity-0 group-hover:opacity-100 transition-all text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg disabled:opacity-50"
                  title="Delete entry"
                >
                  {deleting === e.id ? (
                    <svg
                      className="animate-spin h-5 w-5"
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
                      className="h-5 w-5"
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

              {/* Categories Tags */}
              {e.categories && e.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {e.categories.map((category, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 text-xs rounded-full bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-semibold border border-purple-200 shadow-sm"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              )}

              {/* Entry Text */}
              <p className="text-gray-800 leading-relaxed mb-4 whitespace-pre-wrap">
                {e.text}
              </p>

              {/* Summary & Mood Info */}
              {(e.summary || e.moodLabel) && (
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                  {e.summary && (
                    <div className="mb-3">
                      <p className="text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                        <span>✍️</span> Summary
                      </p>
                      <p className="text-sm text-gray-800 italic">{e.summary}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    {e.moodLabel && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-700">Mood:</span>
                        <span className="px-2 py-1 rounded-full bg-white font-medium text-gray-900 capitalize border border-gray-200">
                          {e.moodLabel}
                          {typeof e.moodScore === "number" && ` ${e.moodScore}%`}
                        </span>
                      </div>
                    )}
                    {e.sentiment?.primary && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-gray-700">Sentiment:</span>
                        <span className="px-2 py-1 rounded-full bg-white font-medium text-gray-900 capitalize border border-gray-200">
                          {e.sentiment.primary}
                          {e.sentiment.secondary && ` + ${e.sentiment.secondary}`}
                        </span>
                      </div>
                    )}
                  </div>
                  {e.topics && e.topics.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">🏷️ Topics</p>
                      <div className="flex flex-wrap gap-1.5">
                        {e.topics.map((topic, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 text-xs rounded-lg bg-white text-gray-700 border border-gray-200"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Emotion Chart */}
              {e.emotions && <EmotionChart emotions={e.emotions} />}

              {/* Mood Music */}
              {e.moodLabel && typeof e.moodScore === "number" && (
                <MoodMusic mood={e.moodLabel} moodScore={e.moodScore} />
              )}

              {/* Entities Metadata */}
              {e.entities && (e.entities.people.length > 0 || e.entities.places.length > 0 || e.entities.events.length > 0) && (
                <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200">
                  <h4 className="text-xs font-bold text-blue-900 mb-3 flex items-center gap-1">
                    <span>📍</span> Mentioned
                  </h4>
                  <div className="space-y-2 text-xs">
                    {e.entities.people.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-blue-600 font-semibold min-w-[60px]">👥 People:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {e.entities.people.map((person, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded-lg bg-white text-blue-800 border border-blue-200 font-medium"
                            >
                              {person}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {e.entities.places.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-blue-600 font-semibold min-w-[60px]">📍 Places:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {e.entities.places.map((place, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded-lg bg-white text-blue-800 border border-blue-200 font-medium"
                            >
                              {place}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {e.entities.events.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-blue-600 font-semibold min-w-[60px]">🎯 Events:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {e.entities.events.map((event, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded-lg bg-white text-blue-800 border border-blue-200 font-medium"
                            >
                              {event}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </article>
          );
        })}
        </div>
      )}
    </>
  );
}
