# VerseCue Web
Next.js marketing + waitlist site.

Run:
npm install
npm run dev

# VerseCue Web
Next.js marketing + waitlist site. Developed and powered by Airis IT Consult.

Run:
npm install
npm run dev

## Structure
- `app/components/` — Navbar, Hero, Features, HowItWorks, Waitlist, Support, Footer, Logo
- `app/admin/` — waitlist dashboard (`/admin`) and login (`/admin/login`)
- `app/api/waitlist/` — public waitlist signup (POST)
- `app/api/admin/` — admin login/logout/waitlist-read, protected by `middleware.ts`
- `lib/waitlist-store.ts` — shared read/write helpers for `data/waitlist.json`
- `lib/admin-auth.ts` — signed session cookie helpers for the admin gate

## Waitlist data
Waitlist submissions are stored in `data/waitlist.json` for local/demo use.
For production/serverless hosting, replace this with a persistent database such as Postgres/Supabase
(serverless filesystems are typically read-only or ephemeral).

## Environment variables
Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_DONATION_URL` — donation/payment page (Paystack, Stripe Payment Link, etc.). If unset, the
  online donate button is hidden; the Moniepoint bank-transfer details in the Support section are always shown.
- `NEXT_PUBLIC_SITE_URL` — canonical site URL used in Open Graph metadata.
- `ADMIN_PASSWORD` / `ADMIN_SESSION_SECRET` — required to enable `/admin`. If either is unset, admin login
  is disabled (fails closed).

## Admin dashboard
`/admin` lists waitlist signups (search, total count, responsive table/card views). It's gated by a single
shared password (`ADMIN_PASSWORD`) behind a signed, httpOnly session cookie — enough to keep the waitlist
data out of casual/unauthenticated reach for an MVP, but **not a full auth system** (no user accounts, no
login rate limiting). Replace with a proper auth provider (NextAuth, Clerk, etc.) before handling real
production traffic or sensitive data at scale.

