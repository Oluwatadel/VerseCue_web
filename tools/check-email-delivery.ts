import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readdir,readFile} from 'node:fs/promises';
import {EmailService} from '../lib/email-service';
import {emailRejection} from '../lib/email-errors';
import {hash} from '../lib/licensing-security';
import type {LicensingDb,Statement} from '../lib/licensing-db';
async function main(){let checks=0;const check=(value:unknown,label:string)=>{assert.ok(value,label);checks++;console.log('PASS '+label);};const pg=new PGlite();try{
 for(const f of (await readdir('db')).filter(f=>/^\d+.*\.sql$/.test(f)).sort())await pg.exec(await readFile('db/'+f,'utf8'));
 const db:LicensingDb={query:async(t,v=[]) => (await pg.query(t,v)).rows as any[],transaction:async(items:Statement[])=>pg.transaction(async tx=>{const r:any[]=[];for(const i of items)r.push((await tx.query(i.text,i.values||[])).rows);return r;})};
 check(emailRejection(403,{message:'You can only send testing emails to your own email address private@example.invalid.'}).includes('test-sender restriction'),'test-only sender restriction gives an actionable domain instruction');
 check(emailRejection(403,{message:'The private.invalid domain is not verified'}).includes('domain is not verified'),'unverified sender domain is identified');
 for(const [status,name,text] of [[401,'validation_error','invalid'],[403,'restricted_api_key','permission'],[403,'daily_quota_exceeded','Daily'],[429,'rate_limit_exceeded','rate limit'],[500,'application_error','temporarily unavailable']] as const)check(emailRejection(status,{name}).includes(text),'safe error for '+name);
 check(!emailRejection(403,{name:'validation_error',message:'private@example.invalid token=secret'}).includes('secret'),'raw provider messages cannot leak secrets or recipients into admin errors');
 let requests=0;const sentId='11111111-1111-4111-8111-111111111111';const mail=new EmailService(db,' re_fixture ',' VerseCue <sender@example.invalid> ',async(_url,options)=>{requests++;const body=JSON.parse(String(options?.body));if(body.subject==='reject')return Response.json({name:'validation_error',message:'Only private recipient invalid'},{status:422});return Response.json({id:sentId});});
 await mail.queue('first-failure',null,'recipient@example.invalid','reject','private body');await mail.queue('next-valid',null,'recipient@example.invalid','valid','private body');const result=await mail.dispatch(2);check(result.sent===1&&result.failed===1&&requests===2,'recipient-specific failure does not block another queued email');
 const [accepted]=await db.query("SELECT state,provider_message_id,text_body FROM vc_email_outbox WHERE id='next-valid'");check(accepted.state==='sent'&&accepted.provider_message_id===sentId&&accepted.text_body==='','provider ID is retained and accepted message body cleared');
 const [failed]=await db.query("SELECT state,last_error FROM vc_email_outbox WHERE id='first-failure'");check(failed.state==='queued'&&failed.last_error.includes('HTTP 422')&&!failed.last_error.includes('private'),'queued rejection contains safe actionable reason');
 await mail.dispatch(1,'next-valid');check(requests===2,'accepted email is never resent by a manual retry');
 await mail.queue('unrelated-welcome',null,'recipient@example.invalid','welcome','welcome');const resetId='reset:'+hash('reset-fixture');await db.query("INSERT INTO vc_password_resets(token_hash,account_id,expires_at) SELECT $1,id,now()+interval '1 hour' FROM vc_accounts LIMIT 1",[hash('reset-fixture')]);
 // Insert a dedicated account so the reset fixture has the same constraints as production.
 await db.query("INSERT INTO vc_accounts(id,email,password_hash,organisation_name) VALUES('22222222-2222-4222-8222-222222222222','reset@example.invalid','fixture','Church')");await db.query("INSERT INTO vc_password_resets(token_hash,account_id,expires_at) VALUES($1,'22222222-2222-4222-8222-222222222222',now()+interval '1 hour')",[hash('reset-fixture')]);await mail.queue(resetId,'22222222-2222-4222-8222-222222222222','reset@example.invalid','reset','private reset link');await mail.dispatch(1,resetId);
 check((await db.query('SELECT state FROM vc_email_outbox WHERE id=$1',[resetId]))[0].state==='sent'&&(await db.query("SELECT state FROM vc_email_outbox WHERE id='unrelated-welcome'"))[0].state==='queued','password reset can be delivered directly ahead of older queue entries');
 const expired='reset:'+hash('expired');await db.query("INSERT INTO vc_password_resets(token_hash,account_id,expires_at) VALUES($1,'22222222-2222-4222-8222-222222222222',now()-interval '1 second')",[hash('expired')]);await mail.queue(expired,null,'reset@example.invalid','reset','expired private reset link');await mail.dispatch(1,expired);check((await db.query('SELECT state,text_body FROM vc_email_outbox WHERE id=$1',[expired]))[0].state==='cancelled','expired reset link is cancelled before sending');
 let globalCalls=0;const limited=new EmailService(db,'re_fixture','VerseCue <sender@example.invalid>',async()=>{globalCalls++;return Response.json({name:'rate_limit_exceeded'},{status:429});});await limited.dispatch(20);check(globalCalls===1,'global rate limit stops the batch without hammering the provider');
 console.log(checks+' email delivery checks passed with simulated Resend responses. No real emails sent.');
 }finally{await pg.close();}}
main().catch(e=>{console.error(e);process.exitCode=1;});
