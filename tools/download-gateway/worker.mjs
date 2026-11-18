// Deploy behind downloads.YOUR-DOMAIN. Origins and the HMAC secret stay server-side.
const encoder=new TextEncoder();
const b64=bytes=>btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
const unb64=value=>Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),c=>c.charCodeAt(0));
async function verify(ticket,secret){try{const[payload,signature,...extra]=ticket.split('.');if(extra.length||!payload||!signature||payload.length>2048)return null;const key=await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);if(!await crypto.subtle.verify('HMAC',key,unb64(signature),encoder.encode(payload)))return null;const data=JSON.parse(new TextDecoder().decode(unb64(payload)));return data.exp>Date.now()/1000&&data.exp<Date.now()/1000+1801&&['windows','android'].includes(data.kind)&&/^[a-f0-9]{64}$/.test(data.nonce)?data:null;}catch{return null;}}
const cookie=(request,name)=>request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith(name+'='))?.slice(name.length+1)||'';
const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const denied=(message,status=403)=>new Response(message,{status,headers});
export default {async fetch(request,env){try{
 const url=new URL(request.url);if(!['GET','HEAD'].includes(request.method))return denied('Method not allowed',405);
 if(!env.DOWNLOAD_GATEWAY_SECRET||env.DOWNLOAD_GATEWAY_SECRET.length<32)return denied('Downloads are not configured',503);
 const site=new URL(env.WEBSITE_URL);if(site.protocol!=='https:')return denied('Invalid website configuration',503);
 if(url.pathname==='/start'){
  const kind=url.searchParams.get('kind');if(!['windows','android'].includes(kind))return denied('Invalid platform',400);
  const nonce=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');const next=new URL('/api/download/authorize',site);next.searchParams.set('nonce',nonce);next.searchParams.set('kind',kind);
  return new Response(null,{status:303,headers:{...headers,Location:next.href,'Set-Cookie':'__Host-vvio-download-nonce='+nonce+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=600'}});
 }
 if(url.pathname==='/callback'){
  const ticket=url.searchParams.get('ticket')||'',grant=await verify(ticket,env.DOWNLOAD_GATEWAY_SECRET);
  if(!grant||cookie(request,'__Host-vvio-download-nonce')!==grant.nonce)return denied('This download belongs to another browser or has expired. Start again on the website.');
  const response=new Response(null,{status:303,headers:{...headers,Location:'/download/'+grant.kind}});
  response.headers.append('Set-Cookie','__Host-vvio-download='+ticket+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=1800');response.headers.append('Set-Cookie','__Host-vvio-download-nonce=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0');return response;
 }
 const nativeUpdate=url.pathname==='/update/verseVIO-Setup.exe';const kind=nativeUpdate?'windows':url.pathname==='/download/windows'?'windows':url.pathname==='/download/android'?'android':null;if(!kind)return denied('Not found',404);
 const grant=await verify(nativeUpdate?(request.headers.get('authorization')?.replace(/^Bearer /i,'')||''):cookie(request,'__Host-vvio-download'),env.DOWNLOAD_GATEWAY_SECRET);if(!grant||grant.kind!==kind)return denied('Sign in on the website and start your download again.');
 const origin=new URL(kind==='windows'?env.WINDOWS_DOWNLOAD_URL:env.MOBILE_ANDROID_DOWNLOAD_URL);if(origin.protocol!=='https:'||origin.username||origin.password)return denied('Installer not configured',503);
 const forward=new Headers();const range=request.headers.get('range');if(range){if(!/^bytes=\d+-\d*$/.test(range))return denied('Unsupported range',416);forward.set('Range',range);}const ifRange=request.headers.get('if-range');if(ifRange)forward.set('If-Range',ifRange);
 const upstream=await fetch(origin,{method:request.method,headers:forward,redirect:'follow'});
 if(![200,206,416].includes(upstream.status)){await upstream.body?.cancel();return denied('Installer temporarily unavailable',502);}
 const result=new Headers(headers);for(const name of ['content-length','content-range','accept-ranges','etag','last-modified']){const value=upstream.headers.get(name);if(value)result.set(name,value);}
 result.set('Content-Type','application/octet-stream');result.set('Content-Disposition','attachment; filename="'+(kind==='windows'?'verseVIO-Setup.exe':'verseVIO-Remote.apk')+'"');
 return new Response(upstream.body,{status:upstream.status,headers:result});
 }catch{return denied('Download unavailable. Please retry from the website.',503);}}};
