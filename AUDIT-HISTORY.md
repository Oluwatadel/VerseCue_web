# Audit history and church locations

The website and desktop use the existing PostgreSQL database for product audit history. No new hosting service or file-storage service is required. Development build/test logs are local verification output, not runtime website storage; `*.log` is ignored by both repositories.

## Before deployment

Run `npm run db:migrate` from the website directory **before deploying the updated website**. Migration `016-audit-and-church-locations.sql` adds location fields, the audit table and indexes, safe transactional database triggers, and a bounded import of recent administrative history. It can be rerun without overwriting church data. No hosted migration, deployment or Git push was performed during implementation.

The next desktop build includes best-effort online app-open and AI enable/disable events. Existing desktop versions still produce server-side sign-in and activation events after the migration, but do not send the new client milestone events. No new installer was packaged.

## Admin workflow

Open **Admin → Audit history**. Filter by UTC date range, account email, church name, activity, source, country, state/region, city, recorded status and plan. Results are server-paginated at 50 per page. The dashboard does not poll continuously.

The existing authenticated daily job `/api/jobs/daily` applies a 30-day retention policy and keeps the newest 10,000 audit entries. Its existing `CRON_SECRET` must be configured for scheduled cleanup. Admins can also use **Apply retention now**, with confirmation. Entries beyond the cleanup limit can accumulate between daily runs; the table is not an unlimited archive.

Server-side history includes account registration and sign-in, account/profile/device/password status changes, grants and revocation, installer requests, payment records, organisation/member changes and existing administrative actions. Desktop milestone events are explicitly marked client-reported. They require the signed-in registered computer's proof, allowlisted actions, rate limits and idempotent event IDs. Audit delivery never blocks the live workspace and writes no local audit files. Failed/offline desktop milestone deliveries are best-effort and are not persisted for later replay.

Passwords, hashes, session tokens, activation secrets, card details, raw recordings and sermon transcripts are excluded. Audit history is not a replacement for the separate tester-reviewed speech report workflow.

## Church locations

Registration and account Profile collect country, state/region, city/town and street address. Admins can edit account church locations from **Accounts & activation → Edit church location**, and managed organisation locations in **Organisations**. The account directory displays available locations. Existing unknown locations stay **Not provided**; no IP/GPS location is inferred. Audit location filters reflect current church profiles.

## Verification

24 audit/location checks, 74 licensing checks and 54 organisation/email/support/pricing checks passed against isolated local databases. Migration rerun tests, production website build and desktop Release compile passed. Browser checks passed for authorization, filtering, pagination, responsive rendering, admin location editing and registration fields. No customer data was changed and no real email/payment was sent by tests.
