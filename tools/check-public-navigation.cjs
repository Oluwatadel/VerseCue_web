const assert=require('node:assert/strict');const {chromium}=require('C:/Users/DELL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Users/DELL/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'});try{for(const width of [1440,390])for(const active of [false,true]){
 const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));let requests=0;
 await page.route('**/api/account',route=>{requests++;return route.fulfill({status:active?200:401,contentType:'application/json',body:JSON.stringify(active?{account:{email:'test@example.invalid'}}:{error:'Please sign in.'})});});
 await page.goto('http://127.0.0.1:31990/features',{waitUntil:'networkidle'});if(width<1024)await page.getByRole('button',{name:'Open menu',exact:true}).click();
 const header=page.locator('header').first();const link=header.getByRole('link',{name:active?'Dashboard':'Login',exact:true});await link.waitFor({state:'visible'});assert.equal(await link.getAttribute('href'),active?'/account':'/account/login');assert.equal(await header.getByRole('link',{name:'Account',exact:true}).count(),0);assert.equal(requests,1);assert.deepEqual(errors,[]);
 await page.screenshot({path:`artifacts/navigation-review/nav-${width}-${active?'member':'guest'}.png`});console.log(`PASS ${width}px ${active?'valid session → Dashboard':'guest → Login'}, correct target, one session lookup, no browser errors`);await context.close();
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
