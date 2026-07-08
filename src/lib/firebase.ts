import admin from "firebase-admin";

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

let app: admin.app.App | null = null;
let firestore: admin.firestore.Firestore | null = null;

function init(): admin.firestore.Firestore {
  if (firestore) return firestore;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  // Detect placeholder/missing credentials.
  const isConfigured =
    !!projectId &&
    !!clientEmail &&
    !!privateKeyRaw &&
    !projectId.startsWith("shadowvault-demo") === false
      ? !!privateKeyRaw &&
        privateKeyRaw.includes("BEGIN PRIVATE KEY") &&
        !privateKeyRaw.includes("REPLACE_WITH_YOUR_KEY")
      : !!projectId && !!clientEmail && !!privateKeyRaw;

  if (!isConfigured) {
    throw new Error(
      "Firestore is not configured. Add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to your .env file. " +
        "Generate a service account key from Firebase Console → Project Settings → Service Accounts → Generate new private key."
    );
  }

  // The private key in env often has literal "\n" — convert to real newlines.
  const privateKey = privateKeyRaw!.replace(/\\n/g, "\n");

  if (!admin.apps.length) {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else {
    app = admin.app();
  }

  firestore = app.firestore();
  // Prefer newer REST transport to avoid gRPC native-binary issues.
  firestore.settings({ preferRest: true });
  return firestore;
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
