import {randomUUID} from 'node:crypto';
import type {LicensingDb} from './licensing-db';
import {BillingService,ReversedPaymentError} from './billing-service';
import {EmailService} from './email-service';
import {hash,LicenseError} from './licensing-security';
function canonical(value:any):any{if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])]));return value;}
export class WebhookService {
 constructor(private db:LicensingDb,private billing:BillingService,private mode:'test'|'live',private mail=new EmailService(db)){}
 async handle(payload:any){
  if(!payload||typeof payload.event!=='string'||!payload.event||!payload.data||typeof payload.data!=='object'||Array.isArray(payload.data))throw new LicenseError(400,'Invalid webhook event.');
  const {event,data}=payload,key=hash(JSON.stringify(canonical({event,data}))),lease=randomUUID();
  const claimed=await this.db.query(`INSERT INTO vc_webhook_events(mode,event_key,event_type,lease_token) VALUES($1,$2,$3,$4)
   ON CONFLICT(mode,event_key) DO UPDATE SET lease_token=EXCLUDED.lease_token,locked_at=now(),last_error=NULL
   WHERE vc_webhook_events.status='failed' OR (vc_webhook_events.status='processing' AND vc_webhook_events.locked_at<now()-interval '5 minutes') RETURNING event_key`,[this.mode,key,event,lease]);
  if(!claimed.length){const [row]=await this.db.query('SELECT status FROM vc_webhook_events WHERE mode=$1 AND event_key=$2',[this.mode,key]);if(row?.status==='processed')return {received:true,duplicate:true};throw new LicenseError(503,'This event is processing. Retry required.');}
  try{
   try{
    if(event==='charge.success')await this.billing.confirm(data.reference,undefined,data.subscription?.subscription_code);
    else if(event==='invoice.update'&&data.paid===true&&data.transaction?.status==='success')await this.billing.confirm(data.transaction.reference,undefined,data.subscription?.subscription_code);
    else if(['subscription.create','subscription.not_renew','subscription.disable'].includes(event))await this.billing.subscriptionEvent(event,data);
    else if(event==='refund.processed')await this.billing.paymentReversed(data.transaction?.reference||data.transaction_reference,'refunded');
    else if(event==='charge.dispute.create')await this.billing.paymentReversed(data.transaction?.reference,'disputed');
    else if(event==='invoice.payment_failed'){
     const [account]=await this.db.query(`SELECT a.id,a.email FROM vc_accounts a JOIN vc_billing_subscriptions s ON s.account_id=a.id WHERE s.code=$1 AND s.mode=$2`,[data.subscription?.subscription_code,this.mode]);
     if(!account)throw new LicenseError(503,'Subscription is not recorded yet. Retry required.');
     await this.mail.queue('payment-failed:'+this.mode+':'+hash(String(data.invoice_code||data.id||key)),account.id,account.email,'VerseCue renewal payment needs attention','Your automatic renewal payment did not succeed. Review your plan and payment details on your VerseCue account. Free Bible and media features remain available.');
    }
   }catch(error){if(!(error instanceof ReversedPaymentError))throw error;}
   await this.db.query("UPDATE vc_webhook_events SET status='processed',completed_at=now() WHERE mode=$1 AND event_key=$2 AND lease_token=$3",[this.mode,key,lease]);
   return {received:true,duplicate:false};
  }catch(error){
   await this.db.query("UPDATE vc_webhook_events SET status='failed',last_error='Processing failed; provider retry required.' WHERE mode=$1 AND event_key=$2 AND lease_token=$3 AND status='processing'",[this.mode,key,lease]);throw error;
  }
 }
}
