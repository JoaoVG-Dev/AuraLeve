# Neon Postgres setup

AuraLeve now uses Neon Postgres as the only application data store, including authentication, sessions, catalog, orders, and Mercado Pago payment state.

## Environment variables

Set these as server-only secrets:

- `DATABASE_URL`: Neon pooled connection string used by server functions in the Nitro/Vercel runtime.
- `DIRECT_DATABASE_URL`: Neon direct connection string used by local migration and seed scripts. Falls back to `DATABASE_URL` when omitted.
- `AUTH_SECRET`: strong server-only secret used to hash opaque session and reset tokens.
- `AUTH_COOKIE_NAME`: optional cookie name. Defaults to `auraleve_session`.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`: local seed values for the initial admin user. Never commit real values.
- `MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`: Mercado Pago server-only values.
- `MERCADO_PAGO_WEBHOOK_URL`: optional explicit webhook URL. If omitted, the server derives it from the current origin.

Set this public value for the checkout:

- `VITE_MP_PUBLIC_KEY`: Mercado Pago public key used by the browser SDK.

Do not create `VITE_DATABASE_URL` or expose Neon credentials to client bundles.

## Migrate and seed

After setting `.env.local`, run:

```bash
npm run db:migrate
npm run db:seed
```

The migrations create:

- enums: `app_role`, `coupon_type`, `order_status`, `payment_status`
- auth tables: `users`, `user_sessions`, `password_reset_tokens`
- commerce tables: `categories`, `subcategories`, `energies`, `products`, `product_energies`, `coupons`, `orders`, `order_items`
- indexes for auth lookup, catalog lookup, order lookup, coupon usage, and unique non-null Mercado Pago `payment_id`
- `touch_updated_at` triggers
- `place_order_for_user`, which validates cart items, locks stock, applies coupons, creates orders/items, decrements stock, and increments coupon usage in one transaction

The seed is idempotent. It loads sample catalog data and ensures the initial admin user from `.env.local`.

## Admin user

The admin user is created by `npm run db:seed` from:

```env
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="change-me"
ADMIN_NAME="AuraLeve Admin"
```

The password is hashed before it is stored. The seed refuses to use a missing password or the placeholder `change-me`.
Every `npm run db:seed` run refreshes the admin password and name from the current environment values, so update `ADMIN_PASSWORD` intentionally before rerunning it.

Admin checks read `public.users.role = 'admin'` through server functions. Disabled users cannot log in or access protected routes.

## Auth and sessions

Authentication is implemented server-side in `src/lib/auth`.

- Passwords use PBKDF2-SHA256 through Web Crypto.
- Login and signup create an opaque random session token.
- The raw token is stored only in an HTTP-only cookie.
- The database stores only `SHA-256(AUTH_SECRET:token)` in `public.user_sessions`.
- Cookies are `SameSite=Lax`, `HttpOnly`, and `Secure` in production.
- Password reset tokens are also opaque and stored hashed in `public.password_reset_tokens`.
- Reset tokens expire and are marked as used. Resetting a password invalidates previous sessions.

## Data ownership

Neon owns:

- login, signup, logout, password recovery/reset, and session validation
- customer profile data
- admin role checks
- catalog, categories, subcategories, and energies
- coupons
- orders and order items
- Mercado Pago payment state and webhook updates
