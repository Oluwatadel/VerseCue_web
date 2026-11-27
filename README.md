# verseVIO website

Next.js product, account, billing and support website for verseVIO Windows and its mobile remote. Documentation reviewed 27 November 2026. Repository folder names retain the legacy VerseCue name for compatibility.

## Run and validate

```powershell
npm ci
npm run dev
# Before publishing:
npm run build
```

Use `.env.example` as the configuration catalogue; copy it to ignored `.env.local` for local development. Never commit secrets. `npm run config:check` checks configuration without printing secret values. Public pages work without the account database; sign-in, billing and protected downloads require the configured backend.

## Website routes

- `/`: product overview, current desktop screenshot gallery and mobile remote introduction.
- `/features`: free presentation tools and optional AI assistance.
- `/download`: Windows availability and link to mobile downloads; macOS/Linux coming soon.
- `/remote`: Android APK availability, free/paid feature distinction, installation, QR pairing and troubleshooting. iPhone/iPad installation is coming soon.
- `/docs` and `/docs/[slug]`: operator guides; `/support`: assistant, troubleshooting and ticket entry points.
- `/pricing`, `/account`: plans, verified payment, account and desktop access management.
- `/releases`, `/about`: release information and product background.
- `/admin`: protected administration, analytics, users/organisations, subscriptions, support and email delivery.

The navigation, home page, Downloads and footer all link to Remote. No public installer asset URL is embedded in page markup.

## Downloads and release configuration

Sign in with a free account and complete the organisation profile to download. Both free and paid accounts can use mobile presentation control. AI transcription, detection, note generation and phone microphone input require paid or administrator-granted AI access on the desktop.

Configure on **Vercel**:

| Variable | Purpose |
| --- | --- |
| `WINDOWS_DOWNLOAD_URL` | Actual HTTPS Windows installer origin, also used for availability checks. |
| `MOBILE_ANDROID_DOWNLOAD_URL` | Actual HTTPS APK origin, also used for Android availability/metadata. |
| `DOWNLOAD_GATEWAY_URL` | Deployed HTTPS download Worker origin with trailing `/`. |
| `DOWNLOAD_GATEWAY_SECRET` | Same random secret (at least 32 characters) stored on the Worker. |
| `NEXT_PUBLIC_SITE_URL` | Public website origin for metadata and links. |

On the **download Worker**, configure `WEBSITE_URL`, both installer origin URLs and the matching secret. Deploy using `tools/download-gateway/wrangler.toml`. Read [protected download deployment and analytics](DOWNLOAD-GATEWAY-AND-ANALYTICS.md) for exact setup, private-origin limitations and authenticated updates. Redeploy after configuration changes. Missing installer URLs produce honest unavailable states rather than broken download links.

Windows uses `/api/download/windows`; Android uses `/api/download/mobile`. The account-checked route begins a short-lived, browser-bound gateway flow. Keep origin URLs server-side. A public GitHub release is still publicly accessible at its origin; an installer can also be copied after download.

Publish a new APK at an immutable origin and update `MOBILE_ANDROID_DOWNLOAD_URL` in Vercel and the Worker. `MOBILE_RELEASE_ID` can identify the release explicitly. Desktop download QR metadata refreshes periodically; it opens the account download page, not the pairing connection or origin asset. Do not confuse the download QR with the short-lived desktop pairing QR.

## Desktop account and AI access

One account covers the free workspace and all AI models. Desktop sign-in opens the website in the browser and synchronizes the account's paid or administrator-granted entitlement back to the desktop. Signing in alone does not purchase AI access. Computer limits and signed offline leases still apply. Revocation reaches an offline computer on reconnect or signed lease expiry, not instantly.

Keep existing production signing/model keys compatible with installed builds. Do not generate new keys merely to resolve a configuration error. See [desktop licensing and release setup](../VerseCue/docs/licensing-and-release.md) and [rollout](../VERSEVIO-ROLLOUT.md). Admin complimentary grants can cover approved users/organisations; use the admin controls and audit trail.

## Database and billing

```powershell
npm run db:migrate:check
npm run db:migrate
```

Use Node.js 20.12+ and the intended PostgreSQL `DATABASE_URL`; no local `psql` installation is required. Run **all current numbered migrations**, not only the first licensing migrations. The dry run validates statements locally; the real command changes the configured database. Configure hosting secrets separately.

- [Paystack, Resend, jobs and analytics](docs/billing-email-analytics.md)
- [Admin pricing](docs/admin-pricing.md)
- [Subscription lifecycle](docs/subscription-lifecycle.md)
- [Email templates](docs/email-templates.md) and [delivery troubleshooting](docs/email-troubleshooting.md)

Paystack access is granted only after server verification; webhook processing and subscription checks remain authoritative. Use test credentials for payment rehearsals. Email needs Resend credentials and a verified sending domain; queued messages are not proof of delivery.

## Support, reports and PWAs

[Support workflow](docs/support-workflow.md) covers account-owned complaints, assistant chat, ticket tracking, replies and admin notifications. Anonymous conversation is available, while account actions require sign-in. [Admin/Support PWAs](docs/admin-support-pwa.md) use existing authentication; private data remains network-only. No PWA-specific secret is required.

Tester audio/transcripts are saved locally for review and intentional sharing. Public screenshots and usage metrics must not contain private church recordings or account secrets. Downloads count authorised requests, not completed installations; random installation IDs estimate devices, not unique people. Client-reported tier is analytics, never an entitlement grant.

## Screenshots and product content

`app/components/DesktopWorkspace.tsx` presents real Avalonia captures from the 26 November local validation: Studio dashboard, preview highlighting and text/banner controls. `public/screenshots/studio-dashboard.png`, `preview-highlighting.png` and `text-banners.png` contain isolated demonstration data. Captures are clearly labelled development UI and may be newer than the published installer; they do not claim measured speech accuracy. The small test Bible library does not represent the bundled full library.

`lib/product.ts` and `lib/guides.ts` supply feature/guide copy. The home page includes `MobileRemote`; `/remote` and the Windows page reuse account-aware download controls. Current artwork is served by the shared Logo component (`public/versevio-*`); keep internal identifiers stable for existing installations.

## Checks

```powershell
npx tsc --noEmit
npm run test:downloads
npm run test:pwa
```

The focused browser check `node tools/check-product-pages.cjs` verifies the current gallery, Remote/download navigation, protected Android download handling and responsive widths. Set `VERSECUE_TEST_URL`, `PLAYWRIGHT_MODULE` and `PLAYWRIGHT_CHROMIUM_EXECUTABLE` when needed. The older `tools/verify-web.cjs` includes historical campaign/branding assertions and is not the current release acceptance suite.

Other `test:*` scripts in package.json cover licensing, billing, organisations, webhooks, email, support, installation analytics and updates. Browser capture is not physical Android/iPhone testing. This documentation update does not publish an APK, rebuild the Windows installer, migrate production or deploy the website.
