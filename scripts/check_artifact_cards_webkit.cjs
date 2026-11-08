const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {webkit}=require('playwright');
const out=path.resolve('work/artifact-card-qa');fs.mkdirSync(out,{recursive:true});
const seed={version:2,language:'zh',artifacts:{'bcm-1072':'discovered','bcm-exh-1659-tae':'unlocked'},restoration:{started:true,placed:[],rotations:{},hints:0},gallery:{clues:[],opened:false},time:{rings:[1,2,0],hints:0,attempts:0,solved:false}};
(async()=>{
 const browser=await webkit.launch({headless:true});
 const results=[];
 for(const viewport of [{width:390,height:844},{width:320,height:568},{width:1024,height:768},{width:768,height:1024},{width:1280,height:900}]){
  const context=await browser.newContext({viewport,locale:'zh-CN'});
  // Isolated, disposable QA profile. Never modifies the user's browser save.
  await context.addInitScript(value=>localStorage.setItem('bucheon-museum:prototype:v1',JSON.stringify(value)),seed);
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5175/#/journal');
  await page.locator('.journal-artwork img').first().waitFor();
  assert.equal(await page.locator('.journal-artwork img').count(),2,'Discovered AND unlocked must both show images');
  assert.equal(await page.locator('.journal-entry:disabled img').count(),0,'Locked cards must remain unchanged');
  for(let repeat=0;repeat<2;repeat++){
   await page.getByRole('button',{name:/传统储藏瓮/}).click();
   const dialog=page.locator('.artifact-ledger[open]');await dialog.waitFor({state:'visible'});
   await page.waitForFunction(()=>{const c=document.querySelector('.ledger-frame-canvas');if(!c||!c.width)return false;const p=c.getContext('2d').getImageData(Math.floor(c.width/2),Math.floor(c.height/2),1,1).data;return p[0]>100&&p[1]>60&&p[3]===255});
   await page.evaluate(()=>document.fonts.ready);
   await page.waitForFunction(()=>{const v=document.querySelector('.ledger-frame-video');return v&&!v.paused&&v.currentTime>.05});
   const metrics=await dialog.evaluate(d=>{const r=d.getBoundingClientRect(),s=d.querySelector('.ledger-scroll').getBoundingClientRect(),v=d.querySelector('video'),b=d.querySelector('.ledger-model-actions button').getBoundingClientRect();return {width:r.width,height:r.height,parent:d.parentElement.tagName,overflow:d.scrollWidth>d.clientWidth+1,contentInside:s.left>=r.left&&s.right<=r.right&&s.top>=r.top&&s.bottom<=r.bottom,modelButtonVisible:b.bottom<=s.bottom,playing:!v.paused,time:v.currentTime,videoError:v.error?.code||null}});
   assert(metrics.width>200&&metrics.height>200,'Dialog collapsed');assert.equal(metrics.parent,'BODY');assert.equal(metrics.overflow,false);assert.equal(metrics.contentInside,true);
   if(!repeat)await page.screenshot({path:path.join(out,`webkit-card-${viewport.width}x${viewport.height}.png`)});
   for(const lang of ['한국어','EN','中文']){await dialog.getByRole('button',{name:lang,exact:true}).click();assert(await dialog.isVisible())}
   await dialog.getByRole('button',{name:'关闭',exact:true}).click();
   assert.equal(await page.locator('.artifact-ledger').count(),0);assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
   results.push({viewport,repeat,...metrics,errors});
  }
  // Also test the in-level inspect entry, not only the journal entry.
  await page.goto('http://127.0.0.1:5175/#/levels/1');
  await page.getByRole('button',{name:'查看器物名片',exact:true}).click();
  assert(await page.locator('.artifact-ledger[open]').isVisible());
  await page.getByRole('button',{name:'关闭',exact:true}).click();
  assert.equal(errors.length,0,errors.join('\n'));
  await context.close();
 }
 fs.writeFileSync(path.join(out,'webkit-results.json'),JSON.stringify({results},null,2));
 console.log('WEBKIT_COMPAT_OK',JSON.stringify(results));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
