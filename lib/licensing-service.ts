import { randomBytes, randomUUID, createPrivateKey, createPublicKey, publicEncrypt, sign, constants } from "node:crypto";
import {siteOrigin} from "./billing-plans";
import {organisationAccess,reserveComputer} from "./organisation-devices";
import type { LicensingDb, Row } from "./licensing-db";
import { hash, hashPassword, verifyPassword, normalizeEmail, checkEmail, validateDevice, LicenseError, type Device } from "./licensing-security";
export type IssuerConfig = { signingKey: string; modelKey: string; modelKeyId: string; offlineHours?: number };
export class LicensingService {
 constructor(private db: LicensingDb, private config: IssuerConfig) {}
 async rate(key: string, limit = 10) {
  const rows = await this.db.query(`INSERT INTO vc_auth_buckets(key,window_start,attempts) VALUES($1,now(),1)
   ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN vc_auth_buckets.window_start < now()-interval '15 minutes' THEN 1 ELSE vc_auth_buckets.attempts+1 END,
   window_start=CASE WHEN vc_auth_buckets.window_start < now()-interval '15 minutes' THEN now() ELSE vc_auth_buckets.window_start END RETURNING attempts`,[hash(key)]);
  if(Number(rows[0].attempts)>limit) throw new LicenseError(429,"Too many attempts. Try again in 15 minutes.");
 }
 async challenge() {
  await this.rate("challenge-global",1000);
  await this.db.query("DELETE FROM vc_challenges WHERE expires_at < now()");
  const nonce=randomBytes(32).toString("base64url");
  await this.db.query("INSERT INTO vc_challenges(nonce_hash,expires_at) VALUES($1,now()+interval '3 minutes')",[hash(nonce)]);
  return {nonce};
 }
 private async proof(value: unknown,email: string) {
  const d=validateDevice(value,email);
  const consumed=await this.db.query("DELETE FROM vc_challenges WHERE nonce_hash=$1 AND expires_at>now() RETURNING nonce_hash",[hash(d.nonce)]);
  if(!consumed.length) throw new LicenseError(401,"Device challenge expired. Please retry.");
  return d;
 }
 private configured() {
  const hours=this.config.offlineHours ?? 72;
  try {
   if(Buffer.from(this.config.modelKey,"base64").length!==32 || !/^[a-zA-Z0-9._-]{1,100}$/.test(this.config.modelKeyId) || !Number.isFinite(hours) || hours<1 || hours>168) throw new Error();
   const key=createPrivateKey(this.config.signingKey.replace(/\\n/g,"\n"));
   if(key.asymmetricKeyType!=="rsa" || (key.asymmetricKeyDetails?.modulusLength || 0)<2048) throw new Error();
  } catch { throw new LicenseError(503,"Activation signing is not configured."); }
 }
 requireActivationConfiguration(){this.configured();}
 async register(input: Record<string,any>) {
  this.configured();
  const email=normalizeEmail(input.email); checkEmail(email); await this.rate("register-global",50); await this.rate("register:"+email,5);
  const d=await this.proof(input.device,email); const passwordHash=await hashPassword(String(input.password || ""));
  const code=String(input.activationCode || "").replace(/[^a-z0-9]/gi,"").toUpperCase();
  if(!code) throw new LicenseError(400,"An administrator-issued activation code is required.");
  const rows=await this.db.query(`WITH grant_row AS (
   SELECT id FROM vc_licenses WHERE owner_email=$1 AND code_hash=$2 AND status='active' AND account_id IS NULL AND device_id IS NULL
   AND (expires_at IS NULL OR expires_at>now()) FOR UPDATE
  ), created AS (
   INSERT INTO vc_accounts(id,email,password_hash,device_id,device_public_key,device_name)
   SELECT $3,$1,$4,$5,$6,$7 FROM grant_row ON CONFLICT(email) DO NOTHING RETURNING *
  ), claimed AS (
   UPDATE vc_licenses l SET account_id=a.id,device_id=$5,activated_at=now() FROM created a,grant_row g WHERE l.id=g.id RETURNING l.*
  ) SELECT a.*, l.id AS license_id,l.expires_at FROM created a JOIN claimed l ON l.account_id=a.id`,[email,hash(code),randomUUID(),passwordHash,d.id,d.publicKey,d.name]);
  if(!rows.length) throw new LicenseError(409,"Registration was not completed. Check your code and email, or sign in if you already have an account.");
  return this.desktopResult(rows[0],d);
 }
 private async credentials(emailValue: unknown,password: unknown) {
  const email=normalizeEmail(emailValue); checkEmail(email); await this.rate("login-global",100); await this.rate("login:"+email);
  const rows=await this.db.query("SELECT * FROM vc_accounts WHERE email=$1",[email]);
  const account=rows[0];
  // A fixed-cost dummy hash avoids a cheap unknown-account timing path.
  const dummy="scrypt$131072$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
  const valid=await verifyPassword(String(password || ""),account?.password_hash || dummy);
  if(!account || !valid || account.status!=="active") throw new LicenseError(401,"Email or password is incorrect, or the account is unavailable.");
  return account;
 }
 async login(input: Record<string,any>) {
  this.configured();
  const account=await this.credentials(input.email,input.password); const d=await this.proof(input.device,account.email);
  if(account.device_id && (account.device_id!==d.id || account.device_public_key!==d.publicKey)) throw new LicenseError(409,"This account is locked to another computer. Contact the administrator for a device reset.");
  const organisation=await this.organisationAccess(account.id);
  if(organisation){
   const bound=await this.db.query("UPDATE vc_accounts SET device_id=$2,device_public_key=$3,device_name=$4 WHERE id=$1 AND status='active' AND (device_id IS NULL OR (device_id=$2 AND device_public_key=$3)) RETURNING id",[account.id,d.id,d.publicKey,d.name]);
   if(!bound.length)throw new LicenseError(409,"This account is registered on another computer.");
   await reserveComputer(this.db,organisation.id,account.id,d);
   return this.desktopResult({...account,license_id:organisation.id,expires_at:organisation.unlimited_ai?null:organisation.paid_expires_at},d);
  }
  let license=(await this.db.query("SELECT * FROM vc_licenses WHERE account_id=$1 AND device_id=$2 AND status='active' AND (expires_at IS NULL OR expires_at>now())",[account.id,d.id]))[0];
  if(!license) {
   const code=String(input.activationCode || "").replace(/[^a-z0-9]/gi,"").toUpperCase();
   const rows=await this.db.query(`WITH owner AS (
    SELECT id FROM vc_accounts WHERE id=$1 AND status='active' AND (device_id IS NULL OR (device_id=$2 AND device_public_key=$3)) FOR UPDATE
   ), claim AS (
    UPDATE vc_licenses l SET account_id=$1,device_id=$2,activated_at=now() FROM owner
    WHERE l.owner_email=$4 AND (l.code_hash=$5 OR (l.account_id=$1 AND l.device_id IS NULL)) AND l.status='active' AND (l.expires_at IS NULL OR l.expires_at>now())
    AND (l.account_id IS NULL OR l.account_id=$1) AND (l.device_id IS NULL OR l.device_id=$2) RETURNING l.*
   ), bound AS (UPDATE vc_accounts a SET device_id=$2,device_public_key=$3,device_name=$6 FROM claim WHERE a.id=$1 RETURNING a.id)
   SELECT claim.* FROM claim JOIN bound ON bound.id=claim.account_id`,[account.id,d.id,d.publicKey,account.email,hash(code),d.name]);
   license=rows[0];
  }
  if(!license) throw new LicenseError(403,"A valid activation code is required for this account and computer.");
  return this.desktopResult({...account,license_id:license.id,expires_at:license.expires_at},d);
 }
 private organisation(value: unknown) {
  const name=String(value||'').trim();
  if(name.length<2 || name.length>160 || /[\x00-\x1f]/.test(name)) throw new LicenseError(400,"Enter an organisation name between 2 and 160 characters.");
  return name;
 }
 async webRegister(input: Record<string,any>) {
  const email=normalizeEmail(input.email);checkEmail(email);
  const organisation=this.organisation(input.organisationName);
  await this.rate("register-global",50);await this.rate("web-register:"+email,5);
  const passwordHash=await hashPassword(String(input.password||""));
  const rows=await this.db.query(`INSERT INTO vc_accounts(id,email,password_hash,organisation_name)
   VALUES($1,$2,$3,$4) ON CONFLICT(email) DO NOTHING RETURNING id,email,organisation_name`,[randomUUID(),email,passwordHash,organisation]);
  if(!rows.length)throw new LicenseError(409,"This email already has an account. Sign in to continue.");
  return {session:await this.newSession(rows[0].id,null),account:rows[0]};
 }
 async updateProfile(token: string, organisationName: unknown) {
  const account=await this.account(token);const organisation=this.organisation(organisationName);
  await this.db.query("UPDATE vc_accounts SET organisation_name=$2 WHERE id=$1",[account.id,organisation]);
  return {message:"Organisation saved."};
 }
 async recordDownload(token: string) {
  const account=await this.account(token);
  if(account.session_kind!=="web")throw new LicenseError(401,"Sign in on the website to download VerseCue.");
  if(!account.organisation_name?.trim())throw new LicenseError(400,"Add your organisation name on your account page before downloading.");
  await this.db.query("INSERT INTO vc_downloads(id,account_id) VALUES($1,$2)",[randomUUID(),account.id]);
 }
 async freeDesktopLogin(input: Record<string,any>) {
  const account=await this.credentials(input.email,input.password);const d=await this.proof(input.device,account.email);
  if(!account.organisation_name?.trim())throw new LicenseError(403,"Add your organisation name on the website before signing into VerseCue.");
  const rows=await this.db.query(`UPDATE vc_accounts SET device_id=$2,device_public_key=$3,device_name=$4
   WHERE id=$1 AND status='active' AND (device_id IS NULL OR (device_id=$2 AND device_public_key=$3))
   RETURNING id,email,organisation_name`,[account.id,d.id,d.publicKey,d.name]);
  if(!rows.length){
   // Personal accounts retain the existing atomic one-computer binding above.
   // Only explicit, active multi-computer organisation membership permits an additional computer.
   const org=await this.organisationAccess(account.id);
   if(!org?.multi_device)throw new LicenseError(409,"This account is registered on another computer. Contact your administrator for a computer reset.");
   await reserveComputer(this.db,org.id,account.id,d);
  }
  return {session:await this.newSession(account.id,d.id,"free"),email:account.email,organisationName:account.organisation_name,deviceId:d.id,expiresAt:new Date(Date.now()+30*86400000).toISOString()};
 }
 async freeDesktopRefresh(token: string, value: unknown) {
  const account=await this.account(token);const d=await this.proof(value,account.email);
  if(account.session_kind!=="free" || !await this.registeredSessionComputer(account,d))
   throw new LicenseError(409,"This account session does not belong to this computer. Sign in again.");
  return {email:account.email,organisationName:account.organisation_name,deviceId:d.id,expiresAt:new Date(account.session_expires_at).toISOString()};
 }
 async recordUsage(token: string,input: Record<string,any>) {
  const account=await this.account(token);
  if(account.session_kind!=="free" || !await this.registeredSessionComputer(account))throw new LicenseError(401,"A registered desktop account session is required.");
  const buckets=input.buckets;
  if(!Array.isArray(buckets)||buckets.length<1||buckets.length>120)throw new LicenseError(400,"Send between 1 and 120 usage minutes.");
  const now=Date.now()/1000;
  for(const bucket of buckets) {
   if(!bucket||!Number.isSafeInteger(bucket.minute)||bucket.minute%60!==0||bucket.minute<now-31*86400||bucket.minute>now+300||
    !Number.isInteger(bucket.runningSeconds)||bucket.runningSeconds<1||bucket.runningSeconds>60||
    !Number.isInteger(bucket.activeSeconds)||bucket.activeSeconds<0||bucket.activeSeconds>bucket.runningSeconds)
    throw new LicenseError(400,"Invalid usage minute.");
  }
  const d=await this.proof(input.device,account.email);
  if(!await this.registeredSessionComputer(account,d))throw new LicenseError(409,"Usage must come from the registered computer.");
  await this.db.transaction(buckets.map(bucket=>({text:`INSERT INTO vc_usage_minutes(account_id,device_id,minute_utc,running_seconds,active_seconds)
   VALUES($1,$2,to_timestamp($3),$4,$5) ON CONFLICT(account_id,device_id,minute_utc)
   DO UPDATE SET running_seconds=GREATEST(vc_usage_minutes.running_seconds,EXCLUDED.running_seconds),
   active_seconds=GREATEST(vc_usage_minutes.active_seconds,EXCLUDED.active_seconds),received_at=now()`,values:[account.id,d.id,bucket.minute,bucket.runningSeconds,bucket.activeSeconds]})));
  return {accepted:buckets.length};
 }
 async analytics() {
  const [totals]=await this.db.query(`SELECT
   (SELECT count(*)::int FROM vc_accounts) AS users,
   (SELECT count(*)::int FROM vc_downloads) AS downloads,
   (SELECT count(DISTINCT account_id)::int FROM vc_downloads) AS downloaders,
   (SELECT COALESCE(sum(running_seconds),0)::float8 FROM vc_usage_minutes) AS running_seconds,
   (SELECT COALESCE(sum(active_seconds),0)::float8 FROM vc_usage_minutes) AS active_seconds,
   (SELECT count(DISTINCT account_id)::int FROM vc_usage_minutes WHERE minute_utc>=now()-interval '30 days') AS desktop_users_30d`);
  const daily=await this.db.query(`SELECT to_char(minute_utc AT TIME ZONE 'UTC','YYYY-MM-DD') AS day,
   sum(running_seconds)::float8 AS running_seconds,sum(active_seconds)::float8 AS active_seconds,count(DISTINCT account_id)::int AS users
   FROM vc_usage_minutes WHERE minute_utc>=now()-interval '30 days' GROUP BY 1 ORDER BY 1`);
  const accounts=await this.db.query(`SELECT a.id,a.email,a.organisation_name,a.status,COALESCE(d.downloads,0) AS downloads,
   COALESCE(u.running_seconds,0)::float8 AS running_seconds,COALESCE(u.active_seconds,0)::float8 AS active_seconds,u.last_seen
   FROM vc_accounts a LEFT JOIN (SELECT account_id,count(*)::int AS downloads FROM vc_downloads GROUP BY account_id)d ON d.account_id=a.id
   LEFT JOIN (SELECT account_id,sum(running_seconds) AS running_seconds,sum(active_seconds) AS active_seconds,max(minute_utc) AS last_seen
    FROM vc_usage_minutes GROUP BY account_id)u ON u.account_id=a.id ORDER BY u.last_seen DESC NULLS LAST,a.created_at DESC LIMIT 100`);
  return {totals,daily,accounts};
 }
 async aiStatus(token:string){
  const account=await this.account(token);
  if(account.session_kind!=="free"||!await this.registeredSessionComputer(account))throw new LicenseError(401,"Sign in to VerseCue again.");
  if(account.licenses.some(license=>license.access_kind==='organisation'))return {active:true};
  const rows=await this.db.query("SELECT id FROM vc_licenses WHERE account_id=$1 AND status='active' AND (device_id IS NULL OR device_id=$2) AND (expires_at IS NULL OR expires_at>now())",[account.id,account.session_device]);
  return {active:rows.length>0};
 }
 async claimAi(token:string,value:unknown){
  this.configured();const account=await this.account(token);const d=await this.proof(value,account.email);
  if(account.session_kind!=="free"||!await this.registeredSessionComputer(account,d))throw new LicenseError(409,"This activation must use the registered computer.");
  const organisation=account.licenses.find(license=>license.access_kind==='organisation');
  if(organisation){await reserveComputer(this.db,organisation.id,account.id,d);return this.desktopResult({...account,license_id:organisation.id,expires_at:organisation.expires_at},d);}
  const rows=await this.db.query(`UPDATE vc_licenses SET device_id=$2 WHERE account_id=$1 AND status='active' AND (device_id IS NULL OR device_id=$2) AND (expires_at IS NULL OR expires_at>now()) RETURNING id,expires_at`,[account.id,d.id]);
  if(!rows.length)throw new LicenseError(403,"No active AI access yet. Complete payment or request complimentary access.");
  return this.desktopResult({...account,license_id:rows[0].id,expires_at:rows[0].expires_at},d);
 }
 async requestPasswordReset(emailValue:unknown){
  const email=normalizeEmail(emailValue);checkEmail(email);await this.rate('password-reset-global',100);await this.rate('password-reset:'+email,5);
  const rows=await this.db.query("SELECT id,email FROM vc_accounts WHERE email=$1 AND status='active'",[email]);
  if(rows[0]){
   const token=randomBytes(32).toString('base64url');
   await this.db.query("INSERT INTO vc_password_resets(token_hash,account_id,expires_at) VALUES($1,$2,now()+interval '1 hour')",[hash(token),rows[0].id]);
   return {account:rows[0],token};
  }
  return null;
 }
 async resetPassword(tokenValue:unknown,password:unknown){
  const token=String(tokenValue||'');if(!/^[A-Za-z0-9_-]{43}$/.test(token))throw new LicenseError(400,"Invalid or expired password reset link.");
  const passwordHash=await hashPassword(String(password||''));
  const results=await this.db.transaction([
   {text:`WITH consumed AS (DELETE FROM vc_password_resets WHERE token_hash=$1 AND expires_at>now() RETURNING account_id)
    UPDATE vc_accounts a SET password_hash=$2,revision=revision+1 FROM consumed c WHERE a.id=c.account_id AND a.status='active' RETURNING a.id`,values:[hash(token),passwordHash]},
   {text:"DELETE FROM vc_sessions WHERE account_id IN (SELECT id FROM vc_accounts WHERE password_hash=$1)",values:[passwordHash]}
  ]);
  if(!results[0].length)throw new LicenseError(400,"Invalid or expired password reset link.");
  return {message:"Password updated. Sign in again on the website and desktop."};
 }
 async webActivate(token: string,codeValue: unknown) {
  this.configured();
  const account=await this.account(token);await this.rate("activate:"+account.id,10);
  const code=String(codeValue||"").replace(/[^a-z0-9]/gi,"").toUpperCase();
  if(!code)throw new LicenseError(400,"Enter your activation code.");
  const rows=await this.db.query(`WITH owner AS (SELECT * FROM vc_accounts WHERE id=$1 AND status='active' FOR UPDATE)
   UPDATE vc_licenses l SET account_id=a.id,device_id=a.device_id,activated_at=COALESCE(l.activated_at,now()) FROM owner a
   WHERE l.owner_email=a.email AND l.code_hash=$2 AND l.status='active' AND (l.expires_at IS NULL OR l.expires_at>now())
   AND (l.account_id IS NULL OR l.account_id=a.id) AND (l.device_id IS NULL OR l.device_id=a.device_id) RETURNING l.id`,[account.id,hash(code)]);
  if(!rows.length)throw new LicenseError(403,"This activation code is invalid, expired or belongs to another account.");
  return {message:account.device_id?"AI activation updated for your registered computer. Sign in to VerseCue to refresh access.":"AI activated. Sign in to the desktop app to register your first computer and unlock AI."};
 }
 async webLogin(email: unknown,password: unknown) {
  const account=await this.credentials(email,password);
  return {session:await this.newSession(account.id,null),account:{email:account.email,id:account.id,organisationName:account.organisation_name}};
 }
 private async newSession(accountId: string,deviceId: string|null,kind=deviceId?"ai":"web") {
  const token=randomBytes(32).toString("base64url");
  await this.db.query("INSERT INTO vc_sessions(token_hash,account_id,device_id,kind,expires_at) VALUES($1,$2,$3,$4,now()+interval '30 days')",[hash(token),accountId,deviceId,kind]);
  return token;
 }
 private organisationAccess(accountId:string){return organisationAccess(this.db,accountId);}
 private async registeredSessionComputer(account:Row,d?:Device){
  const id=d?.id||account.session_device;
  if(!id||account.session_device!==id)return false;
  if(account.device_id===id)return !d||account.device_public_key===d.publicKey;
  // A secondary computer must have been reserved with its signed public key and an explicit multi-PC policy.
  const rows=await this.db.query(`SELECT c.public_key FROM vc_organisation_devices c
   JOIN vc_organisation_members m ON m.organisation_id=c.organisation_id AND m.account_id=c.account_id
   JOIN vc_organisations o ON o.id=c.organisation_id
   WHERE c.account_id=$1 AND c.device_id=$2 AND c.status='active' AND m.status='approved' AND o.status='active' AND o.multi_device`,[account.id,id]);
  return rows.some(row=>!d||row.public_key===d.publicKey);
 }
 async account(token: string): Promise<Row & {licenses: Row[]}> {
  const rows=await this.db.query(`SELECT a.id,a.email,a.organisation_name,a.status,a.device_id,a.device_public_key,a.device_name,a.revision,s.device_id AS session_device,s.kind AS session_kind,s.expires_at AS session_expires_at
   FROM vc_sessions s JOIN vc_accounts a ON a.id=s.account_id WHERE s.token_hash=$1 AND s.expires_at>now() AND a.status='active'`,[hash(token)]);
  if(!rows.length) throw new LicenseError(401,"Please sign in again.");
  const a=rows[0]; const licenses=await this.db.query("SELECT id,status,access_kind,expires_at,activated_at FROM vc_licenses WHERE account_id=$1 ORDER BY created_at DESC",[a.id]);
  const organisation=await this.organisationAccess(a.id);
  if(organisation)licenses.push({id:organisation.id,status:'active',access_kind:'organisation',expires_at:organisation.unlimited_ai?null:organisation.paid_expires_at,organisation_name:organisation.name,activated_at:null});
  return {...a,licenses};
 }
 async refresh(token: string,value: unknown) {
  this.configured();
  const account=await this.account(token); const d=await this.proof(value,account.email);
  if(account.session_kind!=="ai" || !await this.registeredSessionComputer(account,d)) throw new LicenseError(409,"This session does not belong to this computer.");
  const organisation=account.licenses.find(license=>license.access_kind==='organisation');
  if(organisation){await reserveComputer(this.db,organisation.id,account.id,d);return {lease:this.lease({...account,license_id:organisation.id,expires_at:organisation.expires_at},d),email:account.email};}
  const license=(await this.db.query("SELECT * FROM vc_licenses WHERE account_id=$1 AND device_id=$2 AND status='active' AND (expires_at IS NULL OR expires_at>now())",[account.id,d.id]))[0];
  if(!license) throw new LicenseError(403,"This activation is no longer valid. Contact your administrator.");
  return {lease:this.lease({...account,license_id:license.id,expires_at:license.expires_at},d),email:account.email};
 }
 async logout(token: string) { await this.db.query("DELETE FROM vc_sessions WHERE token_hash=$1",[hash(token)]); }
 private async desktopResult(account: Row,d: Device) {
  const lease=this.lease(account,d);
  return {session:await this.newSession(account.id,d.id),lease,email:account.email};
 }
 private lease(account: Row,d: Device) {
  const key=Buffer.from(this.config.modelKey,"base64");
  if(key.length!==32 || !this.config.modelKeyId || !this.config.signingKey) throw new LicenseError(503,"Activation signing is not configured.");
  const now=Date.now(); const expiry=Math.min(now+Math.min(this.config.offlineHours || 72,168)*3600000,account.expires_at ? new Date(account.expires_at).getTime() : Infinity);
  const wrapped=publicEncrypt({key:createPublicKey({key:Buffer.from(d.publicKey,"base64"),format:"der",type:"spki"}),padding:constants.RSA_PKCS1_OAEP_PADDING,oaepHash:"sha256"},key).toString("base64");
  const payload=Buffer.from(JSON.stringify({version:1,iss:"versecue",aud:"desktop",features:["ai-transcription","automatic-verse-detection"],accountId:account.id,licenseId:account.license_id,deviceId:d.id,revision:account.revision,
   issuedAt:new Date(now).toISOString(),expiresAt:new Date(expiry).toISOString(),modelKeyId:this.config.modelKeyId,wrappedModelKey:wrapped})).toString("base64url");
  const signature=sign("sha256",Buffer.from(payload),{key:createPrivateKey(this.config.signingKey.replace(/\\n/g,"\n")),padding:constants.RSA_PKCS1_PSS_PADDING,saltLength:32}).toString("base64url");
  return `${payload}.${signature}`;
 }
 async grantFree(email: unknown,expires?: unknown) { return this.issue(email,expires,true); }
 async issue(emailValue: unknown,expiresValue?: unknown,complimentary=false) {
  const email=normalizeEmail(emailValue); checkEmail(email);
  if(complimentary) {
   const existing=(await this.db.query("SELECT status FROM vc_accounts WHERE email=$1",[email]))[0];
   if(existing?.status==="blocked")throw new LicenseError(409,"Unblock this account before granting complimentary AI access.");
  }
  const expires=expiresValue ? new Date(String(expiresValue)) : null;
  if(expires && (!Number.isFinite(expires.getTime()) || expires.getTime()<=Date.now())) throw new LicenseError(400,"Choose a future expiry date.");
  const code="VC-"+randomBytes(18).toString("hex").toUpperCase().match(/.{1,6}/g)!.join("-");
  const id=randomUUID();
  const issued=await this.db.transaction([
   {text:"UPDATE vc_licenses SET status='revoked' WHERE owner_email=$1 AND status='active'",values:[email]},
   {text:`INSERT INTO vc_licenses(id,owner_email,code_hash,expires_at,access_kind,account_id,device_id,activated_at)
    SELECT $1,$2,$3,$4,$5,CASE WHEN $5='complimentary' THEN a.id ELSE NULL END,
     CASE WHEN $5='complimentary' THEN a.device_id ELSE NULL END,
     CASE WHEN $5='complimentary' AND a.id IS NOT NULL THEN now() ELSE NULL END
    FROM (VALUES(1)) seed(v) LEFT JOIN vc_accounts a ON a.email=$2 AND a.status='active'
    RETURNING account_id`,values:[id,email,hash(code.replace(/-/g,"")),expires?.toISOString() || null,complimentary?"complimentary":"standard"]},
   {text:"INSERT INTO vc_license_audit(id,action,subject) VALUES($1,$2,$3)",values:[randomUUID(),complimentary?"grant-complimentary":"issue",email]},
   {text:"UPDATE vc_email_outbox SET state='cancelled',text_body='' WHERE activation_license_id IN (SELECT id FROM vc_licenses WHERE owner_email=$1 AND status='revoked') AND state='queued'",values:[email]},
   {text:`INSERT INTO vc_email_outbox(id,account_id,recipient,subject,text_body,activation_license_id)
    SELECT $1,a.id,$2,'Your VerseCue AI activation',CASE WHEN $3::boolean AND a.id IS NOT NULL
     THEN $4 ELSE $5 END,$6 FROM (VALUES(1)) seed(v) LEFT JOIN vc_accounts a ON a.email=$2`,
    values:['activation:'+id,email,complimentary,`Complimentary AI access has been granted to your VerseCue account. No code is needed: open VerseCue and choose Activate AI. Manage any existing auto-renewal at ${siteOrigin()}/account/upgrade.`,
     `Your VerseCue AI activation code is ${code}. It is assigned to ${email}. Create a free account with this email if needed, sign in at ${siteOrigin()}/account, and enter the code under Activate or renew AI. Then open VerseCue to activate on your registered computer. ${expires?'Licence expiry: '+expires.toISOString()+'.':''}`,id]},
  ]);
  const attached=complimentary && !!issued[1][0]?.account_id;
  return {id,code,email,complimentary,attached,emailQueued:true,message:complimentary
   ? attached?"Complimentary AI access granted. This user can sign in directly on their registered computer; no code redemption is needed."
    :"Complimentary AI access granted. Ask the recipient to create a free account, then redeem this code on their account page."
   :"Activation code issued."};
 }
 async adminList() {
  return {accounts:await this.db.query("SELECT a.id,a.email,a.organisation_name,a.status,a.device_name,a.device_id,a.created_at,(SELECT count(*)::int FROM vc_downloads d WHERE d.account_id=a.id) AS downloads FROM vc_accounts a ORDER BY a.created_at DESC LIMIT 500"),
   licenses:await this.db.query("SELECT id,owner_email,account_id,device_id,status,access_kind,expires_at,activated_at,created_at FROM vc_licenses ORDER BY created_at DESC LIMIT 500")};
 }
 async adminAction(action: string,id: string) {
  if(!/^[0-9a-f-]{36}$/i.test(id)) throw new LicenseError(400,"Invalid record.");
  const statements = action === "reset-device" ? [
   {text:"SELECT id FROM vc_organisations WHERE id IN (SELECT organisation_id FROM vc_organisation_devices WHERE account_id=$1) ORDER BY id FOR UPDATE",values:[id]},
   {text:"UPDATE vc_organisation_devices SET status='released' WHERE account_id=$1",values:[id]},
   {text:"UPDATE vc_accounts SET device_id=NULL,device_public_key=NULL,device_name=NULL,revision=revision+1 WHERE id=$1",values:[id]},
   {text:"UPDATE vc_licenses SET status='revoked' WHERE account_id=$1",values:[id]},
   {text:"DELETE FROM vc_sessions WHERE account_id=$1",values:[id]},
  ] : action === "block" || action === "unblock" ? [
   {text:"UPDATE vc_accounts SET status=$2,revision=revision+1 WHERE id=$1",values:[id,action==="block"?"blocked":"active"]},
   {text:"DELETE FROM vc_sessions WHERE account_id=$1",values:[id]},
  ] : action === "revoke" ? [
   {text:"UPDATE vc_licenses SET status='revoked' WHERE id=$1",values:[id]},
   {text:"DELETE FROM vc_sessions WHERE kind='ai' AND account_id=(SELECT account_id FROM vc_licenses WHERE id=$1)",values:[id]},
  ] : null;
  if(!statements) throw new LicenseError(400,"Unknown action.");
  await this.db.transaction([...statements,{text:"INSERT INTO vc_license_audit(id,action,subject) VALUES($1,$2,$3)",values:[randomUUID(),action,id]}]);
  return {message:action==="reset-device"?"Device reset. The old code is revoked; issue a new activation code for this account.":"Account/licence updated."};
 }
}
export function issuerConfig(): IssuerConfig {
 return {signingKey:process.env.ACTIVATION_PRIVATE_KEY_PEM || "",modelKey:process.env.MODEL_CONTENT_KEY_BASE64 || "",modelKeyId:process.env.MODEL_KEY_ID || "",offlineHours:Number(process.env.ACTIVATION_OFFLINE_HOURS || 72)};
}
