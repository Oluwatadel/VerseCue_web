const assert=require('node:assert/strict');
const fs=require('node:fs');const {createHmac}=require('node:crypto');
const {chromium}=require('C:/Users/DELL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.REVIEW_URL||'http://127.0.0.1:31994';
const output='artifacts/glass-theme-review';fs.mkdirSync(output,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Users/DELL/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'});try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const now=Date.now(),expiry=new Date(now+86400000*12).toISOString();
  await page.route('**/api/account',r=>r.fulfill({json:{account:{email:'operator@example.invalid',organisationName:'Grace Church · preview data',deviceName:'Media PC',registeredAt:new Date(now-86400000*90).toISOString(),downloads:{count:2,first:new Date(now-86400000*30).toISOString(),last:new Date(now).toISOString()},licenses:[{id:'fixture',status:'active',expires_at:expiry}]}}}));
  await page.route('**/api/billing/state',r=>r.fulfill({json:{checkoutAvailable:false,testMode:true,payments:[],subscriptions:[],organisations:[],orders:[]}}));
  const accounts=Array.from({length:31},(_,i)=>({id:String(i),email:'operator'+i+'@example.invalid',organisation_name:'Grace Church '+(i+1),downloads:2,computer_count:1,status:'active',subscription_status:i%3?'active':'complimentary',subscription_expires_at:i%3?expiry:null,plan_id:'monthly',registered_at:new Date(now-86400000*30).toISOString(),first_download_at:new Date(now-86400000*20).toISOString(),last_download_at:new Date(now).toISOString()}));
  const daily=Array.from({length:30},(_,i)=>({day:new Date(now-(29-i)*86400000).toISOString().slice(0,10),running_seconds:(90+(i%7)*20+i*2)*60,active_seconds:(60+(i%7)*15)*60,users:7+i%9}));
  await page.route('**/api/admin/analytics',r=>r.fulfill({json:{serverNow:new Date(now).toISOString(),totals:{users:31,downloads:62,downloaders:31,running_seconds:253000,active_seconds:162000,desktop_users_30d:23,active_subscribers:20,complimentary_accounts:11,expiring_soon:3},accounts,daily}}));
  const payload=Buffer.from(JSON.stringify({exp:now+600000})).toString('base64url');const signature=createHmac('sha256','local-glass-review-only-not-production-12345').update(payload).digest('base64url');await context.addCookies([{name:'vc_admin_session',value:payload+'.'+signature,url:base}]);
  for(const path of (process.env.REVIEW_QUICK?['/admin']:['/','/download','/pricing','/account/login','/admin','/account'])){
   await page.goto(base+path,{waitUntil:'networkidle'});
   if(path==='/admin')await page.getByRole('heading',{name:'Admin overview',exact:true}).waitFor();
   if(path==='/account')await page.getByText('Grace Church · preview data',{exact:false}).first().waitFor();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal page overflow '+width+' '+path);
   assert.equal(await page.evaluate(()=>getComputedStyle(document.body).color),'rgb(241, 245, 252)');
   if(path==='/admin'){
    assert.equal(await page.locator('tbody tr').count(),25);await page.getByRole('button',{name:'Next',exact:true}).click();assert.equal(await page.locator('tbody tr').count(),6);
    await page.getByRole('searchbox',{name:'Search accounts'}).fill('operator30@');assert.equal(await page.locator('tbody tr').count(),1);await page.getByRole('searchbox',{name:'Search accounts'}).fill('');
    await page.getByRole('combobox',{name:'Chart measure'}).selectOption('users');
    if(width<1024){await page.getByRole('button',{name:'Open admin menu'}).click();await page.locator('#admin-mobile-navigation').waitFor({state:'visible'});await page.screenshot({path:`${output}/admin-menu-${width}.png`});await page.getByRole('button',{name:'Close admin menu'}).click({position:{x:width-12,y:20}});}
   }
   await page.evaluate(()=>window.scrollTo(0,0));await page.waitForTimeout(120);
   if(path==='/admin'&&width>=1024){assert.equal(Math.round((await page.locator('.workspace-header').boundingBox()).y),0);assert.equal(Math.round((await page.locator('.workspace-sidebar').first().boundingBox()).y),0);}
   await page.screenshot({path:`${output}/${path==='/'?'home':path.replaceAll('/','-').slice(1)}-${width}.png`});
   console.log('PASS '+width+'px '+path+': dark palette, no page overflow, rendered without runtime errors');
  }
  await page.goto(base+'/',{waitUntil:'networkidle'});await page.getByRole('button',{name:'Display sample',exact:true}).click();await page.getByText('Demo output · John 3:16',{exact:true}).waitFor();
  const counts=await page.evaluate(()=>({blurred:[...document.querySelectorAll('*')].filter(e=>getComputedStyle(e).backdropFilter!=='none').length,animations:document.getAnimations().length}));assert(counts.blurred<=2);assert.equal(counts.animations,0);assert.deepEqual(errors,[]);console.log('PASS walkthrough interaction, limited blur, reduced-motion preference and no browser errors at '+width+'px');
  await context.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
