const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{
 const port=3098,base=`http://127.0.0.1:${port}`;
 const output=path.resolve('artifacts/free-account-ui');fs.mkdirSync(output,{recursive:true});
 const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',String(port)],{cwd:process.cwd(),env:{...process.env,VERSECUE_NEXT_DIST_DIR:'.next-account-review',DATABASE_URL:'',ADMIN_PASSWORD:'',ADMIN_SESSION_SECRET:'',NEXT_PUBLIC_WINDOWS_DOWNLOAD_URL:'',WINDOWS_DOWNLOAD_URL:''},stdio:'ignore',windowsHide:true});
 let browser;
 try{
  let ready=false;for(let i=0;i<100;i++){try{if((await fetch(base+'/account/register')).ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,150));}
  assert.ok(ready,'isolated preview starts');
  browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE});
  for(const width of [1440,390,320]){
   const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',error=>errors.push(error.message));
   let signedIn=false;let registration;
   await page.route('**/api/account',route=>route.fulfill({status:signedIn?200:401,contentType:'application/json',body:JSON.stringify(signedIn?{account:{email:'operator@example.invalid',organisationName:'Community Church',deviceName:null,licenses:[]}}:{error:'Please sign in.'})}));
   await page.route('**/api/auth/register',async route=>{registration=route.request().postDataJSON();signedIn=true;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({account:{email:registration.email,organisationName:registration.organisationName}})});});
   await page.goto(base+'/download');await page.getByRole('link',{name:'Create free account',exact:true}).waitFor();
   await page.getByRole('link',{name:'Create free account',exact:true}).click();
   await page.getByRole('heading',{name:'Create your account.'}).waitFor();
   assert.equal(await page.getByLabel('Activation code',{exact:true}).count(),0);
   await page.getByLabel('Email',{exact:true}).fill('operator@example.invalid');await page.getByLabel('Organisation name',{exact:true}).fill('Community Church');await page.getByLabel('Password',{exact:true}).fill('test-password-only');
   assert.ok(await page.getByLabel('Organisation name',{exact:true}).evaluate(input=>input.required));
   await page.screenshot({path:path.join(output,`register-${width}.png`),fullPage:true});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.getByRole('button',{name:'Create free account',exact:true}).click();
   await page.waitForURL(base+'/download');await page.getByRole('button',{name:'Windows installer coming soon',exact:true}).waitFor();
   assert.equal(registration.organisationName,'Community Church');assert.equal(registration.activationCode,undefined);
   await page.goto(base+'/account');await page.getByText('Free tier active.',{exact:false}).waitFor();
   await page.getByLabel('Activation code',{exact:true}).waitFor();
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:path.join(output,`account-${width}.png`),fullPage:true});
   const result=await page.request.get(base+'/api/download/windows',{maxRedirects:0});assert.equal(result.status(),307);assert.match(result.headers().location,/account\/login/);
   await page.route('**/api/auth/login',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({account:{email:'operator@example.invalid'}})}));
   await page.goto(base+'/account/login?next=https://example.invalid');await page.getByLabel('Email',{exact:true}).fill('operator@example.invalid');await page.getByLabel('Password',{exact:true}).fill('test-password-only');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL(base+'/account');
   assert.deepEqual(errors,[]);console.log(`PASS ${width}px: free registration collects email/organisation, requests no activation code, gates downloads and prevents external return redirects.`);await page.close();
  }
  console.log('Free account browser checks passed. Authentication responses were simulated; no live accounts were created.');
 }finally{if(browser)await browser.close();server.kill();}
})().catch(error=>{console.error(error);process.exitCode=1;});
