# Task 5-firestore-orders — firestore-orders agent work record

## Agent
firestore-orders

## Task
Migrate ShadowVault orders/coupons/users/razorpay API routes (and the order/coupon/user transforms) from Prisma/SQLite to Firebase Firestore. Preserve all frontend response shapes and status codes exactly.

## Context reviewed before starting
- `/home/z/my-project/worklog.md` (Tasks 1, 3a, 2-9, 10, 11, 12, 13, 14, 15, 16, 3-backend, 3-firestore-auth, 4-firestore-products)
- `/home/z/my-project/agent-ctx/3-firestore-auth-firestore-auth.md` — Firestore conventions from the auth migration (db Proxy, `firebase-admin/firestore` submodule imports, env-var gating, `users` collection shape, `hashPassword` import).
- `/home/z/my-project/agent-ctx/4-firestore-products-firestore-products.md` — Firestore conventions from the products migration (`FieldValue.increment`, equality-where + JS-sort to avoid composite indexes, `toISO` helper, `transformProduct`/`transformCategory`/`transformReview` patterns).
- `src/lib/firebase.ts` — `db` is a Proxy lazily exposing `admin.firestore.Firestore`. Use as `db.collection("orders").doc(id)` etc.
- `src/lib/firestore-helpers.ts` — `toISO`, `transformProduct`, `transformCategory`, `transformReview` already existed; I added `transformOrder`, `transformCoupon`, `transformUser`.
- `src/lib/types.ts` — Order/OrderItem/Coupon/CouponValidationResult shapes the frontend expects.
- `src/lib/auth.ts` — `hashPassword` (bcrypt) to import for PATCH password reset.
- `src/lib/razorpay.ts` — `razorpay` SDK singleton (no DB).
- Original Prisma-based route files (read FIRST to preserve response shapes):
  - `src/app/api/orders/route.ts` (GET list by email / recent; POST create)
  - `src/app/api/orders/[id]/route.ts` (PATCH status; DELETE)
  - `src/app/api/coupons/route.ts` (GET list; POST create with code uniqueness)
  - `src/app/api/coupons/[id]/route.ts` (DELETE)
  - `src/app/api/coupons/validate/route.ts` (POST validate {code, subtotal})
  - `src/app/api/users/route.ts` (GET list, password excluded)
  - `src/app/api/users/[id]/route.ts` (GET, PUT ban/unban, PATCH multi-field, DELETE)
  - `src/app/api/razorpay/create-order/route.ts` (imports razorpay from `@/lib/razorpay` — no DB; UNCHANGED)
  - `src/app/api/razorpay/verify/route.ts` (HMAC verify + demo-mode bypass + order creation)
- Frontend consumers (`dashboard.tsx`, `checkout-modal.tsx`, `cart-drawer.tsx`, `admin-forms.tsx`) — confirmed exact response shapes the frontend reads (e.g. `order.items` with `it.id` React key, `{ success: true, order }` from razorpay/verify, `{ data: { valid, discount, coupon? | message? } }` from coupons/validate).

## Files created/modified (9)

### 1. `src/lib/firestore-helpers.ts` (MODIFIED — added 3 transforms)
- `transformOrder(doc)`: returns `Order` with `id: doc.id`. Reads `items` as a NATIVE array. Each item normalized to `OrderItem` — synthetic `id` (`${orderId}-${idx}` when not stored) and `orderId` (= doc.id) so the frontend's React-key usage keeps working. `itemsJson` kept as a JSON string for backward compat (falls back to `JSON.stringify(items)` with `qty:1` snapshot if not stored). Dates → ISO via `toISO`. Numeric coercion is type-safe.
- `transformCoupon(doc)`: returns `Coupon` with `id: doc.id`. `maxDiscount` nullable. `active` coerced to boolean. Dates → ISO.
- `transformUser(doc)`: returns public user shape `{ id, name, email, role, banned, tier, orders, spent, createdAt }`. NEVER includes `password`.

### 2. `src/app/api/orders/route.ts` (REWRITTEN)
- **GET**: `?email=` filter via `.where("customerEmail","==",email).get()` + JS-sort by createdAt desc (avoids composite-index requirement). No params → `.orderBy("createdAt","desc").limit(50).get()` (single orderBy, no index needed). Returns `{ data: orders[] }`.
- **POST**: validates `{customerName, customerEmail, items[]}`. Fetches each product via `db.collection("products").doc(pid).get()` (Firestore has no `where id in [...]`). Builds `orderItemsData` with `productId/name/price/version/thumbnail`. Validates coupon if provided (`.where("code","==",code.toUpperCase()).limit(1).get()`). Computes `discount` (PERCENT: min(subtotal*value/100, maxDiscount); FLAT: min(value, subtotal); Math.floor). `total = Math.max(0, subtotal - discount)` — preserved EXACTLY from Prisma version (no server-side tax). Generates `SV-YYYY-NNNNN` orderNumber. Creates order via `db.collection("orders").add({ ...orderFields, items: orderItemsData, createdAt: new Date() })`. Atomically increments product `sales` via `FieldValue.increment(1)`. Atomically increments coupon `usedCount` if applied. Refetches and returns `{ data: transformOrder(...) }` with 201.

### 3. `src/app/api/orders/[id]/route.ts` (REWRITTEN)
- **PATCH**: `{ status }` body. 404 if doc missing. `doc(id).update({ status })`. Returns `{ data: { id, status } }` (matches Prisma version's response).
- **DELETE**: 404 if missing. Single `doc(id).delete()` removes items too (stored as native array, no cascade needed). Returns `{ ok: true }`.
- **GET** (added for parity): returns `{ data: transformOrder(snap) }` or 404.

### 4. `src/app/api/coupons/route.ts` (REWRITTEN)
- **GET**: `.orderBy("createdAt","desc").get()` (single orderBy, no index). Returns `{ data: coupons[] }`.
- **POST**: validates `{code, type, value}`. Type must be PERCENT|FLAT. Code uniqueness via `.where("code","==",code.toUpperCase()).limit(1).get()` → 409 if non-empty. Defaults: `usageLimit=100`, `expiry=1 year from now`, `usedCount=0`, `active=true`, `minAmount=0`, `maxDiscount=null`. Creates via `.add({...})`, refetches, returns `{ data: transformCoupon(snap), message: "Coupon created successfully" }` with 201.

### 5. `src/app/api/coupons/[id]/route.ts` (REWRITTEN)
- **DELETE**: 404 if missing. `doc(id).delete()`. Returns `{ ok: true }`.

### 6. `src/app/api/coupons/validate/route.ts` (REWRITTEN)
- **POST**: validates `{code, subtotal}`. Subtotal must be a non-negative number. Queries `.where("code","==",code).limit(1).get()`. Validation: `active`, `expiry >= now` (via `toISO`), `usedCount < usageLimit`, `subtotal >= minAmount`. Discount: PERCENT → `min(subtotal*value/100, maxDiscount)`; FLAT → `min(value, subtotal)`. `Math.floor(discount)`. Returns `{ data: { valid, discount, coupon } }` on success or `{ data: { valid: false, message } }` on any failure — EXACT same response shape as the Prisma version.

### 7. `src/app/api/users/route.ts` (REWRITTEN)
- **GET**: `.orderBy("createdAt","desc").get()` (single orderBy, no index). Returns `{ data: users[] }` via `transformUser` (passwords excluded).

### 8. `src/app/api/users/[id]/route.ts` (REWRITTEN)
- **GET**: `doc(id).get()` → 404 if missing. Returns `{ data: transformUser(snap) }`.
- **PUT**: `{ banned: boolean }` body. 400 if banned missing/non-boolean. 404 if missing. `doc(id).update({ banned })`. Refetches, returns `{ data: transformUser(snap) }`.
- **PATCH**: `{ password?, tier?, banned? }` body (banned kept for backward compat with admin dashboard). If password → `hashPassword(password)` (from `@/lib/auth`). If tier → write string. If banned → write boolean. 400 if no fields. 404 if missing. Update + refetch + return `{ data: transformUser(snap) }`.
- **DELETE**: 404 if missing. `doc(id).delete()`. Returns `{ ok: true }`.
- All 4 handlers `await params` (Next.js 16 Promise params).

### 9. `src/app/api/razorpay/verify/route.ts` (REWRITTEN)
- **POST**: preserves the EXACT demo-mode bypass logic from the Prisma version: `isDemoMode = razorpay_signature === "demo" || razorpay_payment_id.startsWith("pay_demo_")`. Non-demo path: HMAC SHA256 of `${razorpay_order_id}|${razorpay_payment_id}` with `RAZORPAY_KEY_SECRET` → 400 on mismatch, 500 if secret missing. On success: fetches products via `doc(pid).get()`, builds `orderItemsData`, validates coupon (same logic as orders POST), computes `computedTotal = max(0, subtotal-discount)`, `finalTotal = client-supplied total if valid else computedTotal` (preserves the client-tax-aware behavior). Creates order via `.add({...})` with items as native array. Atomically increments product sales + coupon usedCount. Returns `{ success: true, order: transformOrder(finalSnap) }`.

## Verified unchanged (1)
- `src/app/api/razorpay/create-order/route.ts` — only imports `razorpay` from `@/lib/razorpay`, no DB access. Left untouched per task spec.

## Decisions / non-breaking notes
- **No Prisma imports** remain anywhere in `src/app/api/`. Confirmed via grep: no file under `src/app/api/` imports `@/lib/db` or `@/lib/api` or uses `parseJsonArray`. The old `src/lib/db.ts` and `src/lib/api.ts` still exist on disk but are now safe to delete (no API route imports them).
- **Frontend response shapes preserved exactly** — `{ data }` / `{ data, message }` / `{ ok: true }` / `{ success: true, order }` / `{ error }` / status codes (200/201/400/404/409/500) all match the Prisma versions. No client-side changes required.
- **Firestore data model honored**:
  - `orders/{orderId}` — `items` stored as a NATIVE array of `{productId, name, price, version, thumbnail}` (NO separate `orderItems` collection). `itemsJson` also stored as a JSON string for backward compat. `createdAt` is a Firestore Timestamp (from `new Date()`). Document ID via `.add()` (auto-id).
  - `coupons/{couponId}` — flat fields, `expiry` and `createdAt` as Timestamps.
  - `users/{userId}` — `password` is a bcrypt hash (auth.ts handles register/login); admin routes here never read or return it.
- **Composite-index avoidance**: orders-by-email uses equality `where` + JS-sort (no index). All other queries use single `orderBy` with no `where` (no index). Coupon-by-code and coupon-uniqueness use equality `where` + `.limit(1)` (no index).
- **Atomic counters**: `FieldValue.increment(1)` from `firebase-admin/firestore` for product `sales` and coupon `usedCount`.
- **Tax calc**: preserved EXACTLY from Prisma version. The `POST /api/orders` route uses `total = max(0, subtotal - discount)` (no server-side tax). The `POST /api/razorpay/verify` route prefers client-supplied `total` (which includes the frontend's 18% display tax) when valid, falling back to `max(0, subtotal - discount)`.
- **TypeScript**: Used `import type { DocumentSnapshot } from "firebase-admin/firestore"` (existing pattern). No `admin.firestore.X` namespace access. No `any` types leaked into public transform signatures.
- **Next.js 16**: All dynamic-route handlers `await params`. All async handlers properly typed.

## Verification
- `bun run lint` — 0 errors, 1 pre-existing warning (unused eslint-disable directive in `src/lib/firebase.ts`, out of scope — same warning left by prior agents).
- `bunx tsc --noEmit` — 0 errors in any of the 9 files I touched. Pre-existing errors in `src/lib/firebase.ts` and `src/components/shadowvault/*` remain out of scope.
- Could not run live HTTP smoke tests because Firebase env vars (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`) are not configured in this sandbox. Routes will throw a clear "Firestore is not configured" error if hit without env — by design per `src/lib/firebase.ts`.
- Dev log shows stale Prisma queries from before this migration; the dev server will hot-reload the new Firestore-based code on the next request.

## Files now safe to delete
- `src/lib/db.ts` (Prisma client) — no longer imported by any API route.
- `src/lib/api.ts` (`parseJsonArray`) — no longer imported by any API route.
- (Confirm with whoever owns the rest of the codebase before deleting — non-API consumers may still import them.)
