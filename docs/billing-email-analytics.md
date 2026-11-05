# Payments, emails and usage analytics

Sign-in remains required for download and desktop use, including the free tier.
Only AI transcription and automatic verse detection need an active AI entitlement.

## Plans

| Plan | Paid upfront | Equivalent monthly | Provider interval | API amount in kobo |
| --- | ---: | ---: | --- | ---: |
| Monthly | NGN 6,000 | NGN 6,000 | monthly | 600000 |
| Six months | NGN 33,000 | NGN 5,500 | biannually | 3300000 |
| Annual | NGN 60,000 | NGN 5,000 | annually | 6000000 |

One-time payment is the default. Auto-renew requires an explicit checkbox.
A six-month renewal charges NGN 33,000 every six months; it does not charge
NGN 5,500 each month. Annual renewal charges NGN 60,000 once each year.
Early renewal extends an existing finite expiry by 1, 6 or 12 calendar months.
An existing ongoing licence is retained rather than shortened by checkout.

## Configure Paystack

1. Complete the merchant onboarding/identity checks with Paystack. Starter
   accounts and registered businesses have different requirements. This is
   separate from VerseCue's own application licensing.
2. Set server-only `PAYSTACK_SECRET_KEY` and the correct HTTPS
   `NEXT_PUBLIC_SITE_URL` for this deployment. Never embed the secret in the
   desktop app or prefix it with NEXT_PUBLIC_.
3. Set the webhook URL in Paystack to:
   `https://YOUR-DOMAIN/api/billing/webhook`.
   Checkout sets its return URL to `/api/billing/callback` automatically.
4. For optional automatic renewal, create the three plans above in the Paystack
   dashboard and set their plan codes as `PAYSTACK_PLAN_MONTHLY`,
   `PAYSTACK_PLAN_SIX_MONTHS`, and `PAYSTACK_PLAN_ANNUAL`. Dashboard prices are
   in naira; the API amounts in the table are in kobo. The server fetches and
   checks each plan's currency, amount and interval before starting checkout.
5. Run `npm run db:migrate`, deploy/restart the website, and rebuild the desktop
   using the matching website URL and existing production signing/model keys.

Payment status, reference, amount, NGN currency, account email and provider
mode are verified server-side. Browser success parameters cannot activate AI.
Signed Paystack events and the browser return path share duplicate-safe crediting.
The database records each reference/transaction once. Concurrent retries never
extend access twice. Refund/dispute events can revoke the most recent paid AI
entitlement; free accounts stay available. Manage refund/dispute decisions in
Paystack. Revoking AI manually does not cancel a provider subscription: cancel
renewals separately in Paystack or the user's hosted subscription-management page.

Automatic renewals are processed by Paystack; its management link lets the user
update payment details or cancel. Cancellation preserves already paid time.
Failed renewal payments do not extend access. Paid access can also be checked
from Pending checkout if the browser return page was missed.

Production refuses test-mode payment activation. For local sandbox testing only,
use a test Paystack key and `BILLING_ALLOW_TEST_ACTIVATION=1` outside
NODE_ENV=production. Never use sandbox grants as real paid transactions.
No provider keys, merchant account or live checkout were provisioned by this code.

## Desktop handoff

The desktop's Activate AI button opens `/account/upgrade`. Its activation window
checks account entitlement every ten seconds. Once the backend confirms access,
a device-signed claim exchanges the free desktop session for an AI session and
a signed, device-bound lease. No second desktop password or activation code is
needed for a paid upgrade. The signed offline lease is capped at paid expiry and
at the normal offline grace (72 hours by default). A new launch also checks for
newly purchased access. Old installed builds need updating to use this flow.

## Resend email

Set `RESEND_API_KEY`, a sender on a verified domain in `EMAIL_FROM` (for example
`VerseCue <hello@your-domain>`), and optional `EMAIL_REPLY_TO`. A free-tier Resend
account has sending quotas; check the current plan before launch. Provider
verification/DNS setup is required; the code does not create a Resend account.

Welcome emails, payment receipts, password reset links, failed-renewal notices
and upcoming-expiry reminders use a persistent outbox. Delivery errors/quota
limits leave mail queued. Payment activation does not depend on email delivery.
Welcome messages are queued once and payment receipts use the payment reference
as the idempotency key. Sent message bodies are cleared. Password reset tokens
are hashed in the token table, expire after one hour, are single-use and revoke
existing website/desktop sessions. Reset links are never exposed in admin views.

Configure a daily HTTPS GET to `/api/jobs/daily` on the deployed website with
`Authorization: Bearer YOUR_CRON_SECRET`. Set `CRON_SECRET` to at least 32 random
characters in the host's secret store and use your hosting scheduler. This job
queues expiry reminders and retries mail. Admins can also retry queued mail at
`/admin/messages`. Invalid webhook signatures and job credentials are rejected.

## Analytics

`/admin/analytics` shows registered accounts, download requests, unique
downloaders, total app minutes, active app minutes, 30-day desktop users, UTC
daily totals and per-account counters. `/admin/payments` shows verified payments;
`/admin/messages` shows delivery status without message bodies or reset links.
Admin access uses the existing password/session protection.

Download counts describe requests for the installer redirect, not completed
file transfers or installs. Usage begins with an updated signed-in desktop;
historical usage is not reconstructed. The desktop samples five-second timer
intervals, ignores sleep/UI suspension gaps over 20 seconds, and separates total
workspace-open time from recent foreground interaction, transcription or live
presentation. Idle logo/projection screens can count as ongoing presentation
while Go Live is enabled. These are app-reported activity metrics, not billing
meters or tamper-proof time records.

Only per-minute running/active counters and device authentication are uploaded;
no audio, transcripts, slide content or verse content is included. Offline
counters are protected with Windows DPAPI and kept for up to 30 days, then synced
in bounded batches. Server upserts keep the maximum within each account/device
UTC minute, capped at 60 seconds, so retries or parallel app instances do not
multiply time. Analytics failures never interrupt church services or grant AI.
Sign-out/device reset can delay or prevent syncing an old offline queue. All-time
counters and recent daily data are aggregated independently of downloads to
avoid multiplying usage when an account downloaded more than once.

## Checks

- `npm run test:billing` -- simulated Paystack/Resend; no real charges or mail.
- `npm run test:licensing` -- account, entitlement, usage and reset checks.
- `npm run test:migrations` -- additive schema reruns preserve existing records.
- `tools/check-billing-analytics-ui.cjs` -- isolated browser checks at wide/mobile sizes.
- Desktop `tests/Versecue.AccountChecks` -- protected cache, offline counters and sign-out races.

Official references:
- https://paystack.com/docs/payments/verify-payments/
- https://paystack.com/docs/payments/subscriptions/
- https://paystack.com/docs/payments/webhooks/
- https://resend.com/pricing

## Organisations and computer pricing

The single-computer plans above are unchanged. For 2–9 computers, monthly
access is NGN 4,000 per PC; six- and twelve-month terms use NGN 3,500 per PC
per month, charged upfront. Exactly 10 computers uses NGN 4,000 per PC for
all terms. From 11 computers, NGN 3,500 per PC applies to all terms, with no
additional term discount. Two PCs therefore cost NGN 8,000 monthly,
NGN 42,000 for six months or NGN 84,000 annually. No quarterly term exists.
Unlimited computers can only be granted by an administrator.

The upgrade page quotes quantity server-side. Multi-PC recurring plans are
created and validated through Paystack, then cached by mode, term and quantity;
the three configured PAYSTACK_PLAN_* values remain for single-PC plans only.
Computer count cannot change during an active paid period through self-service:
contact support so existing paid time is not multiplied or lost. A late payment
conflicting with the current count is recorded as review and creates a high
priority support request without changing existing access. Admins can verify the
receipt in Paystack, adjust the organisation limit/paid expiry in Organisations,
and reply through Support. Refund decisions remain in Paystack.

Migrations 006 and 007 add organisation memberships, private invitations,
computer reservations and support conversations. All migrations are rerunnable.
Run `npm run db:migrate` before starting the updated website.

## Admin workspace and support

`/admin` is an overview with a shared sidebar: Analytics, Accounts & activation,
Organisations, Support requests, Payments, Email delivery and Historical waitlist.
Users submit and track requests at `/account/support`. Admins can set status,
priority and assignee, send public replies and keep internal notes. Internal
notes are excluded from user responses and email. Account/device/activation
controls and organisation adjustments are linked from each support request.

Create an organisation at `/admin/organisations`. Ongoing complimentary AI and
computer policy are separate settings: one PC per approved account, a shared
finite limit, or unlimited PCs. Only approved accounts receive access; the name
entered during signup is a profile field. New recipients get an email-bound,
single-use, 14-day invitation to redeem on their account page. Existing accounts
can be explicitly approved by the administrator. Paid multi-PC checkout creates
an owned organisation and approves its purchasing account automatically.

Each additional computer must prove its own RSA identity and reserve a place.
Registrations serialize on the organisation row before counting active computers;
concurrent requests cannot exceed the quota. The primary personal account binding
is retained. Releasing a computer signs out its sessions; removing a member
releases that member's organisation places. Personal account reset also releases
organisation places. Admin changes and support actions are audited. Saved AI
leases can remain usable until their offline expiry, normally at most 72 hours.

## Activation email delivery

Issuing an activation code queues its email in the same transaction. The admin
API attempts immediate delivery when Resend is configured and reports sent or
queued truthfully. Reissue cancels unsent old-code messages. Expired or revoked
codes are skipped during dispatch. Activation hashes remain in the licence table;
the pending outbox temporarily contains the code so it can be delivered, then
clears the body after successful sending. A grant to an existing account sends
an access notification instead of requiring a code. Paid upgrades activate from
verified entitlement automatically and email a receipt, with no manual code step.
Organisation invitations and public support updates also use the outbox. Keep
the daily job configured and use Email delivery to retry queued messages.

Run `npm run test:organisations` for pricing boundaries, explicit membership,
concurrent quotas, invitation ownership, multi-PC activation and support privacy.

## Webhook retry and ordering protection

Migration 008 adds a durable, mode-separated event ledger, payment reference
locks/reversal tombstones, subscription cancellation tombstones and unique
payment-review support keys. Apply it before deploying this handler.

Authenticated event payloads are canonicalised and fingerprinted. Completed
redeliveries return 200 without repeating processing. In-flight duplicates return
503 so Paystack retries rather than acknowledging unfinished work. Failed claims
remain visible and can retry immediately; abandoned claims can be reclaimed after
five minutes. A crash between a business commit and marking the event complete
is safe because business changes and email/support queues also deduplicate.
No webhook bodies or secret values appear in the admin delivery list.

Payment confirmation and reversals serialize on the reference and affected
account/organisation before updating access. Refunds/disputes change entitlement
only on the first transition from paid/review, retain newer entitlements and
never delete unrelated or newly created AI sessions. Refresh still verifies the
current entitlement; cached signed leases keep their normal offline expiry.
A reversal arriving before payment confirmation records a tombstone that prevents
later success notifications from activating that reversed transaction.

For each subscription code, supported lifecycle states advance from active to
not-renewing to disabled; old creation/cancellation events cannot move them back.
Cancellation before creation is retained. A fresh subscription code can be active.
Re-enabling the same cancelled code needs an explicit verified reconciliation
flow; replayed creation events intentionally do not reactivate it.

The upgrade UI explains Paystack-hosted checkout, account identity, upfront
amounts, optional renewals, current AI access and pending/refunded/disputed/review
states. Pending hosted checkout can be resumed only by its owner. After returning,
confirmation retries for up to approximately one minute; users can also check a
payment manually without paying again. The admin Payments page includes copyable
callback/webhook URLs, payment filters and delivery processing/retry status.
Actual hosted checkout branding is managed in the merchant Paystack account.

Run `npm run test:webhooks` and `tools/check-payment-flow-ui.cjs` for these paths.
Provider, browser and email tests simulate responses; they do not charge money.

## Finding and buying plans

Public pricing is available at `/pricing`, linked from navigation, the homepage
and footer. Individual and organisation choices show the existing approved
rates before sign-in. Plan and PC-count parameters survive login/registration;
return destinations and query values remain allowlisted.

The signed-in `/account` dashboard shows current access, expiry and computer
information. The account sidebar links to `/account/upgrade` for all checkout,
billing history and renewal controls, `/account/organisation`
for approved memberships and computer allocation, `/account/profile` for profile
and administrator-issued activation codes, and `/account/support` for help.
Organisation summaries disclose only owned or approved memberships, not member
emails or private organisation account IDs. Membership approval remains an admin
operation. Personal and organisation purchases use the same server-verified
checkout and payment crediting rules.

Checkout configuration errors do not hide the prices. Plans & billing explains
when the website operator has not enabled Paystack, or when activation is not
ready. Such conditions deliberately disable payment instead of charging without
being able to issue access. Set the existing PAYSTACK_SECRET_KEY and matching
activation configuration on the website host, then redeploy/restart. A local UI
change alone cannot update an already deployed website.

`tools/check-account-dashboard-ui.cjs` checks public discovery, signup/sign-in
return paths, centralised billing controls and dashboard layout at desktop/mobile
sizes using simulated account/payment APIs; it does not charge real money.

## Test Paystack on a deployed website or hosting preview

Use the **test** secret key from Paystack's Test mode dashboard and set these on
the website host, then redeploy (do not change NODE_ENV):

```
PAYSTACK_SECRET_KEY=sk_test_your_actual_test_secret
BILLING_ALLOW_TEST_CHECKOUT=1
BILLING_ALLOW_TEST_ACTIVATION=0
NEXT_PUBLIC_SITE_URL=https://your-preview-domain
```

Configure that preview's `/api/billing/callback` and `/api/billing/webhook` in
Paystack **Test mode**. Migration 009 must be applied before deploying this code.
Test payments use provider verification and duplicate protection, but are stored
with receipt status `test`. They do not create/extend personal licences or paid
organisation access, even if hosted using production activation keys/database.
The dashboard labels checkout as test mode and explains that successful test
payments do not activate live AI. Test receipt emails use the same explicit label.
An existing ongoing/live subscription does not stop sandbox-only checkout tests.

`BILLING_ALLOW_TEST_ACTIVATION=1` remains a separate, local-development-only option
for testing AI activation itself. It is ignored under NODE_ENV=production.

For launch: use the live `sk_live_` secret key, set BILLING_ALLOW_TEST_CHECKOUT=0,
and configure callback/webhook in Paystack Live mode. Single-PC recurring plans
must use plan codes from the same provider mode. Keep automatic renewal unchecked
when testing one-time checkout without recurring-plan setup.


Account dashboard layout: signed-in pages use a full-height account sidebar without the public website navigation or footer. Overview shows account/access summaries and the desktop download. Plans & billing is the sole checkout, renewal and payment-history workspace; Organisation handles membership and invitations; Profile & activation handles profile details and activation codes; Support handles conversations. Public pricing links preserve the selected plan and computer count through sign-in.
