# Admin pricing

Open **Admin → Pricing** (`/admin/pricing`). Set whole NGN amounts per computer per month for individual, 2–9 computer, exactly 10 computer and 11+ computer groups, separately for monthly, six-month and annual periods. The preview shows upfront totals. Only **Save prices** publishes changes; **Discard changes** restores the last saved values. Concurrent edits require reloading before overwriting another save.

Run `npm run db:migrate` on the configured database before deploying this change. Migration `010-admin-pricing.sql` adds persistent pricing (organisation monetary columns already support large totals). Existing rates remain the defaults until the first admin save. No new environment variables are needed.

Public prices load from `/api/pricing` without caching. Billing quotes and checkout use the same database rates. An outdated checkout quote is rejected before contacting Paystack; the account page refreshes rates for review. Existing pending orders can be resumed at their original price; they cannot be silently reused for a newly priced checkout. Existing paid periods and recurring subscriptions retain their agreed amounts. Rate changes do not reprice existing subscriptions. Provider plans for new recurring checkouts at custom prices are created and verified by the server. Default single-PC rates continue to use configured `PAYSTACK_PLAN_*` values.

Only authenticated administrators can read/write the pricing settings endpoint; writes additionally require a same-origin browser request. Public pricing returns no credentials or private account data. Database outages disable new checkout rather than silently substituting default prices. A website without DATABASE_URL can show default public preview prices but cannot charge.

Verification: `npm run test:pricing`, `npm run test:migrations`, existing billing/organisation/webhook regression suites, production build, and `node tools/check-pricing-ui.cjs` with Playwright configured. Browser/payment tests simulate provider responses and do not charge money.
