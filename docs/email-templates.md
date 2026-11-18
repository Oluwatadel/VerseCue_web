# verseVIO email templates

Email templates are owned by the website code, not separate Resend dashboard templates. `lib/email-template.ts` supplies a navy/gold header, accessible text, message content, a website action and support footer. Resend receives both HTML and plain text.

- Welcome: organisation greeting and a Get verseVIO action.
- Support acknowledgement: complaint reference and tracking link.
- Support review/update: public team response/status and a Track your request action. Resolution summaries and dates remain in the authenticated ticket.
- Admin complaint/reply alert: notification for the configured private inbox and admin ticket link.
- Other account/payment/reset messages retain their existing text in the shared design. Reset links remain clickable only on the configured website origin.

`EMAIL_FROM=verseVIO <noreply@your-domain.com>` controls the sender. No-reply is not a separate email template. `EMAIL_REPLY_TO` routes replies to a real receiving mailbox, while `SUPPORT_NOTIFICATION_EMAIL` is the private destination for complaint notifications. These are separate settings. Website tickets remain the tracked reply channel; inbound email ingestion is not yet configured.

Run `npm run db:migrate` to apply additive migration 019 before deploying the new renderer. New emails snapshot their HTML when queued, so retries use stable content. Older pending messages keep their original plain text rather than changing their Resend idempotency payload. HTML and text bodies are cleared after acceptance or cancellation. Never put secrets into templates or expose the outbox body in admin list APIs.

Configure `NEXT_PUBLIC_SITE_URL` to the actual HTTPS website domain so buttons and tracking links point to the correct deployment. Configure the existing Resend key and verified sender on the host. No new Resend template IDs or credentials are required. `npm run test:email-delivery` creates synthetic previews in `artifacts/email-template-previews/`; no real mail is sent by those checks.
