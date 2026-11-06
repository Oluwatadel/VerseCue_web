import type {LicensingDb} from './licensing-db';
import {siteOrigin} from './billing-plans';
export class SubscriptionLifecycle{
 constructor(private db:LicensingDb){}
 async run(){
  // Dates are authoritative even between job runs. Delete only AI sessions, retaining free/web access.
  const expiredSessions=await this.db.query(`DELETE FROM vc_sessions s WHERE s.kind='ai'
   AND NOT EXISTS(SELECT 1 FROM vc_licenses l WHERE l.account_id=s.account_id AND l.status='active' AND (l.expires_at IS NULL OR l.expires_at>now()))
   AND NOT EXISTS(SELECT 1 FROM vc_organisation_members m JOIN vc_organisations o ON o.id=m.organisation_id WHERE m.account_id=s.account_id AND m.status='approved' AND o.status='active' AND (o.unlimited_ai OR o.paid_expires_at>now())) RETURNING token_hash`);
  const rows=await this.db.query(`SELECT a.id,a.email,l.id AS subscription_id,l.expires_at,now() AS job_time FROM vc_accounts a JOIN vc_licenses l ON l.account_id=a.id
   WHERE a.status='active' AND l.status='active' AND l.expires_at IS NOT NULL AND l.expires_at<=now()+interval '7 days'
   UNION ALL SELECT a.id,a.email,o.id AS subscription_id,o.paid_expires_at AS expires_at,now() AS job_time FROM vc_organisations o JOIN vc_accounts a ON a.id=o.owner_account_id
   WHERE a.status='active' AND o.status='active' AND NOT o.unlimited_ai AND o.paid_expires_at IS NOT NULL AND o.paid_expires_at<=now()+interval '7 days'`);
  let queued=0;for(const row of rows){const expiry=new Date(row.expires_at),remaining=expiry.getTime()-new Date(row.job_time).getTime(),stage=remaining<=0?'expired':remaining<=86400000?'1-day':remaining<=3*86400000?'3-days':'7-days';
   const id='subscription:'+row.subscription_id+':'+expiry.toISOString()+':'+stage;
   const subject=stage==='expired'?'Your VerseCue AI subscription has expired':'Your VerseCue AI subscription expires soon';
   const body=stage==='expired'?`Your VerseCue AI subscription expired on ${expiry.toUTCString()}. AI transcription and automatic verse detection are locked until a new payment is verified or approved complimentary access is granted. Renew at ${siteOrigin()}/account/upgrade. If an automatic renewal is pending, check its status before making another payment.`:`Your VerseCue AI subscription expires on ${expiry.toUTCString()}. ${stage==='1-day'?'Less than one day remains.':stage==='3-days'?'Three days or less remain.':'Seven days or less remain.'} Review your subscription and renewal settings at ${siteOrigin()}/account/upgrade. If you enabled automatic renewal, a successful verified charge extends access; a failed or pending charge does not. AI will lock if no valid access remains at expiry.`;
   const inserted=await this.db.query(`INSERT INTO vc_email_outbox(id,account_id,recipient,subject,text_body,subscription_id,subscription_expires_at,subscription_notice)
    SELECT $1,$2,$3,$4,$5,$6,$7,$8 WHERE $8<>'expired' OR (NOT EXISTS(SELECT 1 FROM vc_licenses l WHERE l.account_id=$2 AND l.status='active' AND (l.expires_at IS NULL OR l.expires_at>now()))
    AND NOT EXISTS(SELECT 1 FROM vc_organisation_members m JOIN vc_organisations o ON o.id=m.organisation_id WHERE m.account_id=$2 AND m.status='approved' AND o.status='active' AND (o.unlimited_ai OR o.paid_expires_at>now())))
    ON CONFLICT(id) DO NOTHING RETURNING id`,[id,row.id,row.email,subject,body+'\n\nBible lookup, projection, songs, slides and video remain free.\n\nThe VerseCue team',row.subscription_id,expiry.toISOString(),stage]);queued+=inserted.length;
  }
  await this.db.query("UPDATE vc_activation_requests SET status='expired' WHERE status='pending' AND expires_at<=now()");
  return {notificationsQueued:queued,aiSessionsRevoked:expiredSessions.length};
 }
}
