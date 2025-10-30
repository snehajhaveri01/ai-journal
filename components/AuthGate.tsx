// components/AuthGate.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { auth as firebaseAuth } from "@/lib/firebase/client";

/**
 * AuthGate
 * - Use this in pages under /app/journal (or in journal/layout.tsx)
 * - Redirects to '/' if user is not signed in.
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Ensure Firebase is initialized
    const auth = firebaseAuth ?? getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // not signed in -> redirect to home or sign-in route
        router.replace("/");
      } else {
        setChecked(true);
      }
    });

    return () => unsub();
  }, [router]);

  // while we check auth state show nothing (or a spinner)
  if (!checked)
    return (
      <div className="h-64 flex items-center justify-center">
        Checking authentication…
      </div>
    );

  return <>{children}</>;
}
