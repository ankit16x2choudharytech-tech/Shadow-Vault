# Task 3-backend — backend agent work record

## Agent
backend

## Task
Build real auth (bcrypt + JWT + httpOnly `sv_token` cookie), Razorpay SDK integration, and admin CRUD routes for ShadowVault.

## Context reviewed before starting
- `worklog.md` (Tasks 1, 3a, 2-9, 10, 11, 12, 13, 14, 15, 16)
- `prisma/schema.prisma` — User, Category, Product, Review, Order, OrderItem, Coupon
- `src/lib/db.ts` — shared Prisma client (`db`)
- `src/lib/api.ts` — `parseJsonArray`, `errorResponse`, `successResponse`
- `src/app/api/products/route.ts` — `transformProduct` pattern (copied)
- `src/app/api/products/[slug]/route.ts` — existing GET/PATCH/DELETE (consolidated into [id])
- `src/app/api/orders/route.ts` — existing order-creation logic (mirrored in /razorpay/verify)
- Existing demo-hash routes: `auth/register`, `auth/login`, `razorpay/create-order`, `razorpay/verify`
- Frontend callers: `auth-modal.tsx`, `checkout-modal.tsx`, `dashboard.tsx`, `admin-forms.tsx`, `product-modal.tsx`
- `.env` — `JWT_SECRET`, `RAZORPAY_KEY_ID` (rzp_test_…), `RAZORPAY_KEY_SECRET` all present.

## Files created (3)
1. `src/lib/auth.ts` — bcrypt hashPassword / verifyPassword, createToken (JWT 7d), getUserFromRequest (reads `sv_token` from request cookie header → verifies JWT → fetches User → null on missing/invalid/banned), setAuthCookie / clearAuthCookie (via `await cookies()` from next/headers, httpOnly, sameSite lax, path /, maxAge 7d).
2. `src/lib/razorpay.ts` — singleton `new Razorpay({ key_id: RAZORPAY_KEY_ID!, key_secret: RAZORPAY_KEY_SECRET! })`.
3. `src/app/api/products/[id]/route.ts` — GET (by id-or-slug, includes reviews, view-increment), PUT (per spec: subset update by id), PATCH (backwards-compat alias for admin-forms.tsx), DELETE (`{ ok: true }`, 404 if missing). Uses transformProduct pattern copied from `src/app/api/products/route.ts`.

## Files created (3 more)
4. `src/app/api/auth/me/route.ts` — GET. Returns 401 if not authenticated, else `{ user: { id, name, email, role, banned, tier } }`.
5. `src/app/api/auth/logout/route.ts` — POST. Clears `sv_token` cookie, returns `{ ok: true }`.

## Files updated (7)
6. `src/app/api/auth/register/route.ts` — POST. Validates name/email/password, email format, password ≥ 6 chars; 409 if email exists; bcrypt hash; create User (role "customer"); JWT + setAuthCookie; returns `{ user: { id, name, email, role } }`.
7. `src/app/api/auth/login/route.ts` — POST. Find by email (lowercased/trimmed). 401 "Invalid credentials" if not found or bcrypt verify fails. 403 "Your account has been banned" if banned. JWT + cookie + `{ user: {...} }`.
8. `src/app/api/razorpay/create-order/route.ts` — POST `{ amount }` (rupees). Validates positive number. `razorpay.orders.create({ amount: amount*100, currency: "INR", receipt: "rcpt_"+Date.now() })`. Returns `{ orderId, amount, currency, keyId: RAZORPAY_KEY_ID }`. try/catch → 500.
9. `src/app/api/razorpay/verify/route.ts` — POST `{ razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData: { customerName, customerEmail, items: [{productId}], couponCode?, total } }`. HMAC SHA256 verify of `order_id|payment_id` with RAZORPAY_KEY_SECRET. 400 on mismatch. On valid: creates Order (status PAID, paymentId = razorpay_payment_id), OrderItems, increments product.sales, increments coupon.usedCount if applied. Returns `{ success: true, order: {...} }`. Uses `parseJsonArray` from `@/lib/api` to serialize itemsJson back as an array.
10. `src/app/api/coupons/[id]/route.ts` — DELETE now returns `{ ok: true }` (was `{ message: "Coupon deleted" }`); adds 404 if not found.
11. `src/app/api/orders/[id]/route.ts` — DELETE returns `{ ok: true }` (was `{ message: "Order deleted" }`); adds 404 if not found. PATCH (status) preserved.
12. `src/app/api/users/[id]/route.ts` — added GET (single user, password excluded) and PUT (`{ banned: boolean }` per spec). Kept PATCH (frontend dashboard.tsx uses it) — upgraded password resets to use `hashPassword` from `@/lib/auth`. DELETE returns `{ ok: true }`.
13. `src/app/api/users/route.ts` — GET only (removed redundant POST that duplicated `/api/auth/register` with demo hashing). Returns `{ data: [{ id, name, email, role, banned, tier, orders, spent, createdAt }] }` with password excluded via Prisma select.

## Files deleted (1)
- `src/app/api/products/[slug]/` folder — consolidated into `[id]/` to avoid Next.js App Router's conflict between two dynamic segments at the same path level. The new [id] route accepts both id and slug (GET/PATCH/DELETE fall back to slug lookup), so existing frontend calls continue to work.

## Cache cleanup
- Removed `.next/dev/types/` — stale Next.js type validators still referenced the deleted `[slug]` route. Next.js regenerates these on the next dev start.

## Verification
- `bun run lint` — clean (no errors).
- `bunx tsc --noEmit` — no errors in any file under `src/app/api/**`, `src/lib/auth.ts`, or `src/lib/razorpay.ts`. (Pre-existing tsc errors in unrelated frontend components — `categories.tsx`, `dashboard.tsx`, `legal-modal.tsx`, `examples/*`, `skills/*` — are out of scope for this backend task.)
- Could not run live HTTP smoke tests — the dev server (`bun run dev`) is system-managed and was not running during this session. Lint + tsc are clean for all backend files.

## API contract changes the frontend must adopt (for the frontend agent)
| Endpoint | Old response | New response |
| --- | --- | --- |
| POST /api/auth/register | `{ data: { id, name, email, role } }` | `{ user: { id, name, email, role } }` |
| POST /api/auth/login | `{ data: { id, name, email, role } }` | `{ user: { id, name, email, role } }` |
| GET /api/auth/me | (didn't exist) | `{ user: { id, name, email, role, banned, tier } }` (401 if not authed) |
| POST /api/auth/logout | (didn't exist) | `{ ok: true }` |
| POST /api/razorpay/create-order | `{ demo, order, key_id }` | `{ orderId, amount, currency, keyId }` |
| POST /api/razorpay/verify | `{ verified, demo, payment_id }` (no order created) | `{ success: true, order: {...} }` — now creates the Order in DB itself. Body MUST include `orderData: { customerName, customerEmail, items: [{productId}], couponCode?, total }`. Frontend no longer needs to call POST /api/orders separately. |
| DELETE /api/products/[id] | `{ message: "Product deleted" }` | `{ ok: true }` |
| DELETE /api/coupons/[id] | `{ message: "Coupon deleted" }` | `{ ok: true }` |
| DELETE /api/orders/[id] | `{ message: "Order deleted" }` | `{ ok: true }` |
| DELETE /api/users/[id] | `{ message: "User deleted" }` | `{ ok: true }` |
| PUT /api/users/[id] | (didn't exist; PATCH was used) | `{ data: { id, name, email, role, banned, tier, orders, spent, createdAt } }` — body `{ banned: boolean }` |
| GET /api/users/[id] | (didn't exist) | `{ data: { id, name, email, role, banned, tier, orders, spent, createdAt } }` |
| POST /api/users | (existed, demo-hash) | REMOVED — use POST /api/auth/register instead |

## Notes / non-breaking decisions
- Kept PATCH on /api/products/[id] and /api/users/[id] for backwards compat (frontend currently calls PATCH). Added PUT per spec. The frontend can migrate to PUT gradually.
- `/api/products/[id]` GET falls back to slug lookup, so `product-modal.tsx`'s `/api/products/${product.slug}` GET calls still work.
- Passwords are now bcrypt-hashed on creation (register) and on admin reset (PATCH /api/users/[id] with password field). Pre-existing users created with the old demo `hash_<base64>` scheme will no longer be able to log in — they should re-register or have their password reset by an admin.
