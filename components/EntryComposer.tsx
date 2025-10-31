/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import Toast from "./Toast";

export default function EntryComposer() {
  const [user, setUser] = useState<import("firebase/auth").User | null>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      console.log("👤 Auth state:", u?.email || "signed out");
      setUser(u);
    });
    return () => unsub();
  }, []);

  async function handleSignIn() {
    try {
      const provider = new GoogleAuthProvider();
      await setPersistence(auth, browserLocalPersistence);
      const res = await signInWithPopup(auth, provider);
      setUser(res.user);
      console.log("✅ Signed in as:", res.user.email);
    } catch (err) {
      console.error("Sign-in failed:", err);
      alert("Google sign-in failed.");
    }
  }

  const [showToast, setShowToast] = useState(false);

  async function handleSubmit() {
    if (!user) {
      setShowToast(true);
      return;
    }
    if (!text.trim()) return;

    setLoading(true);
    try {
      const idToken = await user.getIdToken(true);
      console.log(
        "📨 Sending token:",
        idToken ? idToken.slice(0, 40) + "..." : "NO TOKEN"
      );

      const res = await fetch("/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || `Request failed: ${res.status}`);

      console.log("✅ Entry saved:", data);
      setText("");
      setShowToast(true);
    } catch (e: any) {
      console.error("❌ Submission failed:", e);
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {showToast && (
        <Toast
          message="Entry saved successfully!"
          onClose={() => setShowToast(false)}
          type="success"
        />
      )}
      {!user ? (
        <button
          className="px-4 py-2 rounded bg-white/10"
          onClick={handleSignIn}
        >
          Sign in with Google
        </button>
      ) : (
        <div className="text-sm opacity-80">Signed in as {user.email}</div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full h-40 rounded bg-black/30 p-3"
        placeholder="Write your thoughts…"
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="px-4 py-2 rounded bg-white/10 disabled:opacity-50"
      >
        {loading ? "Summarizing…" : "Save & summarize"}
      </button>
    </div>
  );
}
