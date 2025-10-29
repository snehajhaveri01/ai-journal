"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

const PAYPAL_SUBSCRIBE_URL = process.env.NEXT_PUBLIC_PAYPAL_SUBSCRIBE_URL || ""; // Hosted subscription/checkout link (create in PayPal)

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (!u) {
        setIsPro(false);
        setLoading(false);
        return;
      }
      const snap = await getDoc(doc(db, "users", u.uid));
      setIsPro(Boolean(snap.data()?.isPro));
      setLoading(false);
    });
  }, []);

  const email = useMemo(() => user?.email ?? "—", [user]);

  if (loading) {
    return <main className="max-w-2xl mx-auto p-6">Loading…</main>;
  }

  if (!user) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-2 text-gray-600">
          You’re signed out. Please{" "}
          <Link className="underline" href="/journal">
            sign in
          </Link>{" "}
          to manage your plan.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="rounded-2xl border p-4">
        <p className="text-sm text-gray-500">Signed in as</p>
        <p className="font-medium">{email}</p>
      </section>

      <section className="rounded-2xl border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Plan</p>
            <p className="text-sm text-gray-500">
              {isPro
                ? "Pro — Unlimited entries, mood digest"
                : "Free — 3 entries/day"}
            </p>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              isPro
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {isPro ? "ACTIVE" : "FREE"}
          </span>
        </div>

        {!isPro && (
          <div className="flex flex-col gap-2 sm:flex-row">
            {PAYPAL_SUBSCRIBE_URL ? (
              <a
                href={PAYPAL_SUBSCRIBE_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-black text-white px-4 py-2"
              >
                Upgrade to Pro (PayPal)
              </a>
            ) : (
              <p className="text-sm text-amber-600">
                Set <code>NEXT_PUBLIC_PAYPAL_SUBSCRIBE_URL</code> to enable
                PayPal checkout.
              </p>
            )}

            <Link
              href="/journal"
              className="inline-flex items-center justify-center rounded-xl border px-4 py-2"
            >
              Back to Journal
            </Link>
          </div>
        )}

        {isPro && (
          <div className="text-sm text-gray-600">
            🎉 Thanks for supporting! Weekly mood digest is enabled.
          </div>
        )}
      </section>

      <section className="rounded-2xl border p-4">
        <p className="font-medium">Weekly Mood Digest</p>
        <p className="text-sm text-gray-500">
          Pro users receive a Sunday email with a 7-day summary of mood &
          themes.
        </p>
      </section>
    </main>
  );
}
