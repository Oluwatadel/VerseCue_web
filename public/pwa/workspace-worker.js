/* Static offline fallback only. Never cache authenticated HTML, RSC, API or POST data. */
const WORKSPACE=self.registration.scope.includes('/admin')?'admin':'support';
const PREFIX='versevio-workspace-'+WORKSPACE+'-';
const CACHE=PREFIX+'v1';
const ASSETS=['/pwa/offline.html','/pwa/icon-192.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('message',event=>{if(event.data?.type==='APPLY_UPDATE')self.skipWaiting();});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(ASSETS.includes(url.pathname)){event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(url.pathname))||fetch(request)));return;}
 if(request.mode==='navigate'&&url.href.startsWith(self.registration.scope))event.respondWith(fetch(request,{cache:'no-store'}).catch(async()=>{const cache=await caches.open(CACHE);return (await cache.match('/pwa/offline.html'))||new Response('Connect to the internet to open verseVIO.',{status:503,headers:{'Content-Type':'text/plain'}});}));
});
