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
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import AuthGate from "@/components/AuthGate";
import Link from "next/link";

interface Goal {
  id: string;
  title: string;
  description: string;
  targetDate: Date;
  progress: number;
  status: "active" | "completed" | "abandoned";
  createdAt: Date;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(collection(db, "goals"), where("uid", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const goalsData: Goal[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || "",
          description: data.description || "",
          targetDate: data.targetDate?.toDate() || new Date(),
          progress: data.progress || 0,
          status: data.status || "active",
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      });
      setGoals(goalsData.sort((a, b) => a.targetDate.getTime() - b.targetDate.getTime()));
    });

    return () => unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !targetDate) return;

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Please sign in");

      await addDoc(collection(db, "goals"), {
        uid: user.uid,
        title: title.trim(),
        description: description.trim(),
        targetDate: Timestamp.fromDate(new Date(targetDate)),
        progress: 0,
        status: "active",
        createdAt: Timestamp.now(),
      });

      setTitle("");
      setDescription("");
      setTargetDate("");
      setShowForm(false);
    } catch (error) {
      alert("Failed to create goal");
    } finally {
      setLoading(false);
    }
  }

  async function updateProgress(id: string, progress: number) {
    try {
      const goalRef = doc(db, "goals", id);
      await updateDoc(goalRef, {
        progress,
        status: progress >= 100 ? "completed" : "active",
      });
    } catch (error) {
      console.error("Failed to update progress", error);
    }
  }

  async function deleteGoal(id: string) {
    if (!confirm("Are you sure you want to delete this goal?")) return;
    try {
      await deleteDoc(doc(db, "goals", id));
    } catch (error) {
      alert("Failed to delete goal");
    }
  }

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  return (
    <AuthGate>
      <main className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Goals</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 rounded-xl bg-black text-white hover:bg-gray-800 transition-all"
            >
              {showForm ? "Cancel" : "+ New Goal"}
            </button>
            <Link
              href="/journal"
              className="px-4 py-2 text-sm rounded-xl border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              ← Back to Journal
            </Link>
          </div>
        </div>

        {/* Create Goal Form */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-8 p-6 rounded-2xl border-2 border-purple-200 bg-purple-50"
          >
            <h2 className="text-xl font-semibold mb-4">Create New Goal</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Exercise 3 times a week"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add more details about your goal..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Date *
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-all font-semibold"
              >
                {loading ? "Creating..." : "Create Goal"}
              </button>
            </div>
          </form>
        )}

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Active Goals ({activeGoals.length})</h2>
            <div className="space-y-4">
              {activeGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onUpdateProgress={updateProgress}
                  onDelete={deleteGoal}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Completed Goals ({completedGoals.length})</h2>
            <div className="space-y-4 opacity-75">
              {completedGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onUpdateProgress={updateProgress}
                  onDelete={deleteGoal}
                />
              ))}
            </div>
          </div>
        )}

        {goals.length === 0 && !showForm && (
          <div className="text-center p-12 text-gray-500">
            <p className="text-lg mb-2">No goals yet</p>
            <p className="text-sm">Create your first goal to start tracking your progress</p>
          </div>
        )}
      </main>
    </AuthGate>
  );
}

function GoalCard({
  goal,
  onUpdateProgress,
  onDelete,
}: {
  goal: Goal;
  onUpdateProgress: (id: string, progress: number) => void;
  onDelete: (id: string) => void;
}) {
  const daysUntilTarget = Math.ceil(
    (goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  const isOverdue = daysUntilTarget < 0;
  const isCompleted = goal.status === "completed";

  return (
    <div className="p-6 rounded-2xl border border-gray-200 bg-white hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${isCompleted ? "line-through text-gray-500" : ""}`}>
            {goal.title}
          </h3>
          {goal.description && (
            <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
          )}
        </div>
        <button
          onClick={() => onDelete(goal.id)}
          className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-all"
          title="Delete goal"
        >
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
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium">Progress</span>
          <span className={`font-bold ${isCompleted ? "text-green-600" : "text-gray-900"}`}>
            {goal.progress}%
          </span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isCompleted ? "bg-green-500" : "bg-purple-600"
            }`}
            style={{ width: `${goal.progress}%` }}
          />
        </div>
      </div>

      {/* Update Progress */}
      {!isCompleted && (
        <div className="flex items-center gap-2 mb-4">
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={goal.progress}
            onChange={(e) => onUpdateProgress(goal.id, parseInt(e.target.value))}
            className="flex-1"
          />
        </div>
      )}

      {/* Target Date */}
      <div className="flex items-center gap-2 text-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className={isOverdue ? "text-red-600 font-semibold" : "text-gray-600"}>
          {isCompleted
            ? `Completed ${goal.targetDate.toLocaleDateString()}`
            : isOverdue
            ? `Overdue by ${Math.abs(daysUntilTarget)} days`
            : `${daysUntilTarget} days left (${goal.targetDate.toLocaleDateString()})`}
        </span>
      </div>
    </div>
  );
}
