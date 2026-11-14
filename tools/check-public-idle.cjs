const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/DELL/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');
const base=process.env.REVIEW_BASE||'https://verse-cue-web.vercel.app';
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'C:/Users/DELL/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe'});try{
 const page=await browser.newPage({viewport:{width:1440,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__reviewIntervals=[];window.__reviewLongTasks=[];const original=window.setInterval;window.setInterval=function(handler,delay,...args){window.__reviewIntervals.push(delay);return original.call(window,handler,delay,...args)};new PerformanceObserver(list=>{window.__reviewLongTasks.push(...list.getEntries().map(x=>Math.round(x.duration)));window.__reviewLongTasks=window.__reviewLongTasks.slice(-100);}).observe({entryTypes:['longtask']});});
 await page.goto(base+(process.env.REVIEW_PATH||'/'),{waitUntil:'domcontentloaded',timeout:45000});
 const display=page.getByRole('button',{name:'Display sample',exact:true});if(await display.count()){await display.click();await page.getByRole('button',{name:'Reset walkthrough',exact:true}).click();}
 const idleStart=Date.now();for(let i=0;i<Number(process.env.REVIEW_SECONDS||60);i++){await page.waitForTimeout(1000);await page.evaluate(()=>document.visibilityState);}
 const result=await page.evaluate(()=>({intervals:window.__reviewIntervals,longTasks:window.__reviewLongTasks,heap:performance.memory?.usedJSHeapSize,ready:document.readyState}));
 console.log(JSON.stringify({base,idleMs:Date.now()-idleStart,errors,...result}));fs.writeFileSync('artifacts/navigation-review/'+(base.includes('127.0.0.1')?'local':'hosted')+'-idle.json',JSON.stringify({base,errors,...result},null,2));
 await page.screenshot({path:'artifacts/navigation-review/features.png',fullPage:true});
}finally{await browser.close();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
