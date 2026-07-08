# 🛡️ ShadowVault

**Premium Game Panels & Mod Marketplace with Secure Digital Delivery**

India's most premium digital delivery platform where users can purchase game panels, tools, configs, and premium files. After successful payment via Razorpay, purchased files become accessible only to the buyer through their account dashboard.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange) ![Tailwind](https://img.shields.io/badge/Tailwind-CSS_4-38bdf8) ![Razorpay](https://img.shields.io/badge/Payments-Razorpay-blue)

---

## ✨ Features

### 🛒 Marketplace
- **12 premium products** across 7 categories (Game Panels, Private Tools, Configs, Scripts, Utilities, Premium Files, Subscriptions)
- Live search with category filters and sorting (Popular, Newest, Price, Rating)
- Product detail modal with screenshot gallery, features, changelog, system requirements, and verified reviews
- 3D-hover product cards with badges (HOT, NEW, TRENDING, DEAL) and discount percentages
- Wishlist — save products for later, move to cart

### 💳 Payments & Checkout
- **Real Razorpay integration** (UPI, Card, Net Banking) with HMAC signature verification
- Demo/fallback mode when Razorpay keys aren't configured
- Working coupon system (WELCOME10, SHADOW20, FLAT200, GAMER500, FIRSTBUY)
- 18% GST calculation, discount application
- Instant order creation in database on payment success

### 🔐 Authentication
- **Real JWT auth** with bcrypt-hashed passwords (httpOnly cookies)
- Register / Login / Logout / Change Password
- Two-Factor Authentication (2FA) setup flow with OTP
- Role-based access: Customer vs Admin (admin gated behind secret access code)
- Session persists across refresh via `/api/auth/me`

### 👤 Customer Dashboard
- **Overview** — stats (products owned, total spent, downloads, wishlisted)
- **Downloads** — real file download for purchased products
- **Orders** — full order history with invoice download
- **Wishlist** — saved products, move to cart
- **Profile** — account details, Change Password, Enable 2FA

### 🛠️ Admin Console (secret code gated)
- **Overview** — revenue/orders/users analytics with Recharts (area, bar, pie charts)
- **Products** — Add Product (with file upload), Edit, Delete
- **Orders** — view, delete, search
- **Coupons** — create, delete, usage tracking
- **Users** — ban/unban (real status), reset password, search

### 🎨 Premium UI
- Dark gaming theme with aurora animated background
- Glassmorphism cards, neon glow effects, gradient borders
- Violet/Pink/Emerald/Amber/Cyan accent palette (no blue/indigo)
- Framer Motion animations, magnetic buttons, 3D hover cards
- Fully responsive (mobile-first) with sticky footer
- Loading screen with vault animation

### 📄 Legal
- Privacy Policy (DPDP Act 2023 compliant)
- Terms & Conditions (10 sections)
- **No Refund Policy** (digital products)

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Database** | Firebase Firestore |
| **Auth** | bcryptjs + jsonwebtoken (JWT) |
| **Payments** | Razorpay SDK |
| **Styling** | Tailwind CSS 4 + shadcn/ui |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **State** | Zustand (persisted) |
| **Icons** | Lucide React |

---

## 📦 Setup Guide

### Prerequisites
- Node.js 18+ / Bun
- A Firebase project (free tier works)

### 1. Install Dependencies

```bash
bun install
```

### 2. Configure Firebase Firestore

The app uses Firestore as its database. Follow these steps:

1. **Create a Firebase project** at https://console.firebase.google.com/
2. **Enable Firestore Database** (Build → Firestore Database → Create database)
3. **Generate a service account key**:
   - Project Settings → Service accounts → Generate new private key
   - A JSON file downloads with `project_id`, `client_email`, `private_key`
4. **Add to `.env`**:

```env
# Database (Firebase Firestore)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

# JWT secret (change in production!)
JWT_SECRET=your-super-secret-jwt-key

# Razorpay (test keys — replace with live keys in production)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

> 📖 Detailed setup guide: [`docs/FIRESTORE-SETUP.md`](docs/FIRESTORE-SETUP.md)

### 3. Seed the Database

```bash
bun run seed:firestore
```

This populates:
- 7 categories
- 12 products (with reviews)
- 5 coupons
- 8 users (bcrypt-hashed passwords)
- 4 sample orders

### 4. Run the App

```bash
bun run dev
```

Open http://localhost:3000 in your browser.

---

## 🔑 Demo Credentials

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Customer** | `demo@shadowvault.in` | `test1234` | Dashboard, purchases, downloads |
| **Admin** | `admin@shadowvault.in` | `admin123` | Admin Console (requires access code: `VAULT-ADMIN-2025`) |

> ⚠️ **Admin access is gated** behind a secret code to prevent unauthorized users from self-elevating. The code is entered via the "Admin access" link in the sign-in modal. Change `ADMIN_ACCESS_CODE` in `src/components/shadowvault/auth-modal.tsx` before production.

---

## 🗂️ Project Structure

```
shadowvault/
├── docs/
│   └── FIRESTORE-SETUP.md        # Firebase configuration guide
├── prisma/
│   ├── schema.prisma             # Legacy schema (for reference)
│   ├── seed.ts                   # Legacy SQLite seeder
│   └── seed-firestore.ts         # ✅ Firestore seeder (use this)
├── public/
│   ├── uploads/                  # Uploaded product files
│   └── logo.svg
├── src/
│   ├── app/
│   │   ├── api/                  # 19 API route handlers
│   │   │   ├── auth/             # register, login, me, logout, change-password
│   │   │   ├── products/         # CRUD + [id] (get/edit/delete)
│   │   │   ├── categories/       # list
│   │   │   ├── reviews/          # create
│   │   │   ├── orders/           # CRUD + [id]
│   │   │   ├── coupons/          # CRUD + [id] + validate
│   │   │   ├── users/            # list + [id] (ban/unban)
│   │   │   ├── razorpay/         # create-order, verify
│   │   │   └── upload/           # file upload
│   │   ├── globals.css           # Premium dark theme + animations
│   │   ├── layout.tsx            # Root layout (Sonner + Toaster)
│   │   └── page.tsx              # Single-page app (view switching)
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   └── shadowvault/          # App components
│   │       ├── admin-forms.tsx   # Add Product / Add Coupon modals
│   │       ├── auth-modal.tsx    # Login / Register / Admin access
│   │       ├── background.tsx    # Aurora animated background
│   │       ├── cart-drawer.tsx   # Cart with coupon validation
│   │       ├── checkout-modal.tsx# Razorpay payment flow
│   │       ├── dashboard.tsx     # Customer + Admin dashboards
│   │       ├── error-boundary.tsx
│   │       ├── faq.tsx
│   │       ├── features.tsx
│   │       ├── featured-products.tsx
│   │       ├── footer.tsx        # Connected footer (legal, categories)
│   │       ├── hero.tsx          # Animated stats + ticker
│   │       ├── legal-modal.tsx   # Privacy / Terms / Refund
│   │       ├── loading-screen.tsx
│   │       ├── marketplace.tsx   # Product grid with filters
│   │       ├── navbar.tsx        # Sticky nav + user menu
│   │       ├── newsletter.tsx
│   │       ├── product-card.tsx  # 3D-hover card
│   │       ├── product-modal.tsx # Product detail + reviews
│   │       └── testimonials.tsx
│   └── lib/
│       ├── auth.ts               # bcrypt + JWT + cookie helpers
│       ├── firebase.ts           # Firestore client (lazy init)
│       ├── firestore-helpers.ts  # Doc → API response transformers
│       ├── razorpay.ts           # Razorpay SDK singleton
│       ├── store.ts              # Zustand store (persisted)
│       ├── types.ts              # Shared TypeScript types
│       └── use-api.ts            # Data-fetching hook with cache
├── .env                          # Environment variables
└── package.json
```

---

## 📊 Database Collections (Firestore)

| Collection | Purpose | Key Fields |
|-----------|---------|------------|
| `users` | User accounts | name, email, password (bcrypt), role, banned, tier |
| `categories` | Product categories | name, slug, icon, color |
| `products` | Digital products | name, price, features[], screenshots[], telegramFileId |
| `reviews` | Product reviews | productId, userName, rating, comment, verified |
| `orders` | Purchase orders | orderNumber, customerEmail, items[], status, total |
| `coupons` | Discount codes | code, type, value, usageLimit, usedCount |

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create customer account |
| POST | `/api/auth/login` | Login (returns JWT cookie) |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Clear session |
| POST | `/api/auth/change-password` | Change password (verified) |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List (filter: category, type, q, sort, limit) |
| POST | `/api/products` | Create product (admin) |
| GET | `/api/products/[id]` | Get by ID or slug |
| PUT | `/api/products/[id]` | Update (admin) |
| DELETE | `/api/products/[id]` | Delete (admin) |

### Categories, Reviews, Coupons, Orders, Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | List categories |
| POST | `/api/reviews` | Create review |
| GET | `/api/coupons` | List coupons (admin) |
| POST | `/api/coupons` | Create coupon (admin) |
| DELETE | `/api/coupons/[id]` | Delete coupon (admin) |
| POST | `/api/coupons/validate` | Validate coupon code |
| GET | `/api/orders` | List orders (?email=) |
| POST | `/api/orders` | Create order |
| DELETE | `/api/orders/[id]` | Delete order (admin) |
| GET | `/api/users` | List users (admin) |
| PUT | `/api/users/[id]` | Ban/unban (admin) |
| DELETE | `/api/users/[id]` | Delete user (admin) |

### Payments & Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/razorpay/create-order` | Create Razorpay order |
| POST | `/api/razorpay/verify` | Verify signature + create order |
| POST | `/api/upload` | Upload product file (admin) |

---

## 💳 Coupon Codes (Demo)

| Code | Type | Value | Min Order |
|------|------|-------|-----------|
| `WELCOME10` | Percent | 10% off | ₹499 |
| `SHADOW20` | Percent | 20% off | ₹1,499 |
| `FLAT200` | Flat | ₹200 off | ₹999 |
| `GAMER500` | Flat | ₹500 off | ₹2,999 |
| `FIRSTBUY` | Percent | 15% off | ₹299 |

---

## 🛡️ Security Features

- **bcrypt** password hashing (10 rounds)
- **JWT** in httpOnly cookies (7-day expiry)
- **Razorpay HMAC** signature verification
- **Role-based access** — admin gated behind secret code
- **Banned users** cannot log in
- **File delivery** via short-lived tokens (no direct links exposed)
- **No card data stored** — Razorpay handles all payment info

---

## 📜 Scripts

```bash
bun run dev              # Start dev server (port 3000)
bun run lint             # Run ESLint
bun run seed:firestore   # Seed Firestore database
bun run build            # Production build
bun run db:push          # (Legacy) Push Prisma schema
```

---

## 🚦 Deployment

### Production Checklist
- [ ] Replace `JWT_SECRET` with a strong random string
- [ ] Change `ADMIN_ACCESS_CODE` in `auth-modal.tsx`
- [ ] Add real Razorpay **live keys** to `.env`
- [ ] Set Firestore **security rules** (restrict writes to authenticated users)
- [ ] Run `bun run seed:firestore` on a fresh database
- [ ] Configure custom domain in Firebase + Razorpay

### Firestore Security Rules (Production)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /orders/{orderId} {
      allow read: if request.auth != null;
      allow create: if true;
    }
    match /{document=**} {
      allow read, write: if isAdmin();
    }
    function isAdmin() {
      return request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

---

## ⚠️ Legal Disclaimer

ShadowVault sells **legitimate** game tools, configs, and utilities only. We do not condone cheating and are not liable for account bans resulting from misuse of purchased products. All products are for personal, non-commercial use. **All sales are final** — no refunds (see Refund Policy).

---

## 🇮🇳 Made in India

© ShadowVault Technologies Pvt. Ltd. · Built with ❤️ for Indian gamers.
