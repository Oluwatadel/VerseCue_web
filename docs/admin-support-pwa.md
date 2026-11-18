# Admin and Support PWAs

Two separate installable web apps use the existing website, with no app-store build:

- **verseVIO Admin**: manifest `/pwa/admin.webmanifest`, stable ID `/pwa/admin`, scope `/admin`, starts at `/admin/support`.
- **verseVIO Support**: manifest `/pwa/support.webmanifest`, stable ID `/pwa/support`, scope `/account`, starts at `/account/support`.

Both have standalone display, branded PNG icons, maskable artwork, iOS home-screen metadata and responsive existing workspace navigation. The Support app is the customer account/ticket workspace, not the native mobile presentation remote. Admin staff still sign in through the normal admin session. Installing a PWA never grants account or administrator privileges.

## Install

Deploy the website over HTTPS. Open Admin → Support or Account → Support in a supporting browser. Use Install app when the browser offers the prompt, or How to install. Chrome/Edge offer installation from the browser menu. On iPhone/iPad use Safari → Share → Add to Home Screen, enabling Open as Web App when offered. Browser/version/platform policies control availability. Local development does not register the workers; production builds on secure localhost can be used for browser testing.

## Network and privacy

Separate scoped workers use only two cached public assets: the generic offline screen and its icon. Protected HTML, React server-component payloads, API replies, messages, payments, account details and POST actions are never cached by these workers. Authenticated routes/APIs also declare no-store HTTP headers. No offline writes are queued. The offline screen says to reconnect and sign in; it does not show saved tickets or data from another session. Other browser caches or existing legacy workers are not silently cleared.

## Updates and notifications

Browsers check the worker on future visits, with worker/import HTTP caching disabled. Updates wait rather than forcing an active reply to reload. Update available prompts for confirmation and tells the operator to save unsent work. No push notifications, background message delivery, WhatsApp integration or notification permission prompts are added. Existing personal-email notifications and on-page ticket refresh work while online. Do not change manifest IDs casually in future releases.

## Deployment and checks

No new credentials or database migration are needed for the PWA itself. Deploy the website changes, workers and public PWA assets together. Existing email/support database migrations remain necessary for those features. Run `npm run test:pwa`, TypeScript and the production build. Checks exercise both manifests, real icon dimensions, worker cache restrictions, offline fallback, scoped cleanup and user-requested update behavior using an isolated worker harness. Physical Android/iPhone home-screen installation still needs manual testing; a PWA is not a guarantee of native-app capabilities.
