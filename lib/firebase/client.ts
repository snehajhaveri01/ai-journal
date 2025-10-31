// lib/firebase/client.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Log environment variables in development
if (process.env.NODE_ENV === "development") {
  console.log("Firebase Config:", {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.slice(0, 5) + "...",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

// Build Firebase config (values are statically inlined by Next.js on the client)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Validate after construction. Using direct properties avoids dynamic
// access like process.env["VAR"], which is undefined on the client.
for (const [key, value] of Object.entries(firebaseConfig)) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

// Log the config in development (but not the full API key)
if (process.env.NODE_ENV === "development") {
  console.log("Firebase Config being used:", {
    ...firebaseConfig,
    apiKey: firebaseConfig.apiKey?.slice(0, 8) + "...",
  });
}

// Initialize Firebase
let app;
try {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} catch (error) {
  console.error("Error initializing Firebase:", error);
  throw error;
}

export const auth = getAuth(app);
// Configure Google Sign-in
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export { googleProvider };
export const db = getFirestore(app);
export { app };
