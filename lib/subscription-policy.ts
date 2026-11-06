// Only current notices are deliverable. Renewals invalidate queued notices for an older expiry.
export const CURRENT_SUBSCRIPTION_NOTICE=`(mail.subscription_notice IS NULL OR (
 EXISTS(SELECT 1 FROM vc_accounts a WHERE a.id=mail.account_id AND a.status='active') AND
 (EXISTS(SELECT 1 FROM vc_licenses l WHERE l.id=mail.subscription_id AND l.account_id=mail.account_id AND l.status='active' AND l.expires_at=mail.subscription_expires_at)
 OR EXISTS(SELECT 1 FROM vc_organisations o WHERE o.id=mail.subscription_id AND o.owner_account_id=mail.account_id AND o.status='active' AND NOT o.unlimited_ai AND o.paid_expires_at=mail.subscription_expires_at)) AND
 CASE mail.subscription_notice
 WHEN '7-days' THEN mail.subscription_expires_at>now()+interval '3 days' AND mail.subscription_expires_at<=now()+interval '7 days'
 WHEN '3-days' THEN mail.subscription_expires_at>now()+interval '1 day' AND mail.subscription_expires_at<=now()+interval '3 days'
 WHEN '1-day' THEN mail.subscription_expires_at>now() AND mail.subscription_expires_at<=now()+interval '1 day'
 WHEN 'expired' THEN mail.subscription_expires_at<=now() AND NOT EXISTS(SELECT 1 FROM vc_licenses l WHERE l.account_id=mail.account_id AND l.status='active' AND (l.expires_at IS NULL OR l.expires_at>now()))
 AND NOT EXISTS(SELECT 1 FROM vc_organisation_members m JOIN vc_organisations o ON o.id=m.organisation_id WHERE m.account_id=mail.account_id AND m.status='approved' AND o.status='active' AND (o.unlimited_ai OR o.paid_expires_at>now()))
 ELSE false END))`;
