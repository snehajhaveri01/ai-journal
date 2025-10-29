// lib/firebase/admin.ts
import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Cache the singleton across hot reloads (Next.js dev)
declare global {
  // eslint-disable-next-line no-var
  var __FIREBASE_ADMIN_APP__: App | undefined;
}

function createAdminApp(): App {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Normalize private key: remove surrounding quotes and fix \n
  if (privateKey) {
    privateKey = privateKey.replace(/^"|"$/g, "").replace(/\\n/g, "\n");
  }

  if (projectId && clientEmail && privateKey) {
    // Preferred: from environment variables (Vercel)
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  // Fallback: load local service account JSON (for local dev/automation)
  // Keep this file out of git (add to .gitignore).
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const serviceAccount = require("../../automation/firebase-service.json");
  return initializeApp({
    credential: cert(serviceAccount),
  });
}

const adminApp: App =
  global.__FIREBASE_ADMIN_APP__ ??
  (getApps().length ? getApps()[0]! : createAdminApp());

global.__FIREBASE_ADMIN_APP__ = adminApp;

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
