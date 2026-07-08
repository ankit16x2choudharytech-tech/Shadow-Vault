# Task 4-firestore-products — firestore-products agent work record

## Agent
firestore-products

## Task
Migrate the ShadowVault product/category/review API routes (and shared transforms) from Prisma/SQLite to Firebase Firestore. Preserve all frontend response shapes exactly. Create `src/lib/firestore-helpers.ts` with `toISO`/`transformProduct`/`transformCategory`/`transformReview`.

## Context reviewed before starting
- `/home/z/my-project/worklog.md` (Tasks 1, 3a, 2-9, 10, 11, 12, 13, 14, 15, 16, 3-backend, 3-firestore-auth)
- `/home/z/my-project/agent-ctx/3-firestore-auth-firestore-auth.md` — Firestore conventions from the auth migration (db Proxy, `firebase-admin/firestore` submodule imports, env-var gating).
- `src/lib/firebase.ts` — `db` is a Proxy lazily exposing `admin.firestore.Firestore`. Use as `db.collection("products").doc(id)` etc.
- `src/lib/types.ts` — Product/Category/Review shapes the frontend expects (arrays as `string[]`, dates as ISO strings).
- Original Prisma-based route files (read FIRST to preserve response shapes):
  - `src/app/api/products/route.ts` (GET list + POST create)
  - `src/app/api/products/[id]/route.ts` (GET/PUT/PATCH/DELETE with id-or-slug lookup)
  - `src/app/api/categories/route.ts` (GET list)
  - `src/app/api/reviews/route.ts` (POST create + recompute product rating)
- `src/lib/api.ts` (`parseJsonArray`) and `src/lib/db.ts` (Prisma) — being removed; must NOT import.

## Files created/modified (5)

### 1. `src/lib/firestore-helpers.ts` (NEW)
- `toISO(date)`: accepts Firestore Timestamp (`toDate()` / `toMillis()` / `{seconds}`), `Date`, or ISO string. Returns ISO string or null for null/unrecognized. Try/catch around `toDate`/`toMillis` for safety.
- `transformProduct(doc)`: takes a Firestore `DocumentSnapshot`, returns a `Product` with:
  - `id: doc.id` (from snapshot, not body)
  - All scalar fields with safe `?? ""` / `?? 0` defaults
  - `features` / `screenshots` / `whatsNew` / `requirements` kept as NATIVE arrays (`Array.isArray ? .map(String) : []`) — Firestore stores them natively, no JSON parsing
  - Dates (`releaseDate`, `createdAt`, `updatedAt`) → ISO strings via `toISO`
  - `originalPrice` / `badge` nullable
- `transformCategory(doc)`: returns `{ id, name, slug, icon, description, color, createdAt }`.
- `transformReview(doc)`: returns `{ id, productId, userName, userAvatar, rating, comment, verified, likes, date }`.
- Imports types from `firebase-admin/firestore` submodule (not `admin.firestore.X` namespace — that doesn't typecheck in firebase-admin v14).

### 2. `src/app/api/products/route.ts` (REWRITTEN)
- **GET**: equality-only where chain (`status=="ACTIVE"` + optional `category` + optional `type`). Fetches all matches, then:
  - JS-side filter by `q` (case-insensitive `.includes` on `name` + `tagline` + `description`).
  - JS-side sort by `sort` param (`popular`→sales desc, `newest`→releaseDate desc, `price-low`→price asc, `price-high`→price desc, `rating`→rating desc, default→createdAt desc). Avoids Firestore composite-index requirements for equality-where + orderBy-on-different-field.
  - JS-side `slice(0, limit)` if `limit` provided.
  - Returns `{ data: products[] }`.
- **POST**: validates `name`/`tagline`/`description`/`price`. Slug = `slugify(name)`; uniqueness check via `.where("slug","==",slug).limit(1).get()` → appends `-${random6}` if taken. Stores arrays natively (no `JSON.stringify`). Defaults: `releaseDate: new Date()`, `rating:0, sales:0, views:0, status:"ACTIVE"`, `createdAt: new Date()`, `updatedAt: new Date()`. Returns `{ data: product, message: "Product created successfully" }` with 201.

### 3. `src/app/api/products/[id]/route.ts` (REWRITTEN)
- `findProductDoc(value)`: `doc(value).get()` first (check `.exists`), then `.where("slug","==",value).limit(1).get()` fallback. Returns `DocumentSnapshot | null`.
- `fetchReviews(productId)`: tries `.where("productId","==",x).orderBy("date","desc").get()`; on composite-index failure falls back to equality-only query + JS sort by date desc.
- **GET**: resolves doc (id-or-slug), 404 if missing. Fire-and-forget `FieldValue.increment(1)` on `views` (atomic counter via `import { FieldValue } from "firebase-admin/firestore"`). Returns `{ data: product }` with `product.reviews` attached.
- **PUT**: resolves doc, parses body, builds `data` map of only-provided fields (scalars via `String()`/`Number()`, arrays via `Array.isArray ? .map(String) : []`, `originalPrice`/`badge` nullable). Always sets `data.updatedAt = new Date()`. If `data` only contains `updatedAt`, returns 400 "No fields to update". Updates doc, re-fetches, returns `{ data: product }` with reviews.
- **PATCH**: alias to PUT (`return PUT(request, ctx)`). Frontend admin edit form uses PATCH.
- **DELETE**: resolves doc, queries all reviews with `productId == doc.id`, batch-deletes them + the product doc atomically. Returns `{ ok: true }`.
- `params` is `await`ed (Next.js 16 — `params` is a Promise).

### 4. `src/app/api/categories/route.ts` (REWRITTEN)
- **GET**: `db.collection("categories").orderBy("createdAt","asc").get()` (single orderBy, no equality filter → no composite index needed). Returns `{ data: categories[] }`.

### 5. `src/app/api/reviews/route.ts` (REWRITTEN)
- **POST**: validates `productId`/`userName`/`rating`/`comment`. Validates `rating` is 1-5. Verifies product exists (`doc(productId).get()` → 404 if missing). Adds review with `{ productId, userName: String(userName).slice(0,60), userAvatar: null, rating: Math.round(ratingNum), comment: String(comment).slice(0,1000), verified: false, likes: 0, date: new Date() }`. Then recomputes product `rating` = avg of all review ratings (rounded to 1 decimal) and writes it back. Returns `{ data: review }` with 201.

## Decisions / non-breaking notes
- **No Prisma imports** remain in any of the 5 files. No `@/lib/db`, no `parseJsonArray`, no `@prisma/client`.
- **Frontend response shapes preserved exactly** — `{ data }` / `{ data, message }` / `{ ok: true }` / `{ error }` — no client-side changes required.
- **Firestore data model** honored:
  - `products/{id}` — arrays stored natively, dates as Firestore Timestamps (from `new Date()`), doc id = product id.
  - `categories/{id}` — straightforward.
  - `reviews/{id}` — flat collection with `productId` field (NOT a subcollection), per spec.
- **Composite-index avoidance**: All product-list queries use equality-only `where` clauses + JS-side sort. Review queries try `.orderBy` then fall back to equality-only + JS sort. Categories use a single `orderBy` with no `where` (no index needed).
- **Atomic view counter**: `FieldValue.increment(1)` from `firebase-admin/firestore` (NOT `admin.firestore.FieldValue` — that namespace access doesn't typecheck in firebase-admin v14).
- **TypeScript**: Used `import type { DocumentSnapshot } from "firebase-admin/firestore"` and `import { FieldValue, type DocumentSnapshot } from "firebase-admin/firestore"`. The `admin.firestore.X` namespace pattern used in `src/lib/firebase.ts` does NOT typecheck in v14 (pre-existing tsc errors there are out of scope, left as-is by the 3-firestore-auth agent).
- **Slug uniqueness** is query-then-insert (race-condition-acceptable for this marketplace scale).
- The old `src/lib/db.ts` (Prisma) and `src/lib/api.ts` (`parseJsonArray`) still exist on disk but are NOT imported by any product/category/review route. They will be removed once coupons/orders/users/razorpay routes are migrated (out of scope).

## Verification
- `bun run lint` — 0 errors, 1 pre-existing warning (unused eslint-disable directive in `src/lib/firebase.ts`, out of scope).
- `bunx tsc --noEmit` — 0 errors in any of the 5 files I touched. Pre-existing errors remain in `src/lib/firebase.ts`, `src/components/shadowvault/{categories,dashboard,legal-modal}.tsx`, `examples/`, `skills/` — all out of scope.
- Could not run live HTTP smoke tests because Firebase env vars (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) are not configured in this sandbox. Routes will throw a clear "Firestore is not configured" error if hit without env — by design per `src/lib/firebase.ts`.
- Dev log shows stale Prisma queries from before this migration; the dev server will hot-reload the new Firestore-based code on the next request.

## Files still pending Firestore migration (out of scope)
- `src/app/api/coupons/route.ts`, `src/app/api/coupons/[id]/route.ts`, `src/app/api/coupons/validate/route.ts`
- `src/app/api/orders/route.ts`, `src/app/api/orders/[id]/route.ts`
- `src/app/api/users/route.ts`, `src/app/api/users/[id]/route.ts`
- `src/app/api/razorpay/create-order/route.ts`, `src/app/api/razorpay/verify/route.ts`
- Once all routes are migrated, `src/lib/db.ts` and `src/lib/api.ts` can be deleted.
