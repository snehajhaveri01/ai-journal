/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/firebase/admin.ts
import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import fs from "node:fs";
import path from "node:path";

// Cache the singleton across hot reloads (Next.js dev)
declare global {
  var __FIREBASE_ADMIN_APP__: App | undefined;
}

function createAdminApp(): App {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Normalize private key: strip surrounding quotes and fix escaped newlines
  if (privateKey) {
    privateKey = privateKey.replace(/^"|"$/g, "").replace(/\\n/g, "\n");
  }

  // Preferred: env-based credentials (e.g., Vercel)
  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  // Fallback: local service account JSON for local dev/automation
  const serviceAccountPath = path.join(
    process.cwd(),
    "automation",
    "firebase-service.json"
  );

  try {
    const raw = fs.readFileSync(serviceAccountPath, "utf8");
    const serviceAccount = JSON.parse(raw);
    return initializeApp({
      credential: cert(serviceAccount),
    });
  } catch (e: any) {
    throw new Error(
      `Missing Firebase admin credentials. Either set FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY env vars, or put a service account at ${serviceAccountPath}. Original error: ${
        e?.message ?? e
      }`
    );
  }
}

const adminApp: App =
  global.__FIREBASE_ADMIN_APP__ ?? getApps()[0] ?? createAdminApp();

global.__FIREBASE_ADMIN_APP__ = adminApp;

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
