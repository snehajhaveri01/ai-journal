"use client";
import { useEffect, useState } from "react";
import { auth, googleProvider } from "@/lib/firebase/client";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(
    () =>
      onAuthStateChanged(auth, (u) => {
        setUser(u);
        setReady(true);
      }),
    []
  );
  if (!ready) return <div className="p-6">Loading…</div>;

  if (!user) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <button
          onClick={() => signInWithPopup(auth, googleProvider)}
          className="px-4 py-2 rounded-xl bg-black text-white"
        >
          Continue with Google
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center p-4">
        <p className="text-sm text-gray-500">Signed in as {user.email}</p>
        <button onClick={() => signOut(auth)} className="text-sm underline">
          Sign out
        </button>
      </div>
      {children}
    </div>
  );
}
