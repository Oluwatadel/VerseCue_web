import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {readdir,readFile} from 'node:fs/promises';
import {PricingService,validatePricing} from '../lib/pricing-service';
import {DEFAULT_PRICING,quotePlan} from '../lib/billing-plans';
import {BillingService} from '../lib/billing-service';
import {LicensingService} from '../lib/licensing-service';
import {Paystack} from '../lib/paystack';
import {LicenseError} from '../lib/licensing-security';
import type {LicensingDb,Statement} from '../lib/licensing-db';
async function main(){const pg=new PGlite();let checks=0;const check=(value:unknown,message:string)=>{assert.ok(value,message);checks++;console.log('PASS '+message);};try{
 for(const file of (await readdir('db')).filter(f=>/^\d+.*\.sql$/.test(f)).sort())await pg.exec(await readFile('db/'+file,'utf8'));
 const db:LicensingDb={query:async(text,values=[]) => (await pg.query(text,values)).rows as any[],transaction:async(items:Statement[])=>pg.transaction(async tx=>{const result:any[]=[];for(const item of items)result.push((await tx.query(item.text,item.values||[])).rows);return result;})};
 const service=new PricingService(db);const initial=await service.read();check(initial.revision===0&&initial.rates.individual.monthly===6000,'initial quotes retain approved defaults');
 for(const value of [null,{},[],{...DEFAULT_PRICING,individual:{monthly:0}},{...DEFAULT_PRICING,individual:{...DEFAULT_PRICING.individual,monthly:1.5}},{...DEFAULT_PRICING,individual:{...DEFAULT_PRICING.individual,monthly:'6000'}},{...DEFAULT_PRICING,individual:{...DEFAULT_PRICING.individual,annual:1000001}}])assert.throws(()=>validatePricing(value));check(true,'incomplete, non-numeric, fractional and out-of-range rates rejected');
 const rates=structuredClone(DEFAULT_PRICING);rates.individual.monthly=7200;rates.team['six-months']=3200;rates.ten.annual=3900;rates.large.monthly=3300;
 const saved=await service.save(rates,0);check(saved.revision===1&&(await service.read()).rates.individual.monthly===7200,'save persists rates');
 await assert.rejects(()=>service.save(DEFAULT_PRICING,0),(e:any)=>e.status===409);check(true,'stale admin save cannot overwrite newer pricing');
 const concurrent=await Promise.allSettled([service.save(rates,1),service.save(DEFAULT_PRICING,1)]);check(concurrent.filter(r=>r.status==='fulfilled').length===1,'concurrent edits have exactly one winner');
 let current=await service.read();current=await service.save(rates,current.revision);
 for(const [n,id,total] of [[1,'monthly',7200],[2,'six-months',38400],[10,'annual',468000],[11,'monthly',36300]] as const)check(quotePlan(id,n,current.rates)!.amount===total*100,'saved quotes cover '+n+' computers');
 const licensing=new LicensingService(db,{signingKey:'',modelKey:'',modelKeyId:''});const web=await licensing.webRegister({email:'pricing@example.invalid',password:'pricing-test-password-only',organisationName:'Pricing Church'});
 let initialized:any,remotePlan:any,lastReference='';const verified=new Map<string,any>();let nextId=1;
 const provider=new Paystack('sk_test_pricing',async(url,options)=>{const path=new URL(String(url)).pathname;
 if(path==='/plan'){remotePlan={...JSON.parse(String(options?.body)),plan_code:'PLN_custom'};return Response.json({status:true,data:remotePlan});}
 if(path==='/plan/PLN_custom')return Response.json({status:true,data:remotePlan});
 if(path==='/transaction/initialize'){initialized=JSON.parse(String(options?.body));lastReference=initialized.reference;verified.set(lastReference,{id:nextId++,reference:lastReference,status:'success',amount:initialized.amount,currency:'NGN',domain:'test',customer:{email:initialized.email,customer_code:'CUS_pricing'}});return Response.json({status:true,data:{reference:lastReference,authorization_url:'https://checkout.paystack.com/'+lastReference}});}
 if(path.startsWith('/transaction/verify/'))return Response.json({status:true,data:verified.get(path.split('/').pop()!)});
 throw new Error('Unexpected provider path '+path);
 });
 const billing=new BillingService(db,licensing,provider,undefined,false,true);check((await billing.state(web.session)).plans[0].amount===720000,'authenticated billing state uses saved rates');
 await assert.rejects(()=>billing.checkout(web.session,'monthly',false,1,600000),(e:any)=>e instanceof LicenseError&&e.status===409);check(!initialized,'stale customer quote rejected before provider initialization');
 await billing.checkout(web.session,'monthly',false,1,720000);const original=lastReference;check(initialized.amount===720000,'checkout calculates amount using database rates');
 rates.individual.monthly=7500;current=await service.save(rates,current.revision);
 await assert.rejects(()=>billing.checkout(web.session,'monthly',false,1,750000),(e:any)=>e.status===409);check(true,'pending checkout with a different price cannot be silently reused');
 await billing.confirm(original,web.session);check(Number((await db.query('SELECT amount FROM vc_payment_receipts WHERE reference=$1',[original]))[0].amount)===720000,'payment confirms original agreed amount after admin rate change');
 await billing.checkout(web.session,'monthly',true,1,750000);check(initialized.amount===750000&&initialized.plan==='PLN_custom'&&remotePlan.amount===750000,'new recurring checkout creates exact-price Paystack plan');
 const order=lastReference;await billing.confirm(order,web.session);rates.individual.monthly=7800;await service.save(rates,current.revision);check(Number((await db.query('SELECT amount FROM vc_billing_orders WHERE reference=$1',[order]))[0].amount)===750000,'saved orders preserve existing recurring amount');
 check(quotePlan('annual',10000,{...rates,large:{monthly:1000000,'six-months':1000000,annual:1000000}})!.amount===12000000000000,'maximum supported quote retains integer precision');
 console.log(checks+' pricing checks passed with a temporary database and simulated payments.');
 }finally{await pg.close();}}
main().catch(e=>{console.error(e);process.exitCode=1;});
