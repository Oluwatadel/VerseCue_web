import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sign,createHash,randomUUID} from 'node:crypto';
import {mobileManifest} from '../lib/mobile-updates';
import {releaseUrl,releaseFeed} from '../lib/update-feeds';
import {GET as desktop} from '../app/api/updates/desktop/route';
import {GET as mobile} from '../app/api/updates/mobile/route';
async function main(){
let checks=0;
const key=readFileSync(process.env.UPDATE_TEST_KEY!);
const hash=createHash('sha256').update('bundle').digest('base64url');
const body=Buffer.from(JSON.stringify({id:randomUUID(),createdAt:new Date().toISOString(),runtimeVersion:'1.2.1',metadata:{platform:'android'},launchAsset:{key:'bundle',hash,contentType:'application/javascript',url:'https://github.com/test/releases/download/ota/bundle.hbc'},assets:[]}));
const record={platform:'android',runtimeVersion:'1.2.1',body:body.toString('base64'),signature:sign('RSA-SHA256',body,key).toString('base64')};
const index=JSON.stringify({releases:[record]});
assert.equal(mobileManifest(index,'android','1.2.1')?.body.toString(),body.toString());checks++;
assert.equal(mobileManifest(index,'ios','1.2.1'),null);checks++;
assert.equal(mobileManifest(index,'android','1.2.0'),null);checks++;
assert.throws(()=>mobileManifest(JSON.stringify({releases:[{...record,body:Buffer.concat([body,Buffer.from(' ')]).toString('base64')}]}),'android','1.2.1'));checks++;
assert.throws(()=>mobileManifest(JSON.stringify({releases:[record,record]}),'android','1.2.1'));checks++;
for(const bad of ['http://github.com/test','https://localhost/test','https://github.com@evil.com/test','https://127.0.0.1/test']){assert.throws(()=>releaseUrl(bad));checks++;}
const oldDesktop=process.env.DESKTOP_UPDATE_MANIFEST_URL;const oldMobile=process.env.MOBILE_UPDATE_INDEX_URL;const original=globalThis.fetch;
try{
 delete process.env.DESKTOP_UPDATE_MANIFEST_URL;delete process.env.MOBILE_UPDATE_INDEX_URL;
 assert.equal((await desktop()).status,204);checks++;
 assert.equal((await mobile(new Request('https://test/api'))).status,204);checks++;
 process.env.MOBILE_UPDATE_INDEX_URL='https://github.com/test/index.json';
 globalThis.fetch=async()=>new Response(index);
 const response=await mobile(new Request('https://test/api',{headers:{'expo-platform':'android','expo-runtime-version':'1.2.1'}}));
 assert.equal(response.status,200);assert.equal(await response.text(),body.toString());assert(response.headers.get('expo-signature')?.includes(record.signature));checks+=3;
 assert.equal((await mobile(new Request('https://test/api',{headers:{'expo-platform':'android','expo-runtime-version':'1.3.0'}}))).status,204);checks++;
 globalThis.fetch=async()=>new Response('x'.repeat(101));await assert.rejects(()=>releaseFeed('https://github.com/test/index',100));checks++;
 globalThis.fetch=async()=>new Response(null,{status:302,headers:{location:'http://127.0.0.1/private'}});await assert.rejects(()=>releaseFeed('https://github.com/test/index',100));checks++;
}finally{globalThis.fetch=original;if(oldDesktop===undefined)delete process.env.DESKTOP_UPDATE_MANIFEST_URL;else process.env.DESKTOP_UPDATE_MANIFEST_URL=oldDesktop;if(oldMobile===undefined)delete process.env.MOBILE_UPDATE_INDEX_URL;else process.env.MOBILE_UPDATE_INDEX_URL=oldMobile;}
console.log(`PASS ${checks} public update feed checks.`);
}void main();
