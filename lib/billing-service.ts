import {randomBytes,randomUUID} from "node:crypto";
import type {LicensingDb,Row} from "./licensing-db";
import {LicensingService} from "./licensing-service";
import {LicenseError,hash,normalizeEmail} from "./licensing-security";
import {BILLING_PLANS,quotePlan,siteOrigin} from "./billing-plans";
import {Paystack} from "./paystack";
import {EmailService} from "./email-service";
export class ReversedPaymentError extends LicenseError {constructor(){super(409,"This payment was refunded or disputed. Contact support.");}}
export class BillingService {
 constructor(private db:LicensingDb,private licensing:LicensingService,private provider=new Paystack(),private mail=new EmailService(db),private allowTestActivation=process.env.BILLING_ALLOW_TEST_ACTIVATION==='1'&&process.env.NODE_ENV!=='production'){}
 private async webAccount(token:string){const account=await this.licensing.account(token);if(account.session_kind!=="web")throw new LicenseError(401,"Sign in on the website to manage payments.");return account;}
 async state(token:string,computers=1){
  if(!quotePlan("monthly",computers))throw new LicenseError(400,"Choose between 1 and 10,000 computers.");
  const account=await this.webAccount(token);
  let checkoutUnavailableReason=!this.provider.configured?'Online payments are not enabled on this website yet. Contact support for activation assistance.':this.provider.mode==='test'&&!this.allowTestActivation?'Live payments are not enabled yet. Your free account and existing AI access remain available.':'';
  if(!checkoutUnavailableReason){try{this.licensing.requireActivationConfiguration();}catch{checkoutUnavailableReason='AI activation is being configured. Payment is paused so you are not charged before access can be issued. Contact support.';}}
  return {checkoutUnavailableReason,account:{email:account.email,organisationName:account.organisation_name},plans:BILLING_PLANS.map(base=>({...quotePlan(base.id,computers)!,autoRenewAvailable:computers>1?this.provider.configured:/^PLN_[a-zA-Z0-9]+$/.test(process.env[base.env]||'')})),
   organisations:await this.db.query("SELECT id,name,device_limit,paid_expires_at FROM vc_organisations WHERE owner_account_id=$1",[account.id]),
   checkoutAvailable:!checkoutUnavailableReason,testMode:this.provider.mode==='test',
   licenses:account.licenses,orders:await this.db.query("SELECT reference,plan_id,computer_count,amount,status,created_at FROM vc_billing_orders WHERE account_id=$1 AND status IN ('pending','expired') ORDER BY created_at DESC LIMIT 10",[account.id]),payments:await this.db.query("SELECT reference,plan_id,months,amount,currency,mode,status,created_at FROM vc_payment_receipts WHERE account_id=$1 ORDER BY created_at DESC LIMIT 25",[account.id]),
   subscriptions:await this.db.query("SELECT code,status FROM vc_billing_subscriptions WHERE account_id=$1 ORDER BY created_at DESC",[account.id])};
 }
 async checkout(token:string,id:unknown,autoRenew:unknown,computers:unknown=1){
  const account=await this.webAccount(token);const plan=quotePlan(id,computers);
  if(!plan||typeof autoRenew!=="boolean")throw new LicenseError(400,"Choose a valid plan and renewal preference.");
  if(!this.provider.configured || this.provider.mode==='test'&&!this.allowTestActivation)throw new LicenseError(503,"Live payment checkout is not configured yet. Free tools remain available.");
  this.licensing.requireActivationConfiguration();
  if(account.licenses.some(license=>license.status==='active'&&!license.expires_at))throw new LicenseError(409,"Your account already has ongoing AI access. No purchase is needed.");
  await this.licensing.rate("checkout:"+account.id,20);
  const [owned]=await this.db.query('SELECT * FROM vc_organisations WHERE owner_account_id=$1',[account.id]);
  if(owned?.paid_expires_at&&new Date(owned.paid_expires_at).getTime()>Date.now()&&owned.device_limit!==plan.computerCount)throw new LicenseError(409,'Contact support to change the computer count during an active period. Renewal keeps the current number of computers.');
  if(plan.computerCount>1&&account.licenses.some(l=>l.access_kind!=='organisation'&&l.status==='active'&&l.expires_at&&new Date(l.expires_at).getTime()>Date.now()))throw new LicenseError(409,'Contact support to move an active personal plan to organisation computers without losing paid time.');
  const planCode=autoRenew?(plan.computerCount===1?process.env[plan.env]||'':await this.seatPlan(plan)):null;
  if(autoRenew&&!/^PLN_[a-zA-Z0-9]+$/.test(planCode||''))throw new LicenseError(503,"Auto-renew for this plan is not configured yet. You can choose a one-time payment.");
  if(autoRenew){
   const remote=await this.provider.call('/plan/'+encodeURIComponent(planCode!));
   if(Number(remote.amount)!==plan.amount||remote.currency!=='NGN'||remote.interval!==plan.interval||remote.plan_code!==planCode)throw new LicenseError(503,"The provider plan does not match this price. Contact the administrator.");
   const existing=await this.db.query("SELECT code FROM vc_billing_subscriptions WHERE account_id=$1 AND status='active' LIMIT 1",[account.id]);
   if(existing.length)throw new LicenseError(409,"You already have auto-renew enabled. Manage that subscription before creating another.");
  }
  await this.db.query("UPDATE vc_billing_orders SET status='expired' WHERE account_id=$1 AND status='pending' AND created_at<now()-interval '1 hour'",[account.id]);
  let organisationId:string|null=null;
  if(plan.computerCount>1){const [org]=await this.db.query(`INSERT INTO vc_organisations(id,name,owner_account_id,multi_device,device_limit) VALUES($1,$2,$3,true,$4)
   ON CONFLICT(owner_account_id) DO UPDATE SET owner_account_id=EXCLUDED.owner_account_id RETURNING id`,[randomUUID(),account.organisation_name,account.id,plan.computerCount]);organisationId=org.id;
   await this.db.query("INSERT INTO vc_organisation_members(organisation_id,account_id) VALUES($1,$2) ON CONFLICT(organisation_id,account_id) DO NOTHING",[org.id,account.id]);}
  const reference='VC'+randomBytes(24).toString('hex');
  const rows=await this.db.query(`INSERT INTO vc_billing_orders(reference,account_id,plan_id,months,amount,auto_renew,mode,plan_code,computer_count,organisation_id)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT(account_id) WHERE status='pending' DO NOTHING RETURNING *`,[reference,account.id,plan.id,plan.months,plan.amount,autoRenew,this.provider.mode,planCode,plan.computerCount,organisationId]);
  if(!rows.length){
   const [pending]=await this.db.query("SELECT * FROM vc_billing_orders WHERE account_id=$1 AND status='pending'",[account.id]);
   if(pending?.authorization_url&&pending.plan_id===plan.id&&pending.auto_renew===autoRenew&&pending.computer_count===plan.computerCount)return {url:Paystack.checkoutUrl(pending.authorization_url)};
   throw new LicenseError(409,"A checkout is already pending. Finish it or wait up to one hour before starting a different plan.");
  }
  try {
   const result=await this.provider.call('/transaction/initialize',{email:account.email,amount:plan.amount,currency:'NGN',reference,callback_url:siteOrigin()+'/api/billing/callback',...(planCode?{plan:planCode,channels:['card']}:{}),metadata:{accountId:account.id,planId:plan.id,autoRenew,computerCount:plan.computerCount}});
   const url=Paystack.checkoutUrl(result.authorization_url);
   if(result.reference!==reference)throw new LicenseError(503,"Unexpected checkout reference.");
   await this.db.query("UPDATE vc_billing_orders SET authorization_url=$2 WHERE reference=$1",[reference,url]);return {url};
  }catch(error){
   // Keep uncertain initializations pending: the provider may still have created it.
   if(error instanceof LicenseError)throw error;throw new LicenseError(503,"Could not prepare checkout. Please retry.");
  }
 }
 async resume(token:string,value:unknown){
  const account=await this.webAccount(token),reference=this.reference(value);
  if(!this.provider.configured||this.provider.mode==='test'&&!this.allowTestActivation)throw new LicenseError(503,'Payment checkout is not configured yet.');
  this.licensing.requireActivationConfiguration();
  if(account.licenses.some(l=>l.status==='active'&&!l.expires_at))throw new LicenseError(409,'Your account already has ongoing AI access. No purchase is needed.');
  const [order]=await this.db.query("SELECT authorization_url FROM vc_billing_orders WHERE reference=$1 AND account_id=$2 AND mode=$3 AND status='pending' AND created_at>now()-interval '1 hour'",[reference,account.id,this.provider.mode]);
  if(!order?.authorization_url)throw new LicenseError(409,'This checkout is unavailable or expired. Choose a plan to start a new checkout.');
  return {url:Paystack.checkoutUrl(order.authorization_url)};
 }
 private async seatPlan(plan:NonNullable<ReturnType<typeof quotePlan>>){
  const [cached]=await this.db.query('SELECT plan_code FROM vc_paystack_seat_plans WHERE mode=$1 AND plan_id=$2 AND computer_count=$3 AND amount=$4',[this.provider.mode,plan.id,plan.computerCount,plan.amount]);
  if(cached)return cached.plan_code as string;
  const remote=await this.provider.call('/plan',{name:`VerseCue AI ${plan.computerCount} PCs / ${plan.name}`,amount:plan.amount,interval:plan.interval,currency:'NGN'});
  if(!/^PLN_[a-zA-Z0-9]+$/.test(remote.plan_code||'')||Number(remote.amount)!==plan.amount||remote.currency!=='NGN'||remote.interval!==plan.interval)throw new LicenseError(503,'The recurring computer plan could not be validated. Choose one-time payment or contact support.');
  const [saved]=await this.db.query(`INSERT INTO vc_paystack_seat_plans(mode,plan_id,computer_count,amount,plan_code) VALUES($1,$2,$3,$4,$5)
   ON CONFLICT(mode,plan_id,computer_count) DO UPDATE SET amount=EXCLUDED.amount,plan_code=EXCLUDED.plan_code RETURNING plan_code`,[this.provider.mode,plan.id,plan.computerCount,plan.amount,remote.plan_code]);return saved.plan_code as string;
 }
 private reference(value:unknown){const reference=String(value||'');if(!/^[a-zA-Z0-9._-]{6,100}$/.test(reference))throw new LicenseError(400,"Invalid payment reference.");return reference;}
 async confirm(referenceValue:unknown,token?:string,subscriptionHint?:string){
  const reference=this.reference(referenceValue);
  let [order]=await this.db.query("SELECT o.*,a.email FROM vc_billing_orders o JOIN vc_accounts a ON a.id=o.account_id WHERE o.reference=$1",[reference]);
  if(token){const account=await this.webAccount(token);if(!order||order.account_id!==account.id)throw new LicenseError(404,"Payment was not found for this account.");}
  const previous=await this.db.query("SELECT p.*,a.email FROM vc_payment_receipts p JOIN vc_accounts a ON a.id=p.account_id WHERE reference=$1",[reference]);
  if(previous[0]?.status==='review'){await this.reviewPayment(reference,previous[0]);return {message:'Payment received. Support must review a computer-count change before activation. Your existing access is retained.',credited:false};}
  if(previous[0]&&previous[0].status!=='paid')throw new ReversedPaymentError();
  if(previous[0]){await this.receiptEmail(reference,previous[0]);return {message:'Payment verified. Return to VerseCue; AI access will activate automatically.',credited:false};}
  const verified=await this.provider.call('/transaction/verify/'+encodeURIComponent(reference));
  if(verified.status!=='success')throw new LicenseError(409,"Payment is not verified yet. Pending, abandoned and failed payments do not activate AI.");
  if(verified.reference!==reference||verified.currency!=='NGN'||verified.domain!==this.provider.mode||!/^\d{1,30}$/.test(String(verified.id)))throw new LicenseError(400,"Payment verification details do not match.");
  const customer=verified.customer||{};
  if(!order){
   const planCode=typeof verified.plan==='string'?verified.plan:verified.plan?.plan_code||verified.plan_object?.plan_code;
   if(/^PLN_[a-zA-Z0-9]+$/.test(planCode||'')){
    [order]=await this.db.query(`SELECT o.*,a.email FROM vc_billing_subscriptions s JOIN vc_billing_orders o ON o.reference=s.order_reference
     JOIN vc_accounts a ON a.id=s.account_id WHERE s.customer_code=$1 AND s.plan_code=$2 AND s.mode=$3 AND o.status='paid' LIMIT 1`,[customer.customer_code,planCode,this.provider.mode]);
   }else if(/^SUB_[a-zA-Z0-9]+$/.test(subscriptionHint||'')){
    const remote=await this.provider.call('/subscription/'+encodeURIComponent(subscriptionHint!));
    if(remote.customer?.customer_code!==customer.customer_code)throw new LicenseError(400,"Subscription customer does not match payment.");
    [order]=await this.db.query(`SELECT o.*,a.email FROM vc_billing_subscriptions s JOIN vc_billing_orders o ON o.reference=s.order_reference
     JOIN vc_accounts a ON a.id=s.account_id WHERE s.code=$1 AND s.customer_code=$2 AND s.plan_code=$3 AND s.mode=$4 AND o.status='paid' LIMIT 1`,[subscriptionHint,customer.customer_code,remote.plan?.plan_code,this.provider.mode]);
   }

  }
  if(!order||order.mode!==this.provider.mode||Number(verified.amount)!==Number(order.amount)||normalizeEmail(customer.email)!==order.email)throw new LicenseError(400,"Payment amount, currency or account does not match the order.");
  if(this.provider.mode==='test'&&!this.allowTestActivation)throw new LicenseError(503,"Test payments cannot activate live AI access.");
  if(order.organisation_id){
   const result=await this.db.transaction([
    ...this.paymentGuard(reference),
    {text:'SELECT id FROM vc_organisations WHERE id=$1 FOR UPDATE',values:[order.organisation_id]},
    {text:`WITH receipt AS (INSERT INTO vc_payment_receipts(reference,transaction_id,account_id,plan_id,months,amount,currency,mode,computer_count,organisation_id,status)
     SELECT $1,$2,$3,$4,$5,$6,'NGN',$7,$8,o.id,
      CASE WHEN (o.paid_expires_at>now() AND o.device_limit<>$8) OR (SELECT count(*) FROM vc_organisation_devices WHERE organisation_id=o.id AND status='active')>$8 THEN 'review' ELSE 'paid' END
     FROM vc_organisations o WHERE o.id=$9 AND NOT EXISTS(SELECT 1 FROM vc_payment_guards WHERE reference=$1 AND mode=$7 AND reversal_status IS NOT NULL) ON CONFLICT(reference) DO NOTHING RETURNING status),
     entitlement AS (UPDATE vc_organisations SET multi_device=true,device_limit=$8,paid_expires_at=GREATEST(COALESCE(paid_expires_at,now()),now())+make_interval(months=>$5::integer)
      WHERE id=$9 AND EXISTS(SELECT 1 FROM receipt WHERE status='paid') RETURNING id)
     SELECT status FROM receipt`,values:[reference,String(verified.id),order.account_id,order.plan_id,order.months,order.amount,order.mode,order.computer_count,order.organisation_id]},
    {text:"UPDATE vc_billing_orders SET status='paid',customer_code=$2 WHERE reference=$1 AND EXISTS(SELECT 1 FROM vc_payment_receipts WHERE reference=$3 AND status IN ('paid','review'))",values:[order.reference,customer.customer_code||null,reference]}
   ]);
   await this.rejectReversed(reference);
   const [receipt]=await this.db.query('SELECT status FROM vc_payment_receipts WHERE reference=$1',[reference]);
   if(receipt?.status==='review'){
    await this.reviewPayment(reference,order);
    return {message:'Payment received. Support must review a computer-count change before activation. Your existing access is retained.',credited:false};
   }
   await this.receiptEmail(reference,order);return {message:'Payment verified. Organisation AI access is ready for the purchased computers. Return to VerseCue to activate.',credited:result[3].length>0};
  }
  const credited=await this.db.transaction([
   ...this.paymentGuard(reference),
   {text:'SELECT id FROM vc_accounts WHERE id=$1 FOR UPDATE',values:[order.account_id]},
   {text:`WITH owner AS (SELECT * FROM vc_accounts WHERE id=$1 FOR UPDATE),
    receipt AS (INSERT INTO vc_payment_receipts(reference,transaction_id,account_id,plan_id,months,amount,currency,mode)
     SELECT $2,$3,id,$4,$5,$6,'NGN',$7 FROM owner WHERE NOT EXISTS(SELECT 1 FROM vc_payment_guards WHERE reference=$2 AND mode=$7 AND reversal_status IS NOT NULL) ON CONFLICT(reference) DO NOTHING RETURNING account_id),
    entitlement AS (INSERT INTO vc_licenses(id,owner_email,code_hash,account_id,device_id,status,expires_at,access_kind,activated_at)
     SELECT $8,a.email,$9,a.id,a.device_id,'active',now()+make_interval(months=>$5::integer),'standard',now() FROM owner a JOIN receipt r ON r.account_id=a.id
     ON CONFLICT(owner_email) WHERE status='active' DO UPDATE SET account_id=EXCLUDED.account_id,device_id=EXCLUDED.device_id,
      expires_at=CASE WHEN vc_licenses.expires_at IS NULL THEN NULL ELSE GREATEST(vc_licenses.expires_at,now())+make_interval(months=>$5::integer) END,
      activated_at=now(),access_kind=CASE WHEN vc_licenses.expires_at IS NULL THEN vc_licenses.access_kind ELSE 'standard' END RETURNING id)
    SELECT id FROM entitlement`,values:[order.account_id,reference,String(verified.id),order.plan_id,order.months,order.amount,order.mode,randomUUID(),hash(randomBytes(32).toString('hex'))]},
   {text:"UPDATE vc_billing_orders SET status='paid',customer_code=$2 WHERE reference=$1 AND EXISTS(SELECT 1 FROM vc_payment_receipts WHERE reference=$3 AND status IN ('paid','review'))",values:[order.reference,customer.customer_code||null,reference]}
  ]);
  await this.rejectReversed(reference);
  await this.receiptEmail(reference,order);
  return {message:'Payment verified. Return to VerseCue; AI access will activate automatically.',credited:credited[3].length>0};
 }
 private paymentGuard(reference:string){return [
  {text:'INSERT INTO vc_payment_guards(reference,mode) VALUES($1,$2) ON CONFLICT(reference,mode) DO NOTHING',values:[reference,this.provider.mode]},
  {text:'SELECT reference FROM vc_payment_guards WHERE reference=$1 AND mode=$2 FOR UPDATE',values:[reference,this.provider.mode]}
 ];}
 private async rejectReversed(reference:string){const rows=await this.db.query('SELECT reference FROM vc_payment_guards WHERE reference=$1 AND mode=$2 AND reversal_status IS NOT NULL',[reference,this.provider.mode]);if(rows.length)throw new ReversedPaymentError();}
 private async reviewPayment(reference:string,order:Row){
  await this.mail.queue('payment-review:'+reference,order.account_id,order.email,'VerseCue payment needs support review',`Payment ${reference} was received. A computer-count change needs review before activation. Existing access is retained. Contact ${siteOrigin()}/account/support.`);
  await this.db.query(`INSERT INTO vc_support_requests(id,account_id,category,subject,description,priority,external_key)
   VALUES($1,$2,'billing','Computer-count payment review',$3,'high',$4) ON CONFLICT(external_key) DO NOTHING`,[randomUUID(),order.account_id,'Verified payment requires computer-count review: '+reference,'payment-review:'+reference]);
 }
 private async receiptEmail(reference:string,order:Row){
  await this.mail.queue('payment:'+reference,order.account_id,order.email,'VerseCue AI payment confirmed',`We verified your payment of NGN ${(order.amount/100).toFixed(2)} for ${order.months} month(s) of AI access${order.computer_count>1?' on '+order.computer_count+' organisation computers':''}. Open VerseCue to activate on your registered computer. Manage your plan and renewal preference at ${siteOrigin()}/account/upgrade. Reference: ${reference}.`);
 }
 async subscriptionEvent(event:string,data:any){
  const code=String(data.subscription_code||'');if(!/^SUB_[a-zA-Z0-9]+$/.test(code))throw new LicenseError(400,'Invalid subscription event.');
  const status=event==='subscription.create'?'active':event==='subscription.disable'?'disabled':event==='subscription.not_renew'?'not-renewing':null;
  if(!status)throw new LicenseError(400,'Invalid subscription event.');
  let order:Row|undefined;const customer=data.customer||{},planCode=data.plan?.plan_code;
  if(status==='active'){
   [order]=await this.db.query(`SELECT o.*,a.email FROM vc_billing_orders o JOIN vc_accounts a ON a.id=o.account_id
    WHERE o.auto_renew=true AND o.plan_code=$1 AND a.email=$2 AND o.mode=$3 AND o.status IN ('pending','paid') ORDER BY o.created_at DESC LIMIT 1`,[planCode,normalizeEmail(customer.email),this.provider.mode]);
   if(!order||Number(data.plan?.amount)!==Number(order.amount)||!customer.customer_code)throw new LicenseError(400,'Subscription does not match an approved checkout.');
  }
  // A cancellation can arrive before creation. Persist its terminal state even without a subscription row.
  // For a given code the supported lifecycle only advances: active -> not-renewing -> disabled.
  await this.db.transaction([
   {text:`INSERT INTO vc_subscription_states(code,mode,status) VALUES($1,$2,$3) ON CONFLICT(code,mode) DO UPDATE
    SET status=CASE WHEN vc_subscription_states.status='disabled' OR EXCLUDED.status='disabled' THEN 'disabled'
     WHEN vc_subscription_states.status='not-renewing' OR EXCLUDED.status='not-renewing' THEN 'not-renewing' ELSE 'active' END`,values:[code,this.provider.mode,status]},
   ...(order?[{text:`INSERT INTO vc_billing_subscriptions(code,account_id,order_reference,customer_code,plan_code,mode,status)
    SELECT $1,$2,$3,$4,$5,$6,status FROM vc_subscription_states WHERE code=$1 AND mode=$6 ON CONFLICT(code) DO NOTHING`,values:[code,order.account_id,order.reference,customer.customer_code,planCode,this.provider.mode]}]:[]),
   {text:'UPDATE vc_billing_subscriptions s SET status=t.status FROM vc_subscription_states t WHERE s.code=t.code AND s.mode=t.mode AND s.code=$1 AND s.mode=$2',values:[code,this.provider.mode]}
  ]);
 }
 async manage(token:string,value:unknown){
  const account=await this.webAccount(token);const code=String(value||'');
  const rows=await this.db.query("SELECT code FROM vc_billing_subscriptions WHERE code=$1 AND account_id=$2 AND mode=$3",[code,account.id,this.provider.mode]);
  if(!rows.length)throw new LicenseError(404,"Subscription not found.");
  const result=await this.provider.call('/subscription/'+encodeURIComponent(code)+'/manage/link');
  return {url:Paystack.checkoutUrl(result.link)};
 }
 async paymentReversed(reference:unknown,status:'refunded'|'disputed'){
  const ref=this.reference(reference);
  await this.db.transaction([
   ...this.paymentGuard(ref),
   {text:'SELECT o.id FROM vc_organisations o JOIN vc_payment_receipts p ON p.organisation_id=o.id WHERE p.reference=$1 AND p.mode=$2 FOR UPDATE OF o',values:[ref,this.provider.mode]},
   {text:'SELECT a.id FROM vc_accounts a JOIN vc_payment_receipts p ON p.account_id=a.id WHERE p.reference=$1 AND p.mode=$2 AND p.organisation_id IS NULL FOR UPDATE OF a',values:[ref,this.provider.mode]},
   {text:`UPDATE vc_payment_guards SET reversal_status=CASE WHEN reversal_status='refunded' THEN 'refunded' ELSE $3 END WHERE reference=$1 AND mode=$2`,values:[ref,this.provider.mode,status]},
   {text:`WITH changed AS (UPDATE vc_payment_receipts SET status=$3 WHERE reference=$1 AND mode=$2 AND status IN ('paid','review') RETURNING account_id,organisation_id),
    personal AS (UPDATE vc_licenses l SET status='revoked' FROM changed c
     WHERE c.organisation_id IS NULL AND l.account_id=c.account_id AND l.status='active' AND l.access_kind='standard'
     AND $1=(SELECT reference FROM vc_payment_receipts p WHERE p.account_id=c.account_id AND p.organisation_id IS NULL AND p.mode=$2 ORDER BY created_at DESC,reference DESC LIMIT 1) RETURNING l.id)
    UPDATE vc_organisations o SET paid_expires_at=LEAST(paid_expires_at,now()) FROM changed c WHERE o.id=c.organisation_id
     AND $1=(SELECT reference FROM vc_payment_receipts p WHERE p.organisation_id=o.id AND p.mode=$2 ORDER BY created_at DESC,reference DESC LIMIT 1)`,values:[ref,this.provider.mode,status]},
   {text:"UPDATE vc_payment_receipts SET status='refunded' WHERE reference=$1 AND mode=$2 AND status='disputed' AND $3='refunded'",values:[ref,this.provider.mode,status]}
  ]);
  // AI refresh checks current entitlement. Retaining session identities avoids signing out
  // newer payments or unrelated personal/organisation grants; cached leases still have their normal expiry.
 }
}
