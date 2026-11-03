# VerseCue website

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
- `/support`: troubleshooting links, FAQs and a local support-report builder.
- `/about`: product purpose and Airis IT Consult attribution.
- `/releases`: factual development notes and installer availability.

The public website has no payment, donation, checkout or waitlist flow. The old `/waitlist` path redirects to Downloads. Existing waitlist records, APIs and password-protected administration are retained for historical access; this update does not delete user data or change a hosted database.

## Download and support configuration

Copy `.env.example` to `.env.local` when configuring the site:

- `NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL`: add the official HTTPS Windows installer URL when ready. Without it, Downloads shows an explicitly disabled placeholder. No ZIP or installer was packaged by this update.
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

`/account/login` and `/account` provide account sign-in/status. `/admin/licenses` issues email-specific activation codes, blocks accounts, revokes licences and resets bound computers. `/admin/waitlist` retains historical waitlist administration. No payment integration is included.

Apply `db/001-licensing.sql` and `db/002-complimentary-access.sql` to PostgreSQL before enabling these features. Configure the server-only activation and model-key variables in `.env.example`, then pin the matching public key and HTTPS backend origin in the protected desktop build. Missing configuration fails closed. Public product pages still work without a database. `npm run test:licensing` runs the local PostgreSQL-compatible activation checks without a live database.

See [desktop licensing and release setup](../VerseCue/docs/licensing-and-release.md) for deployment, key handling, device reset, offline expiry and protected build instructions. Licence revocation takes effect on reconnect or at offline lease expiry; an offline desktop cannot receive immediate remote revocation. Installer packaging and the public Windows download URL remain pending.

### Free desktop and optional AI activation

The desktop opens without account activation. Bible lookup, projection, songs, slides and video are free. `/account/activate` creates an AI account with an administrator-issued email-specific code; existing accounts redeem codes via `/api/account/activate`. Website activation does not bind the browser computer. The first desktop sign-in binds one computer atomically and issues a signed AI-only lease. Renewal preserves that binding. Expiry/revocation/sign-out stop AI while leaving the free workspace available. The nullable device fields in `001-licensing.sql` represent online activation awaiting desktop sign-in. `002-complimentary-access.sql` adds the recorded access type for complimentary grants.

### Admin complimentary AI access

At `/admin/licenses`, select **Complimentary AI access**, enter the recipient email, optionally set expiry, then click **Grant complimentary AI access**. Blank expiry grants ongoing entitlement; signed offline leases still renew normally. Existing active accounts receive the entitlement directly, retaining the registered computer. For new emails, privately share the single-use activation code so the recipient can create their AI account online. Blocked accounts must be unblocked first. Grants are labelled in the admin/user views and recorded as `grant-complimentary` audit events. Ordinary users cannot grant themselves complimentary access. Existing reset/revoke/offline-grace rules still apply. Apply the additive `db/002-complimentary-access.sql` migration before deploying this change.
