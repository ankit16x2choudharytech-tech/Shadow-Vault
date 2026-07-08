# Task 3-firestore-auth — firestore-auth agent work record

## Agent
firestore-auth

## Task
Migrate the ShadowVault auth layer (src/lib/auth.ts + 5 routes under /api/auth) from Prisma/SQLite to Firebase Firestore. Preserve all frontend response shapes / status codes / cookie logic exactly.

## Context reviewed before starting
- `/home/z/my-project/worklog.md` (Tasks 1, 3a, 2-9, 10, 11, 12, 13, 14, 15, 16, 3-backend)
- `/home/z/my-project/agent-ctx/3-backend-backend.md` — original Prisma-based auth implementation
- `src/lib/firebase.ts` — `db` is a Proxy lazily exposing `admin.firestore.Firestore`. Use as `db.collection("users").doc(id)` etc.
- `src/lib/auth.ts` (original) — bcrypt + JWT + cookie logic to preserve
- All 5 original auth route files (register, login, me, logout, change-password) — read first to preserve response shapes

## Files modified (5)
1. `src/lib/auth.ts`
   - Switched `import { db } from "@/lib/db"` -> `import { db } from "@/lib/firebase"`.
   - `hashPassword`, `verifyPassword`, `createToken`, `AuthenticatedUser`, `setAuthCookie`, `clearAuthCookie`, `parseCookieValue`, `COOKIE_NAME`, `COOKIE_MAX_AGE`, `getJwtSecret` — UNCHANGED.
   - `getUserFromRequest`: now uses `db.collection("users").doc(payload.userId).get()`. Returns null if doc doesn't exist or `banned === true`. Returns `{ id: userDoc.id, name, email, role, banned }` with safe defaults.

2. `src/app/api/auth/register/route.ts`
   - Email-uniqueness: `db.collection("users").where("email","==",trimmedEmail).limit(1).get()` -> 409 if non-empty.
   - User creation: `db.collection("users").add({ name, email, password: hashed, role:"customer", banned:false, tier:"Standard", orders:0, spent:0, createdAt: new Date() })` -> uses `ref.id`.
   - JWT signed with `ref.id`. Response shape `{ user: { id, name, email, role } }` (status 201) — UNCHANGED.

3. `src/app/api/auth/login/route.ts`
   - Query: `db.collection("users").where("email","==",trimmedEmail).limit(1).get()`.
   - 401 "Invalid credentials" if empty or bcrypt verify fails. 403 "Your account has been banned" if banned. Body's `role` field is intentionally ignored (documented inline with `void`).
   - Response shape `{ user: { id, name, email, role } }` — UNCHANGED.

4. `src/app/api/auth/me/route.ts`
   - `getUserFromRequest` -> 401 if null. Then fresh `db.collection("users").doc(authUser.id).get()` to read latest `tier`.
   - Response shape `{ user: { id, name, email, role, banned, tier } }` — UNCHANGED.

5. `src/app/api/auth/change-password/route.ts`
   - `import { db } from "@/lib/firebase"` (was `@/lib/db`).
   - Fetches full doc via `db.collection("users").doc(user.id).get()` -> 404 if missing.
   - `verifyPassword(currentPassword, dbUser.password)` -> 403 on mismatch.
   - Validates `newPassword.length >= 6` (400).
   - `hashPassword(newPassword)` -> `userDocRef.update({ password: hashed })`.
   - Response `{ success: true }` — UNCHANGED.

## File verified clean (1)
- `src/app/api/auth/logout/route.ts` — already Prisma-free (no db import). Left untouched. Clears `sv_token` cookie, returns `{ ok: true }`.

## Decisions / non-breaking notes
- All frontend response shapes and status codes preserved exactly — no client-side changes required.
- The `users` collection document shape matches the spec: `{ name, email, password, role, banned, tier, orders, spent, createdAt }`. `createdAt` is stored as `new Date()` (Firestore auto-converts JS Date to Timestamp).
- Document IDs use Firestore auto-IDs (via `.add()`). The JWT `userId` payload now stores the Firestore doc ID.
- Email uniqueness is enforced via query-then-insert (not a unique constraint). Race conditions on simultaneous identical-email registrations are theoretically possible but acceptable for this marketplace scale.
- No Prisma imports remain in any auth file. No `@/lib/db` imports remain in any auth file.
- Other routes (products, categories, coupons, orders, users, reviews, razorpay) still use Prisma — out of scope for this task; will be migrated separately.

## Verification
- `bun run lint` — clean (0 errors, 0 warnings in my files). Only pre-existing warning is the unused `@typescript-eslint/no-explicit-any` disable directive in `src/lib/firebase.ts`, which is out of scope.
- `bunx tsc --noEmit` — no errors in any auth file.
- Could not run live HTTP smoke tests because Firebase env vars (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) are not configured in this sandbox. Routes will throw a clear "Firestore is not configured" error if hit without env — this is by design per `src/lib/firebase.ts`.
