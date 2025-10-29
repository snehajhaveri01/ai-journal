"use client";

import Link from "next/link";

const PAYPAL_SUBSCRIBE_URL = process.env.NEXT_PUBLIC_PAYPAL_SUBSCRIBE_URL || "";

export default function Paywall({ onClose }: { onClose?: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="max-w-md w-full rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">
            You’ve hit today’s free limit
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Upgrade to <span className="font-medium">Pro</span> for{" "}
          <span className="whitespace-nowrap">unlimited entries</span> and
          weekly mood digests.
        </p>

        <ul className="mt-4 text-sm list-disc pl-5 space-y-1">
          <li>Unlimited daily entries</li>
          <li>AI mood insights + topics</li>
          <li>Weekly email digest</li>
        </ul>

        <div className="mt-5 flex gap-2">
          {PAYPAL_SUBSCRIBE_URL ? (
            <a
              href={PAYPAL_SUBSCRIBE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-black text-white px-4 py-2"
            >
              Upgrade (PayPal)
            </a>
          ) : (
            <Link
              href="/settings"
              className="inline-flex items-center justify-center rounded-xl bg-black text-white px-4 py-2"
            >
              Upgrade (Settings)
            </Link>
          )}
          <button onClick={onClose} className="rounded-xl border px-4 py-2">
            Not now
          </button>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          Free plan includes up to 3 entries per day.
        </p>
      </div>
    </div>
  );
}
