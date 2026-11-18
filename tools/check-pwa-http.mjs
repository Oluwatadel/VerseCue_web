import assert from 'node:assert/strict';
const base=process.env.VERSECUE_TEST_URL||'http://127.0.0.1:3093';
for(const kind of ['admin','support']){
 const manifest=await fetch(base+'/pwa/'+kind+'.webmanifest');assert.equal(manifest.status,200);assert.match(manifest.headers.get('content-type')||'',/manifest\+json|application\/json/);const data=await manifest.json();assert.equal(data.id,'/pwa/'+kind);console.log('PASS '+kind+' manifest served with JSON MIME');
 const worker=await fetch(base+'/'+kind+'-sw.js');assert.equal(worker.status,200);assert.match(worker.headers.get('content-type')||'',/javascript/);assert.match(worker.headers.get('cache-control')||'',/no-store/);console.log('PASS '+kind+' worker has JavaScript MIME and fresh-update headers');
 for(const icon of data.icons){const result=await fetch(base+icon.src);assert.equal(result.status,200);assert.equal(Buffer.from(await result.arrayBuffer()).subarray(1,4).toString(),'PNG');}
}
const admin=await fetch(base+'/api/admin/support');assert.equal(admin.status,401);assert.match(admin.headers.get('cache-control')||'',/no-store/);console.log('PASS PWA cannot bypass admin API sign-in or cache unauthorized responses');
const redirect=await fetch(base+'/admin/support',{redirect:'manual'});assert.ok([302,307].includes(redirect.status));assert.ok(new URL(redirect.headers.get('location'),base).pathname==='/admin/login');
for(const [page,manifest] of [['/admin/login','admin'],['/account/login','support']]){const response=await fetch(base+page);assert.equal(response.status,200);const html=await response.text();assert.ok(html.includes('/pwa/'+manifest+'.webmanifest'));assert.ok(html.includes('apple-mobile-web-app-capable'));console.log('PASS '+manifest+' login retains install metadata without granting access');}
const offline=await fetch(base+'/pwa/offline.html');assert.equal(offline.status,200);assert.ok((await offline.text()).includes('Offline messages are not queued'));
console.log('PWA production HTTP checks passed. No authenticated account or payment action was made.');
