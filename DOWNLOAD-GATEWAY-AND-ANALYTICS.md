# Protected downloads and analytics

The website still requires an account and organisation name to request an installer. Remote presentation control is free; AI transcription, automatic detection and Phone microphone require Pro or an administrator grant.

## Deployment

1. Run `npm run db:migrate` against the website database. Migration 017 adds platform-specific download dates and pseudonymous installation/usage counters. Existing account and subscription records stay intact.
2. Deploy `tools/download-gateway/worker.mjs` as a Cloudflare Worker. Use a download hostname you control, such as `downloads.your-domain.com` (a workers.dev hostname also works for initial testing).
3. Set Worker variables `WEBSITE_URL` to the website HTTPS origin, `WINDOWS_DOWNLOAD_URL` and `MOBILE_ANDROID_DOWNLOAD_URL` to the real installer assets. Configure the same installer URLs on Vercel so availability and QR metadata remain current.
4. Generate a new random secret of at least 32 characters for **DOWNLOAD_GATEWAY_SECRET**. Store it as a secret on both Vercel and the Worker. This is separate from all licence/model/update signing keys; do not rotate those existing production keys.
5. Set **DOWNLOAD_GATEWAY_URL** on Vercel to the gateway HTTPS origin with a trailing slash. Redeploy website and Worker. No deployment has been performed by this code change.
6. Windows download links use `/api/download/windows`; Android links use `/api/download/mobile`. The gateway creates a browser nonce, the website verifies the account, and a signed, short-lived grant is bound to the browser's HttpOnly cookie. A copied URL alone cannot download. Range requests support resume. Download dates count authorised requests, not completed transfers.
7. For future protected Windows updates, sign the desktop manifest with an installer URL `https://YOUR-WEBSITE/api/download/update/verseVIO-Setup.exe`. The updated desktop obtains a short-lived download credential through its existing account session. The credential is sent in an HTTP header, never in the installer URL. Older desktop updaters do not support this authentication, so distribute this native upgrade through the account download page first.

Use immutable installer origin URLs for releases. Avoid replacing a binary while clients are downloading it. Existing signed update hashes still reject mismatched assets. When publishing a new native APK, update MOBILE_ANDROID_DOWNLOAD_URL; even if using a stable latest URL, metadata checks upstream ETag/Last-Modified and refreshes the desktop download QR every ten minutes. MOBILE_RELEASE_ID may explicitly identify a release if the origin does not provide change headers. The QR points to the account download page, never to the source asset.

Vercel's function duration makes a 1.3 GB installer proxy unsuitable for slow connections. The Worker streams the upstream response without buffering the installer. Hosting quotas still apply. A public GitHub release remains public if someone discovers its origin URL; private object storage or a private authenticated origin is necessary to enforce access at the source too. An installer can always be copied after it is downloaded.

## Analytics and privacy

Admin → Analytics includes filterable installation and download tables (date, email, organisation, ID and platform), plus Windows/Android download totals and dates. Signed-in sessions can associate desktop installation counts with an account. Otherwise a random installation ID estimates devices, never unique people. Reinstalls/profile changes may produce new IDs. Free/paid installation status is explicitly **client reported**; billing/licensing records remain authoritative.

Both apps expose a usage-sharing toggle. Desktop changes require Save; mobile changes apply immediately. Heartbeats include only random installation ID, platform, public version, reported free/paid tier and app running time. They do not contain audio, transcripts, displayed verses or file paths. Existing authenticated desktop usage sync remains available. Anonymous heartbeats are best-effort, deduplicated per installation/minute and rate limited; offline time may be absent. They are not proof of a download or a completed installation. Apply a hosting rate-limit rule to POST /api/analytics/installation before public release; client-controlled IDs cannot provide fraud-proof analytics.

Visible version is 1.0.0. Windows internal assembly/file version remains 1.2.7.0 so existing installations can update; Android internal build is 8, and the native-compatible OTA runtime is 1.0.0-native8. Keep these internal values increasing for future native builds. Do not publish JS updates for native8 to older native runtimes.
