# verseVIO website

A multi-page Next.js 14 product and support website for the VerseCue Windows desktop app, developed by Airis IT Consult.

## Run locally

```powershell
npm install
npm run dev
```

Production validation and local preview:

```powershell
npm run build
node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3087
```

## Public pages

- `/`: product overview, interactive demonstration and actual desktop screenshots. The first gallery view is the dashboard with illustrative live transcription, recent detections and a verse preview.
- `/features`: the full desktop feature overview.
- `/download`: Windows installer placeholder. macOS and Linux are marked coming soon.
- `/docs`: user-guide index, with six guides at `/docs/[slug]`.
- `/support`: troubleshooting links, FAQs, a local support-report builder and access to account support tickets.
- `/about`: product purpose and Airis IT Consult attribution.
- `/releases`: factual development notes and installer availability.

The website provides optional Paystack AI checkout after free account sign-in; there is no donation or waitlist campaign. The old `/waitlist` path redirects to Downloads. Existing waitlist records, APIs and password-protected administration are retained for historical access; this update does not delete user data or change a hosted database.

## Download and support configuration

Copy `.env.example` to `.env.local` when configuring the site:

- `WINDOWS_DOWNLOAD_URL`: add the official HTTPS Windows installer URL when ready. Without it, Downloads shows an explicitly disabled placeholder. No ZIP or installer was packaged by this update.
- `NEXT_PUBLIC_SUPPORT_EMAIL`: official public support contact. Without it, the support page clearly says the contact channel has not been published.
- `NEXT_PUBLIC_SITE_URL`: canonical URL for page metadata and the sitemap.

Rebuild and redeploy the site after changing public download/contact configuration so static pages pick up the new values.

The report builder prepares text locally for users to copy. It does not pretend to create a ticket, email a message, upload recordings, or store reports. A future support backend can replace this step when a real delivery/storage channel is configured.

Legacy administration uses `DATABASE_URL`, `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`. These are not needed to view the public website. Login fails closed when secrets are absent. The existing waitlist helper uses Neon Postgres; it does not use a local JSON fallback.

## Product facts and branding

`lib/product.ts` and `lib/guides.ts` contain public product information checked against the desktop source. Do not add unapproved pricing, recognition guarantees or unreleased features. Screenshots contain demonstration content, not measured speech-accuracy results.

The approved full logo is `../VerseCue/logo/vercue_logo.png`. `../VerseCue/tools/update_brand_assets.py` copies the artwork unchanged into desktop/web assets and generates required icon dimensions. The white background is preserved. Airis IT Consult branding is separate.

`public/screenshots/` contains captures of the real Avalonia controls. The desktop UI-check harness can reproduce the full dashboard capture with `--capture-dashboard`; its isolated services do not record audio or open a real projector.

## Browser verification

`tools/verify-web.cjs` uses Playwright to verify all public pages and guides at desktop, 390px and 320px widths; gallery/demo behavior; current logo assets; honest download placeholders; local support reports; navigation/404s; and protected legacy administration. Set `PLAYWRIGHT_MODULE` and optionally `PLAYWRIGHT_CHROMIUM_EXECUTABLE` when using an existing external Playwright/browser installation. Review artifacts are ignored by Git.

## Accounts and desktop activation

`/account/login` and `/account` provide account sign-in/status. `/admin/licenses` issues email-specific activation codes, blocks accounts, revokes licences and resets bound computers. `/admin/waitlist` retains historical waitlist administration. Paystack checkout is implemented for optional AI access; provider setup is required before live use.

Apply `db/001-licensing.sql` and `db/002-complimentary-access.sql` to PostgreSQL before enabling these features. Configure the server-only activation and model-key variables in `.env.example`, then pin the matching public key and HTTPS backend origin in the protected desktop build. Missing configuration fails closed. Public product pages still work without a database. `npm run test:licensing` runs the local PostgreSQL-compatible activation checks without a live database.

See [desktop licensing and release setup](../VerseCue/docs/licensing-and-release.md) for deployment, key handling, device reset, offline expiry and protected build instructions. Licence revocation takes effect on reconnect or at offline lease expiry; an offline desktop cannot receive immediate remote revocation. Installer packaging and the public Windows download URL remain pending.

### Free desktop and optional AI activation

The desktop opens without account activation. Bible lookup, projection, songs, slides and video are free. `/account/activate` creates an AI account with an administrator-issued email-specific code; existing accounts redeem codes via `/api/account/activate`. Website activation does not bind the browser computer. The first desktop sign-in binds one computer atomically and issues a signed AI-only lease. Renewal preserves that binding. Expiry/revocation/sign-out stop AI while leaving the free workspace available. The nullable device fields in `001-licensing.sql` represent online activation awaiting desktop sign-in. `002-complimentary-access.sql` adds the recorded access type for complimentary grants.

### Admin complimentary AI access

At `/admin/licenses`, select **Complimentary AI access**, enter the recipient email, optionally set expiry, then click **Grant complimentary AI access**. Blank expiry grants ongoing entitlement; signed offline leases still renew normally. Existing active accounts receive the entitlement directly, retaining the registered computer. For new emails, privately share the single-use activation code so the recipient can create their AI account online. Blocked accounts must be unblocked first. Grants are labelled in the admin/user views and recorded as `grant-complimentary` audit events. Ordinary users cannot grant themselves complimentary access. Existing reset/revoke/offline-grace rules still apply. Apply the additive `db/002-complimentary-access.sql` migration before deploying this change.

## Run database migrations from VS Code

No PostgreSQL command-line installation is needed. Use Node.js 20.12 or newer.
Open a terminal in this website folder, create `.env.local` and add your own
Neon connection string as `DATABASE_URL`. The file is ignored by Git.
An existing terminal `DATABASE_URL` takes precedence over `.env.local`.

```powershell
npm install
npm run db:migrate:check
npm run db:migrate
```

The dry run only checks the local migration statements; it does not connect to
a database. The real command applies `001-licensing.sql` followed by
`002-complimentary-access.sql` in one transaction. Both are additive and may
be rerun without deleting accounts or licences. Connection strings and secret
values are not printed. Deployment still requires configuring environment
variables on your host; this command only sets up the selected database.

### Diagnose account-service configuration

Run `npm run config:check` from the website folder. It checks `.env.local`
(or existing terminal variables) without printing secret values or connecting
to a database. Replace placeholder `DATABASE_URL` text with your actual Neon
PostgreSQL connection string, configure the admin and production signing/model
keys, run `npm run db:migrate`, then restart the website. A hosted deployment
needs the same variables in its hosting environment and a redeploy.

## Free accounts, downloads and AI

Apply migration `003-free-accounts.sql` (included in `npm run db:migrate`).
Create a free account at `/account/register` with email, organisation name and
password; activation codes and AI signing keys are not needed for registration.
Existing accounts can add their organisation name on `/account`. The download
button uses `/api/download/windows`, which authenticates the website session,
requires an organisation name and records a download request before redirecting.
Set server-only `WINDOWS_DOWNLOAD_URL` when the installer is published. No installer
has been created or uploaded. The download host itself must control access if
shared direct links also need to be prevented.

AI activation is a separate action on `/account`; it still requires configured
production signing/model keys. `npm run config:activation` loads existing matching
production key files from the sibling desktop `.security/production` folder into
ignored `.env.local`; it never generates replacement keys or prints key values.
Hosted environments require setting these values in their secret store and a
restart/redeploy. The admin password and session secret remain separate settings.

The protected desktop requires account sign-in before opening the free workspace.
Saved free access is protected with Windows DPAPI and expires after 30 days;
AI access uses a separate signed lease with the existing default 72-hour grace.
A free session never contains model keys. Account and AI sign-ins must use the
same email. AI revocation keeps free account and download access; blocking the
account or resetting its computer invalidates account sessions. Debug builds
retain the explicit development bypass. Rebuild the installer input to include
this new sign-in flow; older installed builds do not change automatically.

## Billing, email and analytics

See [payments, email and analytics setup](docs/billing-email-analytics.md) for the
approved prices, optional auto-renewal, Paystack webhooks, Resend, scheduled jobs
and usage-counter definitions. Apply all migrations with `npm run db:migrate`.
Admin pages: `/admin/analytics`, `/admin/payments`, `/admin/messages`.
Signing in remains required for all users, including the free tier.


### Dashboard reports and mobile remote

The admin overview and analytics pages use a classic white-and-blue workspace with a 30-day synced-usage chart, subscription distribution and searchable account tables. Account reports include registration, first/latest installer request, plan, access status and expiry countdown. Counts are built from aggregated downloads/usage and the applicable personal or approved organisation entitlement; a request does not prove installation completed. Free accounts have no subscription expiry. This reporting update needs no new migration. Run `npm run test:reporting` for database-backed fixture checks.

The separate `../versecue-remote` project contains the native Android/iPhone controller. Desktop pairing is under Preferences → Mobile remote. See that project's README and `../VerseCue/docs/mobile-remote.md` for local-network pairing, encrypted session details, build/signing and physical-device release checks. The website has not been deployed by these changes.

## Reviewed speech-test reports

Optional desktop recordings can be reviewed and explicitly shared with administrators. See [setup, storage and retention](TEST-REPORTS.md) before enabling audio uploads.

## verseVIO rebrand and browser desktop sign-in

Apply migration 015 with npm run db:migrate before deploying the updated desktop/browser flow. Configure MOBILE_ANDROID_DOWNLOAD_URL after publishing the APK; downloads and LAN control require active paid or complimentary access. Keep production signing/model keys and actual deployment origin stable. See ../VERSEVIO-ROLLOUT.md.

## Transcript notes — next desktop update (18 November 2026)

The website overview, feature catalogue, FAQ, download information, release notes and `/docs/transcript-notes` describe the saved-transcript notes workflow. The local LLM organizes source-grounded excerpts into an editable draft. Optional instructions guide selection and grouping (400 characters). Generation requires existing paid/admin AI access and paused capture. Editing and export remain available without paid AI. PDF and Word (.docx) exports include formatted headings and export date/time; Markdown and text remain available. No online conversion or Office installation is required. The source transcript is preserved.

The previously packaged Windows installer does not yet contain these changes. Website source has been updated locally, not deployed. Desktop implementation details: `../VerseCue/docs/TRANSCRIPT-NOTES.md`.

## Support desk

`/account/support` lets signed-in users submit complaints with category, app version, platform and reproduction steps, follow the conversation, reopen a resolved issue by replying and rate a resolution. `/admin/support` provides queue counts, a paginated table, search by reference/subject/email/church/assignee, status/category/priority/date filters, assignment, public replies, private investigation notes, resolution summary and timestamp, and customer feedback. Dates in filters use database UTC calendar days. User-facing email notifications use the existing outbox and Resend delivery worker; dashboard conversations work even while email is unconfigured. Email acceptance is not guaranteed delivery. Text only; recordings continue through the separate reviewed Test reports workflow. No automatic log upload occurs.

Before deploying this update, run `npm run db:migrate` against the intended database to apply additive migration **018-support-workflow.sql**. Then deploy the website and package the matching desktop to expose its Support sidebar button. Existing accounts/authentication and `DATABASE_URL` are reused; no new secret is required. Use existing `RESEND_API_KEY`, verified `EMAIL_FROM` and email worker configuration for notifications. Tests: `npm run test:support`, `npm run test:organisations`, `npm run test:migrations`.

### Support chat

Public/account pages include an automated, curated support guide. Guests can converse without logging in or uploading their chat. Signed-in users can explicitly submit a complaint, optionally attach a reviewed conversation, and follow its ticket link for human replies. Chat messages are not sent to a hosted LLM and are not stored until submission. No new AI secret or migration is needed. See `docs/support-workflow.md`.

Support notifications: configure server-only `SUPPORT_NOTIFICATION_EMAIL` on the host. New complaints/customer replies queue a private admin email and attempt delivery through existing Resend settings. Customers can read and reply to ticket conversations inside the on-page chat (10-second active-page refresh), independently of email. WhatsApp is documented as a future alternative and is not connected. Support uses migration 018; the shared HTML email templates additionally require migration 019.

## Email templates and ticket tracking

Welcome, support acknowledgement/review and admin notifications now use shared verseVIO HTML templates with plain-text alternatives. Apply migration 019 before deployment. See `docs/email-templates.md` for sender/reply settings, previews and stable retry behavior. Dashboard complaints and chatbot complaints share account-owned tickets, tracking links, status history and support-chat access.

The Downloads & installations report now validates filters and identifies missing migration 017, read-permission failures and connectivity errors instead of reporting an unrelated activation failure. Its totals follow the chosen filters. This does not apply production migrations automatically; run `npm run db:migrate` against the intended database before deployment.

## Installable Admin / Support PWAs

Admin and customer Support can be installed as separate standalone web apps from `/admin/support` and `/account/support`. Existing sign-in is required; private data remains network-only, with a generic offline screen and explicit update/reload controls. See `docs/admin-support-pwa.md`. No new secret or PWA-specific migration is required. Test with `npm run test:pwa`. Push notifications and physical-phone installation testing are not included.
