import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
let count=0;const check=(ok,label)=>{assert.ok(ok,label);count++;console.log('PASS '+label);};
const origin='https://versevio.example';
for(const [kind,scope,start] of [['admin','/admin','/admin/support'],['support','/account','/account/support']]){
 const manifest=JSON.parse(await readFile('public/pwa/'+kind+'.webmanifest','utf8'));check(manifest.id==='/pwa/'+kind&&manifest.scope===scope&&manifest.start_url===start,'Stable '+kind+' identity and workspace launch route');check(manifest.display==='standalone'&&manifest.icons.some(i=>i.purpose==='maskable'),kind+' has standalone display and maskable artwork');
 for(const icon of manifest.icons){const png=await readFile('public'+icon.src);const [width,height]=icon.sizes.split('x').map(Number);assert.equal(png.readUInt32BE(16),width);assert.equal(png.readUInt32BE(20),height);}check(true,kind+' icons have actual advertised PNG dimensions');
 const listeners={},stores=new Map();let skipped=0,claimed=0,networkFails=false,networkCalls=[];
 const store=name=>{if(!stores.has(name))stores.set(name,new Map());const entries=stores.get(name);return{addAll:async urls=>{for(const url of urls)entries.set(url,new Response(url.includes('offline')?'OFFLINE':'ICON'));},match:async url=>entries.get(url)?.clone()};};
 const caches={open:async name=>store(name),keys:async()=>[...stores.keys()],delete:async name=>stores.delete(name)};
 const self={registration:{scope:origin+scope},location:{origin},clients:{claim:async()=>{claimed++;}},skipWaiting:()=>{skipped++;},addEventListener:(name,listener)=>listeners[name]=listener};
 vm.runInNewContext(await readFile('public/pwa/workspace-worker.js','utf8'),{self,caches,URL,Response,fetch:async(request,options)=>{networkCalls.push({request,options});if(networkFails)throw new Error('offline');return new Response('PRIVATE NETWORK PAGE');}});
 let pending;listeners.install({waitUntil:p=>pending=p});await pending;check(skipped===0,'Installing '+kind+' never activates an update without consent');
 const current='versevio-workspace-'+kind+'-v1',old='versevio-workspace-'+kind+'-old',other='versevio-workspace-'+(kind==='admin'?'support':'admin')+'-old';stores.set(old,new Map());stores.set(other,new Map());listeners.activate({waitUntil:p=>pending=p});await pending;check(!stores.has(old)&&stores.has(other)&&claimed===1,'Activation cleans only its own obsolete '+kind+' static cache');
 async function request(path,mode='navigate',method='GET'){let response;listeners.fetch({request:{url:path.startsWith('http')?path:origin+path,mode,method},respondWith:p=>response=Promise.resolve(p)});return response?await response:null;}
 const privatePage=await request(start);check(await privatePage.text()==='PRIVATE NETWORK PAGE'&&networkCalls.at(-1).options.cache==='no-store',kind+' navigations use network-only private responses');
 check([...stores.get(current).keys()].every(key=>key.startsWith('/pwa/')),kind+' cache contains only public offline assets');
 for(const [path,mode,method] of [['/api/admin/support','cors','GET'],['/api/account/support','cors','POST'],[start+'?_rsc=private','cors','GET'],['/about','navigate','GET'],['https://external.example/pwa/offline.html','navigate','GET']])assert.equal(await request(path,mode,method),null);check(true,kind+' does not intercept API, mutation, RSC or unrelated requests');
 networkFails=true;check(await(await request(start)).text()==='OFFLINE',kind+' failed navigation gets a static offline screen');
 listeners.message({data:{type:'UNRELATED'}});assert.equal(skipped,0);listeners.message({data:{type:'APPLY_UPDATE'}});check(skipped===1,kind+' updates activate only after explicit request');
}
const config=(await import('../next.config.mjs')).default('phase-production-build');const headers=await config.headers();check(['/admin/:path*','/account/:path*','/api/:path*'].every(path=>headers.some(h=>h.source===path&&h.headers.some(v=>v.key==='Cache-Control'&&v.value.includes('no-store')))),'Private workspace and API routes declare no-store HTTP caching');
console.log(count+' PWA manifest and service-worker checks passed. Browser/phone installation is a separate manual check.');
