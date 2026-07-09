import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

/**
 * Firestore singleton.
 *
 * Initializes the Firebase Admin SDK from environment variables:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY  (the full PEM, including \n escapes)
 *
 * If the env vars are not yet configured (e.g. during local dev before the
 * user has added their Firebase service account), `db` will be null and a
 * clear error is thrown on first use so it's obvious what needs to happen.
 *
 * After initialization, use:
 *   import { db } from "@/lib/firebase";
 *   const snap = await db.collection("products").get();
 */

declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __shadowvault_firebase_app: admin.app.App | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var __shadowvault_firestore_db: admin.firestore.Firestore | undefined;
}

function init(): admin.firestore.Firestore {
  if (globalThis.__shadowvault_firestore_db) {
    return globalThis.__shadowvault_firestore_db;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY?.trim();

  const isConfigured = Boolean(
    projectId &&
      clientEmail &&
      privateKeyRaw &&
      privateKeyRaw.includes("BEGIN PRIVATE KEY") &&
      !privateKeyRaw.includes("REPLACE_WITH_YOUR_KEY")
  );

  if (!isConfigured) {
    throw new Error(
      "Firestore is not configured. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to your .env file. " +
        "Generate a service account key from Firebase Console → Project Settings → Service Accounts → Generate new private key."
    );
  }

  try {
    const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
    let app = globalThis.__shadowvault_firebase_app;

    if (!app) {
      const apps = admin.getApps();
      if (apps.length > 0) {
        app = admin.getApp();
      } else {
        app = admin.initializeApp({
          projectId,
          credential: admin.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      }
      globalThis.__shadowvault_firebase_app = app;
    }

    const db = getFirestore(app);
    db.settings({ preferRest: true });
    globalThis.__shadowvault_firestore_db = db;
    return db;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('Firebase app named "[DEFAULT]" already exists')
    ) {
      const app = admin.getApp();
      const db = getFirestore(app);
      db.settings({ preferRest: true });
      globalThis.__shadowvault_firebase_app = app;
      globalThis.__shadowvault_firestore_db = db;
      return db;
    }

    console.error("Firebase init failed:", error);
    throw error;
  }
}

/**
 * The Firestore database handle. Lazily initialized on first access so the
 * server doesn't crash at import time when credentials are missing — it only
 * errors when a route actually tries to use the DB.
 */
export const db = new Proxy({} as admin.firestore.Firestore, {
  get(_target, prop) {
    const fs = init();
    return (fs as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/** True if Firebase env vars look configured (for health checks). */
export function isFirestoreConfigured(): boolean {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  return (
    !!projectId &&
    !!clientEmail &&
    !!privateKey &&
    privateKey.includes("BEGIN PRIVATE KEY") &&
    !privateKey.includes("REPLACE_WITH_YOUR_KEY")
  );
}
