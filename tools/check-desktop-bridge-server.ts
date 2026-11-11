// Isolated HTTP interoperability fixture: real licensing services, in-memory PostgreSQL, no provider calls.
import {createServer} from 'node:http';
import {generateKeyPairSync,randomBytes,randomUUID,createHash} from 'node:crypto';
import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {LicensingService} from '../lib/licensing-service';
import {ActivationDelivery} from '../lib/activation-delivery';
import {LicenseError,hash} from '../lib/licensing-security';
import type {LicensingDb,Statement} from '../lib/licensing-db';
async function main(){
 const pg=new PGlite();for(const f of(await readdir('db')).filter(f=>/^\d+.*\.sql$/.test(f)).sort())await pg.exec(await readFile('db/'+f,'utf8'));
 const db:LicensingDb={query:async(text,values=[]) => (await pg.query(text,values)).rows as any[],transaction:async(items:Statement[])=>pg.transaction(async tx=>{const rows:any[]=[];for(const item of items)rows.push((await tx.query(item.text,item.values||[])).rows);return rows;})};
 const keys=generateKeyPairSync('rsa',{modulusLength:2048}),model=randomBytes(32),control=randomBytes(24).toString('hex');
 const service=new LicensingService(db,{signingKey:keys.privateKey.export({type:'pkcs8',format:'pem'}).toString(),modelKey:model.toString('base64'),modelKeyId:'http-bridge-fixture'}),delivery=new ActivationDelivery(db,service);
 const email='bridge@example.invalid',password='local-bridge-password-only',web=await service.webRegister({email,password,organisationName:'HTTP Bridge Test Church'}),licenceId=randomUUID();let requestId:string|undefined;
 const server=createServer(async(req,res)=>{
  try{
   if(req.method!=='POST')throw new LicenseError(405,'POST required.');
   let text='';for await(const chunk of req){text+=chunk;if(text.length>32768)throw new LicenseError(413,'Too large.');}
   const input=JSON.parse(text||'{}'),token=String(req.headers.authorization||'').replace(/^Bearer /,'');let output:unknown;
   if(req.url==='/control'){
    if(token!==control)throw new LicenseError(401,'Test control token required.');
    if(input.action==='grant'){await db.query("INSERT INTO vc_licenses(id,owner_email,code_hash,account_id,status,expires_at) VALUES($1,$2,$3,$4,'active',now()+interval '1 hour')",[licenceId,email,hash(randomUUID()),web.account.id]);output={granted:true};}
    else if(input.action==='connect'){const state=await delivery.state(web.session);const r=await delivery.connect(web.session,state.devices[0]?.id);requestId=r.id;output=r;}
    else if(input.action==='revoke'){output=await service.adminAction('revoke',licenceId);}
    else if(input.action==='stop'){output={stopped:true};setTimeout(()=>{server.close(()=>{void pg.close().then(()=>process.exit(0));});},50);}
    else{const state=await delivery.state(web.session,requestId);const [count]=await db.query("SELECT count(*)::int AS total FROM vc_sessions WHERE kind='ai'");output={...state,aiSessions:count.total};}
   }else if(req.url==='/api/desktop/challenge')output=await service.challenge();
   else if(req.url==='/api/desktop/account/login')output=await service.freeDesktopLogin(input);
   else if(req.url==='/api/desktop/account/refresh')output=await service.freeDesktopRefresh(token,input.device);
   else if(req.url==='/api/desktop/account/activation-request')output=await delivery.pending(token);
   else if(req.url==='/api/desktop/account/ai-status')output=await service.aiStatus(token);
   else if(req.url==='/api/desktop/account/ai-claim')output=await service.claimAi(token,input.device);
   else if(req.url==='/api/desktop/account/activation-confirm')output=await delivery.confirm(token,input.requestId,input.device);
   else if(req.url==='/api/desktop/refresh')output=await service.refresh(token,input.device);
   else if(req.url==='/api/auth/logout'){await service.logout(token);output={};}
   else throw new LicenseError(404,'Unknown fixture endpoint.');
   res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(output));
  }catch(error){res.writeHead(error instanceof LicenseError?error.status:500,{'Content-Type':'application/json'});res.end(JSON.stringify({error:error instanceof Error?error.message:'Fixture error'}));}
 });
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address() as {port:number};
 await mkdir('artifacts/desktop-bridge',{recursive:true});await writeFile('artifacts/desktop-bridge/fixture.json',JSON.stringify({url:`http://127.0.0.1:${address.port}`,control,email,password,publicKey:keys.publicKey.export({type:'spki',format:'pem'}),modelKeyHash:createHash('sha256').update(model).digest('hex')}));
 console.log('READY: isolated desktop/web HTTP bridge fixture. No real payment or email service is used.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
