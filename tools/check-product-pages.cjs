const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/DELL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async () => {
 const browser = await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || 'C:/Users/DELL/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe'});
 const base=process.env.VERSECUE_TEST_URL || 'http://127.0.0.1:3097';
 const output=path.resolve('artifacts/product-pages-review'); fs.mkdirSync(output,{recursive:true});
 try {
  for(const width of [1440,390,320]) {
   const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'}); const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.route('**/api/account',r=>r.fulfill({json:{account:{organisationName:'Demo church'}}}));
   for(const route of ['/','/remote','/download']) {
    const response=await page.goto(base+route,{waitUntil:'domcontentloaded',timeout:60000});assert.equal(response.status(),200);
    assert.equal(await page.getByRole('heading',{level:1}).count(),1);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' overflow at '+width);
    if(route==='/') {
     for(const label of ['Live dashboard','Preview highlighting','Text and banners']) {
      await page.locator('#workspace').getByRole('button',{name:label,exact:true}).click();
      await page.locator('#workspace img').evaluate(img=>img.decode());
      assert.ok(await page.locator('#workspace img').evaluate(img=>img.naturalWidth>0));
     }
     await page.getByRole('link',{name:'Explore Remote & download'}).waitFor();
    }
    if(route==='/remote') {
     await page.getByRole('heading',{name:'Connect in four steps'}).waitFor();
     assert.match(await page.locator('main').innerText(),/iPhone|iPad/);
     const button=page.getByRole('button',{name:'Download Android APK'});
     if(await button.count()) {
      let requested=false;await page.route('**/api/download/mobile?prepare=1',r=>{requested=true;return r.fulfill({status:503,json:{error:'Test download unavailable'}})});
      await button.click();await page.getByRole('alert').filter({hasText:'Test download unavailable'}).waitFor();assert.ok(requested);
     } else assert.ok(await page.getByRole('button',{name:'Android download coming soon'}).isDisabled());
    }
    if(route==='/download') await page.getByRole('link',{name:'Android download & pairing guide'}).waitFor();
    if(route!=='/') await page.screenshot({path:path.join(output,route.slice(1)+'-'+width+'.png'),fullPage:true});
   }
   assert.deepEqual(errors,[]);console.log('PASS product pages at '+width);await page.close();
  }
  const guest=await browser.newPage();await guest.route('**/api/account',r=>r.fulfill({status:401,json:{error:'Sign in'}}));await guest.goto(base+'/remote');
  assert.equal(await guest.getByRole('link',{name:'Create free account',exact:true}).getAttribute('href'),'/account/register?next=/remote');
  assert.equal(await guest.getByRole('link',{name:'Already registered? Sign in'}).getAttribute('href'),'/account/login?next=/remote');
  console.log('PASS guest download sign-in returns to Remote');await guest.close();
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
