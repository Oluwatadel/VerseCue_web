# Support workflow

1. User opens Support from the desktop sidebar or website account, signs in, and submits a complaint. Ask for expected/actual behavior, version/platform and steps. Never ask for passwords, keys or card information.
2. Admin reviews `/admin/support`, filters the queue, assigns an owner and sets priority/status. Use in-progress during investigation and awaiting-user when waiting on customer information.
3. Public replies are stored in the conversation and queued for email. Internal investigation notes stay admin-only. For billing/access changes, use the linked administration pages after verification; resolving a ticket does not automatically change licences or refund money.
4. Record a public resolution summary and mark resolved. The customer sees the summary/time, can rate it, or reply to reopen. Reopening clears the active resolved timestamp and prior rating; the last summary remains visible as context.
5. Check `/admin/messages` for delivery configuration/failures. Customers can read replies without email delivery. No support-response time guarantee or automatic problem-fixing is promised.

Migration 018 must be applied before website deployment. No attachments are stored in this support system. Optional audio/transcripts require the separate tester-reviewed upload flow. No production database was changed by implementing this workflow.

## Website chat handoff

The public and account pages have a guided support chat. Guests can ask product questions without authentication; messages stay in component memory and are not sent to a remote model or stored automatically. It is a curated automated guide, not generative AI or a staffed live-chat system. Signed-in users choose Send complaint to support, enter a subject/category/description, and optionally review/edit and attach the conversation. The server derives ownership from the authenticated account, never from a supplied email/account ID. Chat attachments are capped at 6,000 characters and clearly labelled as customer-shared automated guidance. Ticket and attachment are saved together; a scoped request ID prevents duplicate tickets on retries. Customers follow the ticket link for human replies. No extra migration or AI API key is required beyond the support setup above.

## Admin notifications and on-page conversations

Set server-only `SUPPORT_NOTIFICATION_EMAIL` to the inbox that should receive new complaint and customer-reply notifications. Local development is configured with the email previously supplied by the owner; configure the same value separately on Vercel. Notifications include customer email, complaint/reply text and an authenticated admin ticket link. They do not include private investigation notes or automatic recording attachments. Existing Resend sender/key settings are reused. Delivery is attempted promptly; errors leave mail queued for the existing scheduled/manual retry workflow. Duplicate chat submissions reuse the same notification ID. Never expose this configuration through public metadata.

Customers can choose Conversations with support in the page chat, open their ticket and read/send real support replies. The conversation refreshes every 10 seconds while the chat is open and page visible. Admin replies from Admin → Support appear there. This is polling-based ticket messaging, not a promise of instant staffed assistance. Dashboard conversations work without email. Replies typed in a personal email client are not yet ingested into tickets.

WhatsApp is reserved as a future support channel. Later work may link an official WhatsApp integration to the same ticket threads and replace email alerts by user/admin preference. No WhatsApp webhook, delivery, phone number, chatbot automation, paid provider or credentials are configured by this update.

## Customer tracking and Assistant presentation

Tickets created from dashboard actions and chatbot handoff use the same tracking system. Customers can copy their sign-in-protected tracking link, open the ticket in Assistant, see public status/resolution events and reply. Assistant uses messenger-style bubbles, the verseVIO avatar for automated guidance and initials for customers/support staff. Human replies remain labelled Support team; automated guidance is labelled separately. This does not upload user profile photographs or imply a live agent is online.
