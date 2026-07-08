# ShadowVault — Firestore Setup Guide

The database has been migrated from SQLite (Prisma) to **Firebase Firestore**.
Follow these steps to get the app running.

## 1. Create a Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **Add project** → name it (e.g. `shadowvault`) → continue.

## 2. Enable Firestore Database

1. In your Firebase console, open **Build → Firestore Database**.
2. Click **Create database** → start in **production mode** (or test mode).
3. Choose a location near you (e.g. `asia-south1` Mumbai).

## 3. Generate a Service Account Key

1. Go to **Project Settings** (gear icon) → **Service accounts** tab.
2. Click **Generate new private key** → confirm. A JSON file downloads.
3. Open the JSON file — copy `project_id`, `client_email`, and `private_key`.

## 4. Add Credentials to `.env`

Open `/home/z/my-project/.env` and replace the placeholder values:

```env
FIREBASE_PROJECT_ID=shadowvault-xxxxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@shadowvault-xxxxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

> **Note:** Keep the quotes around `FIREBASE_PRIVATE_KEY`. The `\n` escapes
> are required — copy them exactly as they appear in the JSON file.

## 5. Seed the Database

```bash
bun run seed:firestore
```

You should see:
```
✅ Firestore seed complete!
   Categories: 7 | Products: 12
   Coupons: 5 | Users: 8
🔑 Login credentials:
   Customer: demo@shadowvault.in / test1234
   Admin:    admin@shadowvault.in / admin123 (code: VAULT-ADMIN-2025)
```

## 6. Run the App

```bash
bun run dev
```

The app is now fully backed by Firestore.

## Collections

| Collection   | Documents                                      |
|--------------|------------------------------------------------|
| `users`      | name, email, password (bcrypt), role, banned   |
| `categories` | name, slug, icon, description, color           |
| `products`   | full product data with native arrays           |
| `reviews`    | productId, userName, rating, comment           |
| `orders`     | orderNumber, customer, items (array), status   |
| `coupons`    | code, type, value, usage stats                 |

## Troubleshooting

**"Firestore is not configured"** — Your `.env` values are still placeholders.

**Permission denied** — Set Firestore rules to allow read/write for dev:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
