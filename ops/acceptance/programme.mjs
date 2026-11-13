import {chromium} from './node_modules/playwright/index.mjs';
import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
const base=process.env.PROGRAMME_BASE||'http://127.0.0.1:51284';
const out=process.env.PROGRAMME_QA||'.qa/programme-20261113';
const browser=await chromium.launch({headless:true});const results=[];
async function check(name,date,run,room='all',setup=async()=>{}){
 const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'America/Los_Angeles'});
 await context.route('**/iframe_api.js',r=>r.fulfill({contentType:'text/javascript',body:'window.WA={onInit:async()=>{},ui:{modal:{closeModal(){window.__programmeClosed=true},openModal(options){window.__programmeOpened=options}}}};'}));
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.clock.install({time:new Date(Date.parse(date)-1000)});await page.clock.pauseAt(new Date(date));
  await setup(page);
  await page.goto(`${base}/src/programme/index.html?room=${room}`,{waitUntil:'networkidle',timeout:15000});
  assert.equal(await page.getByRole('heading',{name:'Programme',exact:true}).count(),1,'Programme page must render');
  await run(page);
  assert.deepEqual(errors,[]);results.push({name,ok:true});
 }catch(e){results.push({name,ok:false,error:e.message});}
 finally{await context.close();}
}
await check('full day has 56 official talks, three pending profiles and all 12 rooms','2026-11-13T10:00:00Z',async p=>{
 assert.equal(await p.locator('[data-session]').count(),56);assert.equal(await p.locator('[data-pending]').count(),3);
 assert.equal(await p.locator('#room option').count(),13);
 assert.match(await p.locator('body').innerText(),/Myanmar time.*UTC\+06:30/);
 const links=await p.locator('[data-session] a').evaluateAll(es=>es.map(e=>({href:e.href,target:e.target,rel:e.rel})));
 assert.ok(links.every(l=>l.href.startsWith('https://www.var.camp/speakers/')&&l.target==='_blank'&&l.rel.includes('noopener')));
 await p.getByRole('button',{name:'Scheduled now',exact:true}).click();assert.equal(await p.locator('[data-session]').count(),0);assert.match(await p.locator('#summary').innerText(),/15 November/);
});
await check('Myanmar clock selects 10:00 slot even in a US browser timezone','2026-11-15T03:45:00Z',async p=>{
 assert.equal(await p.locator('[data-session]').count(),12);assert.match(await p.locator('[data-session]').first().innerText(),/10:00.*11:00/);
 await p.getByRole('button',{name:'Up next',exact:true}).click();assert.equal(await p.locator('[data-session]').count(),12);assert.match(await p.locator('[data-session]').first().innerText(),/11:00.*12:00/);
});
await check('11:00 boundary drops ended sessions','2026-11-15T04:30:00Z',async p=>{assert.equal(await p.locator('[data-session]').count(),12);assert.match(await p.locator('[data-session]').first().innerText(),/11:00.*12:00/);});
await check('lunch is explicit and next talks start at 13:00','2026-11-15T05:30:00Z',async p=>{
 assert.equal(await p.locator('[data-session]').count(),0);assert.match(await p.locator('#summary').innerText(),/Lunch break/);
 await p.getByRole('button',{name:'Up next',exact:true}).click();assert.equal(await p.locator('[data-session]').count(),12);assert.match(await p.locator('[data-session]').first().innerText(),/13:00.*14:00/);
});
await check('room-scoped entry has no fabricated afternoon slot','2026-11-15T08:30:00Z',async p=>{
 assert.equal(await p.locator('#room').inputValue(),'sagittarius');assert.equal(await p.locator('[data-session]').count(),0);
 assert.match(await p.locator('#summary').innerText(),/No talk scheduled/);
 await p.getByRole('button',{name:'Full day',exact:true}).click();assert.equal(await p.locator('[data-session]').count(),4);
},'sagittarius');
await check('end of programme does not label ended talks as current','2026-11-15T12:00:00Z',async p=>{
 await p.getByRole('button',{name:'Scheduled now',exact:true}).click();assert.equal(await p.locator('[data-session]').count(),0);assert.match(await p.locator('#summary').innerText(),/ended/i);
});
await check('Burmese search, room filter and mobile layout work','2026-11-13T10:00:00Z',async p=>{
 await p.locator('#search').fill('မ');assert.ok(await p.locator('[data-session]').count()>0);
 await p.locator('#search').fill('<img src=x onerror=alert(1)>');assert.equal(await p.locator('[data-session]').count(),0);assert.equal(await p.locator('#sessions img').count(),0);
 await p.locator('#search').fill('');await p.locator('#room').selectOption('aries');assert.equal(await p.locator('[data-session]').count(),5);
 await p.evaluate(()=>document.fonts.ready);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.screenshot({path:out+'/programme-mobile.png'});
 await p.getByRole('button',{name:'Close programme',exact:true}).click();assert.equal(await p.evaluate(()=>window.__programmeClosed),true);
});
await check('invalid room query falls back to full programme','2026-11-13T10:00:00Z',async p=>{assert.equal(await p.locator('#room').inputValue(),'all');assert.equal(await p.locator('[data-session]').count(),56);},'bad-room');
await check('board face opens its filtered programme only on click','2026-11-13T10:00:00Z',async p=>{
 await p.goto(`${base}/src/programme/board.html?room=aries`,{waitUntil:'networkidle'});
 assert.equal(await p.evaluate(()=>window.__programmeOpened),undefined);
 await p.getByRole('button',{name:/R1.*Aries.*programme/i}).click();
 assert.match((await p.evaluate(()=>window.__programmeOpened)).src,/room=aries/);
});
await check('morning before opening has an explicit future-event state','2026-11-15T02:00:00Z',async p=>{
 await p.getByRole('button',{name:'Scheduled now',exact:true}).click();assert.match(await p.locator('#summary').innerText(),/begins.*09:00/);
});
await check('an open panel changes at the actual slot boundary','2026-11-15T04:29:59Z',async p=>{
 assert.match(await p.locator('[data-session]').first().innerText(),/10:00.*11:00/);
 await p.clock.runFor(1000);assert.match(await p.locator('[data-session]').first().innerText(),/11:00.*12:00/);
});
await check('refresh preserves keyboard focus and position in Full day','2026-11-13T10:00:00Z',async p=>{
 const a=p.locator('[data-session] a').nth(20);await a.focus();const href=await a.getAttribute('href');
 await p.clock.runFor(30000);assert.equal(await p.evaluate(()=>document.activeElement?.getAttribute('href')),href);
});
await check('rendering across a slot boundary catches up immediately','2026-11-15T04:29:59.999Z',async p=>{
 await p.clock.runFor(2);
 assert.match(await p.locator('[data-session]').first().innerText(),/11:00.*12:00/);
},'all',async p=>{
 await p.addInitScript(()=>{
  const now=Date.now,replace=Element.prototype.replaceChildren;let crossed=false;
  Date.now=()=>crossed?Date.parse('2026-11-15T04:30:00Z'):now();
  Element.prototype.replaceChildren=function(...nodes){
   const result=replace.apply(this,nodes);
   if(this.id==='sessions')crossed=true; // Simulate the deadline passing during DOM rendering.
   return result;
  };
 });
});
await browser.close();writeFileSync(out+'/programme-ui-results.json',JSON.stringify({at:new Date().toISOString(),results},null,2));console.log(JSON.stringify(results,null,2));if(results.some(r=>!r.ok))process.exitCode=1;
