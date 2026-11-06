# Email delivery troubleshooting

`configured: true` means the deployed process has an API key and a sender string. It does not verify that the API key is active, the domain is verified, or that Resend accepts the request.

Open Admin → Email delivery. `queued` means not accepted yet; `sending` means a worker has claimed the message; `Accepted by Resend` means the API accepted the request, not that it reached the inbox. The Resend message ID is retained when returned by the provider. Use Resend delivery logs to inspect delivered, bounced, suppressed or delayed events. API keys, message bodies and reset links are not exposed by the admin endpoint.

Deploy the current code and apply migration 013 with `npm run db:migrate`. Retry a specific queued email from its card and confirm the action. The safe diagnostic identifies unverified sender domains, test-only sender restrictions, invalid/inactive API keys, permission problems, quota and rate limits. A recipient-specific failure no longer prevents attempts for other queued messages; global authentication, rate-limit and connectivity problems stop the batch. Queued entries have at most ten automatic attempts; manual retry resets exhausted attempts for the selected entry.

Password resets dispatch their own queued email directly rather than the oldest email. Expired or already-consumed reset links are cancelled instead of delivered. Do not retry expired reset messages; request a new reset link.

When using a Resend test sender, recipients are restricted to the Resend account's own email. To email users generally, verify your own sender domain in the same Resend account as the API key, set EMAIL_FROM to an address on that domain and redeploy. See [Resend error reference](https://resend.com/docs/api-reference/errors) and [email delivery lookup](https://resend.com/docs/api-reference/emails/retrieve-email).

Tests: `npm run test:email-delivery`, existing billing checks, and the admin email UI checks. Provider calls in tests are simulated; no real emails are sent.
