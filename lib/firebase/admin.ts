/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/firebase/admin.ts
import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

declare global {
  var __FIREBASE_ADMIN_APP__: App | undefined;
}

function createAdminApp(): App {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("❌ Missing Firebase Admin environment variables");
  }

  // Strip potential escaped chars or wrapping
  privateKey = privateKey
    .replace(/\\n/g, "\n") // handle escaped \n from some shells
    .replace(/\r/g, "") // handle Windows line endings
    .replace(/^"|"$/g, ""); // remove surrounding quotes if any

  const valid =
    privateKey.includes("BEGIN PRIVATE KEY") &&
    privateKey.includes("END PRIVATE KEY");

  console.log("[Firebase Admin Init]", {
    projectId,
    clientEmail,
    privateKeyValid: valid,
  });

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });
}

const adminApp =
  global.__FIREBASE_ADMIN_APP__ ?? getApps()[0] ?? createAdminApp();
global.__FIREBASE_ADMIN_APP__ = adminApp;

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
