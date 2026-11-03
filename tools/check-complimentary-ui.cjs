const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {randomBytes,createHmac}=require('node:crypto');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const secret=randomBytes(32).toString('hex'),port=3096,base=`http://127.0.0.1:${port}`;
 const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{cwd:process.cwd(),windowsHide:true,env:{...process.env,NODE_ENV:'production',VERSECUE_NEXT_DIST_DIR:'.next-verification',ADMIN_SESSION_SECRET:secret,DATABASE_URL:''},stdio:['ignore','pipe','pipe']});
 let browser;
 try {
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(new Error('Preview server did not start')),30000);server.stdout.on('data',d=>{if(d.toString().includes('Ready')){clearTimeout(timeout);resolve();}});server.once('exit',code=>{clearTimeout(timeout);reject(new Error('Preview server exited '+code));});});
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||undefined});
  const anonymous=await browser.newContext();assert.equal((await anonymous.request.post(base+'/api/admin/licenses',{data:{action:'grant-free',email:'recipient@example.org'}})).status(),401);await anonymous.close();
  for(const width of [1440,320]){
   const context=await browser.newContext({viewport:{width,height:950}});
   const payload=Buffer.from(JSON.stringify({exp:Date.now()+120000})).toString('base64url');const token=payload+'.'+createHmac('sha256',secret).update(payload).digest('base64url');
   await context.addCookies([{name:'vc_admin_session',value:token,url:base,httpOnly:true,sameSite:'Strict'}]);
   const page=await context.newPage();
   const accounts=[{id:'00000000-0000-4000-8000-000000000001',email:'recipient@example.org',status:'active',device_name:'Church PC',device_id:'a'.repeat(64)}];let licenses=[];
   await page.route('**/api/admin/licenses',async route=>{
    if(route.request().method()==='GET')return route.fulfill({json:{accounts,licenses}});
    const body=route.request().postDataJSON();assert.equal(body.action,'grant-free');const attached=body.email==='recipient@example.org';
    licenses=[{id:'00000000-0000-4000-8000-000000000002',owner_email:body.email,account_id:attached?accounts[0].id:null,device_id:attached?accounts[0].device_id:null,status:'active',access_kind:'complimentary',expires_at:body.expiresAt}];
    return route.fulfill({json:{email:body.email,code:'VC-PRIVATE-TEST-CODE',attached,complimentary:true,message:attached?'Complimentary AI access granted to existing account.':'Share this code privately with the new recipient.'}});
   });
   await page.goto(base+'/admin/licenses',{waitUntil:'networkidle'});
   await page.getByLabel('Access type',{exact:true}).selectOption('complimentary');await page.getByLabel('Account email',{exact:true}).fill('recipient@example.org');
   await page.getByRole('button',{name:'Grant complimentary AI access',exact:true}).click();await page.getByRole('status').filter({hasText:'Complimentary AI access granted to existing account.'}).waitFor();
   assert.equal(await page.locator('code').count(),0);assert.ok(await page.locator('article').filter({hasText:'Complimentary AI access'}).count());
   await page.getByLabel('Account email',{exact:true}).fill('new-recipient@example.org');await page.getByRole('button',{name:'Grant complimentary AI access',exact:true}).click();
   await page.getByText('VC-PRIVATE-TEST-CODE',{exact:true}).waitFor();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   console.log(`PASS ${width}px: complimentary grant selector, direct existing-account grant, new-recipient code and admin-only access`);await context.close();
  }
 } finally {if(browser)await browser.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
