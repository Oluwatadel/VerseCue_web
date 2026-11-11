# Reviewed speech-test reports

This feature collects optional test samples for investigating speech recognition, reference detection and latency. It does not automatically train models or upload ordinary sermon sessions.

## Tester workflow

1. Sign in to the desktop app. AI access is still required to run transcription.
2. In Settings → Speech → Advanced tools, enter a session name and optionally your accent, language and recording conditions. Obtain permission from anyone whose voice will be recorded.
3. Start transcription, grant recording consent and start a test. A visible recording indicator can stop it. Recording stops after at most ten minutes or when transcription stops.
4. Stop and review the local session. Listen to the WAV, inspect filtered model outputs and reference decisions, and correct transcript snippets. A correct original snippet can be explicitly marked as verified text.
5. Save locally or choose what to upload. Audio and transcript sharing start off. Timing-only reports omit spoken text and detected references, but include notes and device/model information; review those too.
6. Optional model-training permission is a separate choice, off by default. Confirm reviewed-upload consent and the final sharing prompt. Nothing uploads automatically.
7. After verification, the report appears in Admin → Speech test reports. The tester can remove it from Account → Test reports or from desktop review. Local copies remain until explicitly deleted.

Uploads require an authenticated account and fresh proof from its registered computer. An expired AI subscription does not prevent submitting an already recorded sample. Cancelling or failing an upload preserves the local files for retry. Unfinished uploads stay out of the admin report list.

## Server setup

Apply database migration `db/014-test-reports.sql` using the normal web-project migration runner:

```powershell
npm run db:migrate
```

Text and timing reports work without object storage. Audio submissions require these **server-only** variables, also documented in `.env.example`:

| Variable | Value to supply |
| --- | --- |
| TEST_AUDIO_BUCKET | Private bucket name |
| TEST_AUDIO_REGION | Bucket region |
| TEST_AUDIO_ACCESS_KEY_ID | Restricted object-storage credential ID |
| TEST_AUDIO_SECRET_ACCESS_KEY | Corresponding credential secret |
| TEST_AUDIO_ENDPOINT | Optional HTTPS endpoint for a compatible provider |
| TEST_AUDIO_PATH_STYLE | `1` only if required by that provider; default `0` |

Use a dedicated private bucket with public access blocked and encryption at rest enabled. Restrict the credential to read/write/delete under the `test-reports/` prefix; it needs object PUT, HEAD/GET and DELETE permissions, not bucket administration. Do not publish these credentials in desktop builds or NEXT_PUBLIC variables.

Audio goes directly from desktop to storage through a fifteen-minute signed PUT. The signature binds content length, WAV content type and SHA256. Completion verifies stored checksum, length and a ranged WAV header before publishing the report. A compatible provider must support these operations; validate them in staging before enabling recordings. Real object-storage integration has not been exercised by local synthetic tests.

Private playback is requested explicitly through authenticated admin/owner routes and uses links lasting at most sixty seconds. A link already issued remains usable until it expires, even after report deletion. No public audio URLs are stored in reports.

Keep the existing authenticated daily-job scheduler and CRON_SECRET configured. It expires reports after thirty days and retries failed object deletion. Abandoned unconfirmed uploads become eligible for cleanup after one day. Cleanup processes up to fifty records per invocation; run it more frequently if volume grows. Configure a bucket lifecycle rule as an additional safeguard to remove objects under `test-reports/` after thirty days. Access expiry does not depend on the scheduler, but physical deletion does. Account for provider backup-retention policies separately.

Deleting a shared report immediately hides and scrubs its database payload; failed private-object deletion is queued for retry. Exported copies must be managed separately. Withdrawal cannot undo training already performed outside this app.

## Admin review and interpretation

Visit `/admin/test-reports` for report tables, filters, timing charts, optional private playback, corrected snippets and detection decisions. `/account/test-reports` gives testers access only to their own reports.

Training annotation export requires tester permission, an administrator's reviewed status and nonempty verified transcript text. Export is preparation for a separately controlled training workflow, not a training action. Continuous audio and snippet timestamps need manual alignment and quality review before becoming a training dataset.

Charts average each session's p95 for the displayed accent/platform/model groups. Accent is self-reported. These observational measurements do not establish that an accent causes a difference: compare equivalent microphone, hardware, model, audio and noise settings. Recording/debug capture itself adds overhead. Model cold start is excluded; estimated window-to-analysis latency includes measured buffering, queue, decode and analysis stages, not guaranteed whole-sentence latency. There is no universal two-to-three-second guarantee.

The processing platform identifies the desktop doing inference. Using the mobile remote does not mean speech inference ran on Android/iPhone. Cross-platform and physical-microphone testing remain necessary.

## Local checks

- Web: `npm run test:test-reports`, `npm run test:migrations`, `npm run test:licensing`, TypeScript and production build.
- Desktop: `tests/Versecue.TestReportChecks` uses generated PCM and mocked transport, including upload retry and proof handling.
- Desktop UI checks cover consent, corrections, confirmation cancellation and retaining local data when cancelling an upload.
- `tools/check-test-report-ui.cjs` checks mocked admin/account views at desktop and narrow widths; requires Playwright and the review production build.

These tests do not record a microphone, upload real samples, configure cloud storage or fine-tune a model.
