// Isolated UI verification: all API calls are fixtures; no real financial records are changed.
const {chromium}=require(process.env.FARMSTAY_PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs');const assert=require('assert/strict');
const output=process.env.SHELL_OUTPUT||'output/sidebar';fs.mkdirSync(output,{recursive:true});
const permissions=['View','Create','Edit','Post','Reverse','Export','ManageMasters','ManagePeriods','ManageAssets'].map(p=>'Accounts.'+p);
const reportCatalog=['bookings','revenue','customers','occupancy'].map(key=>({key,title:key+' report',description:'Layout fixture',canExport:true,columns:[{key:'reference',label:'Reference',kind:'text'}]}));
const modules=[{moduleId:1,moduleName:'Dashboard',displayName:'Dashboard',icon:'bi bi-grid',route:'/dashboard'},
 {moduleId:2,moduleName:'Bookings',displayName:'Bookings',icon:'bi bi-calendar',route:'/booking',subMenus:[{name:'Create customer booking',route:'/bookings/create',permissions:['Bookings.Create']},{name:'Bookings',route:'/booking',permissions:['Bookings.View']}]},
 {moduleId:3,moduleName:'Accounts',displayName:'Accounts / Finance',icon:'bi bi-wallet2',route:'/accounts/overview'},
 {moduleId:4,moduleName:'Reporting',displayName:'Reporting',icon:'bi bi-bar-chart',route:'/reporting'},
 {moduleId:5,moduleName:'Website Settings',displayName:'Website Settings',icon:'bi bi-image',route:'',subMenus:[{name:'Pricing',route:'/website-settings/pricing',permissions:['Pricing.View','Pricing.Create','Pricing.Edit']}]}];
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
 const context=await browser.newContext({viewport:{width:1440,height:Number(process.env.SHELL_HEIGHT)||960},ignoreHTTPSErrors:true});
 await context.addInitScript(()=>{
  const token=btoa(JSON.stringify({alg:'none'}))+'.'+btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+86400}))+'.fixture';
  localStorage.setItem('farmstay_access_token',token);localStorage.setItem('farmstay_refresh_token','layout-fixture');
  localStorage.setItem('farmstay_user',JSON.stringify({userId:1,userMembershipId:1,farmHouseId:1,roleName:'Admin',fullName:'Layout Test Admin',farmHouseName:'Green Valley Farm Stay',accessToken:token,refreshToken:'layout-fixture'}));
 });
 await context.route('**/api/**',async route=>{
  const request=route.request();if(!['GET','OPTIONS'].includes(request.method()))throw new Error('UI test attempted a write: '+request.url());
  const path=new URL(request.url()).pathname.toLowerCase();let data=[];
  if(path.endsWith('/public/site'))data={farmHouseId:1,farmHouseName:'Green Valley Farm Stay',taluka:'Karveer',district:'Kolhapur',address:'Layout fixture',mobileNumber:'0000000000'};
  else if(path.endsWith('/admin/menu'))data={modules};
  else if(path.endsWith('/accounts/access'))data={permissions};
  else if(path.endsWith('/accounts/overview'))data={income:27500,expenses:3000,cash:15000,bank:9500,netResult:24500};
  else if(path.endsWith('/accounts/settings'))data={capitalisationThreshold:0,gstEnabled:false};
  else if(path.includes('/accounts/reports/'))data=[];
  else if(path.includes('/accounts/'))data={items:[{id:1,code:'CASH01',name:'Reception Cash',groupCode:'ASSET',normalBalance:'Debit',isActive:true,kind:'Cash'}],total:1};
  else if(path.endsWith('/administration/dashboard'))data={summary:{serverToday:'2026-11-26',bookingsThisWeek:7,bookingsThisMonth:7,totalRevenue:27500,revenueThisMonth:27500,occupiedDays:5,daysInMonth:30,occupancyPercent:16.67},latestBookings:[],revenueTrend:[],bookingSources:[]};
  else if(path.endsWith('/administration/reports'))data=reportCatalog;
  else if(path.includes('/administration/reports/'))data={rows:[],columns:reportCatalog[0].columns,total:0,page:1,pageSize:25,periodLabel:'All'};
  else if(path.endsWith('/booking'))data={items:[],totalCount:0,summary:{total:0,confirmed:0,checkedIn:0,checkedOut:0,pending:0}};
  else if(path.includes('pricing'))data={items:[],total:0,canCreate:true,canEdit:true,canDelete:true};
  await route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({success:true,message:'UI fixture',data})});
 });
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));const results=[];
 const measure=()=>page.evaluate(()=>{const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,right:r.right,bottom:r.bottom}};return{header:box('.admin-header'),side:box('.sidebar-slot'),main:box('.admin-content-wrapper'),page:box('.admin-main-content'),viewport:innerWidth,scroll:document.documentElement.scrollWidth}});
 const check=async(label)=>{const b=await measure();const expanded=await page.locator('.admin-layout.sidebar-open').count();assert(await page.locator('.admin-toolbar').isVisible()===!expanded,label+' duplicate Administration toolbar');if(b.scroll>b.viewport+2)console.log('LAYOUT-CSS', await page.evaluate(()=>({container:getComputedStyle(document.querySelector('.admin-ui')).containerName,type:getComputedStyle(document.querySelector('.admin-ui')).containerType,columns:document.querySelector('.account-metrics')?getComputedStyle(document.querySelector('.account-metrics')).gridTemplateColumns:'none',styles:[...document.querySelectorAll('style')].map(s=>s.textContent).filter(s=>s.includes('@container admin-content')).map(s=>s.slice(s.indexOf('@container'),s.indexOf('@container')+180))})));if(b.scroll>b.viewport+2)console.log('OVERFLOW',label,await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+2&&getComputedStyle(e).visibility!=='hidden'}).filter(e=>{for(let a=e.parentElement;a;a=a.parentElement){if(['auto','scroll','hidden','clip'].includes(getComputedStyle(a).overflowX)&&a.getBoundingClientRect().right<e.getBoundingClientRect().right)return false;}return true}).slice(0,30).map(e=>({tag:e.tagName,class:e.className,width:e.getBoundingClientRect().width,right:e.getBoundingClientRect().right}))));if(b.scroll>b.viewport+2)await page.screenshot({path:output+'/overflow.png',fullPage:true});assert(b.main.right<=b.viewport+2,label+' main exceeds viewport');assert(b.scroll<=b.viewport+2,label+' document scrolls horizontally: '+JSON.stringify(b));assert(b.main.y>=b.header.bottom-1,label+' content behind header');if(await page.locator('.admin-layout.sidebar-open:not(.mobile-layout)').count())assert(b.main.x>=b.side.right-1,label+' sidebar overlaps content');results.push({label,...b});};
 const routes=['accounts/overview','accounts/ledgers','accounts/vendors','accounts/vouchers/new','accounts/reports/trial-balance','booking','dashboard','reporting','reporting/bookings','website-settings/gallery','website-settings/amenity','website-settings/message','website-settings/feedback','website-settings/pricing'];
 for(const width of (process.env.SHELL_WIDTHS?process.env.SHELL_WIDTHS.split(',').map(Number):[1440,1280,1100,1024,768,375,320])){
  await page.setViewportSize({width,height:Number(process.env.SHELL_HEIGHT)||960});
  for(const path of (process.env.SHELL_ROUTE?[process.env.SHELL_ROUTE]:routes)){await page.goto('http://localhost:4200/admin/'+path);await page.locator('.admin-toolbar').waitFor({state:'attached'});await page.waitForTimeout(230);assert(new URL(page.url()).pathname==='/admin/'+path,'Unexpected route '+page.url());await check(width+' '+path);}
 }
 await page.setViewportSize({width:1440,height:Number(process.env.SHELL_HEIGHT)||960});await page.goto('http://localhost:4200/admin/accounts/overview');await page.waitForTimeout(250);
 await page.screenshot({path:output+'/desktop-open.png',fullPage:true});
 await page.getByRole('button',{name:'Hide sidebar',exact:true}).last().click();await page.waitForTimeout(230);await check('desktop collapsed');let bounds=await measure();assert(bounds.main.x<2,'Collapsed content did not reclaim width');
 await page.reload();await page.getByRole('button',{name:'Show sidebar',exact:true}).waitFor();await page.waitForTimeout(230);assert(await page.getByRole('button',{name:'Show sidebar',exact:true}).count()===1,'Collapsed preference was lost');await page.getByRole('button',{name:'Show sidebar',exact:true}).click();await page.waitForTimeout(230);
 const handle=page.getByRole('separator',{name:'Resize sidebar'});await handle.focus();await page.keyboard.press('End');await page.waitForTimeout(230);assert(await handle.getAttribute('aria-valuenow')==='384');await check('keyboard max resize');
 const hb=await handle.boundingBox();await page.mouse.move(hb.x+4,hb.y+160);await page.mouse.down();await page.mouse.move(hb.x-92,hb.y+160,{steps:12});await page.mouse.up();await check('pointer resize');
 await page.setViewportSize({width:375,height:812});await page.waitForTimeout(230);await page.getByRole('button',{name:'Show sidebar',exact:true}).click();await page.waitForTimeout(230);assert(await page.getByRole('dialog',{name:'Administration menu'}).isVisible());assert(await page.locator('.admin-content-wrapper').getAttribute('inert')==='');
 await page.screenshot({path:output+'/mobile-drawer.png',fullPage:true});await page.keyboard.press('Escape');await page.waitForTimeout(230);await check('mobile drawer closed');await page.screenshot({path:output+'/mobile-content.png',fullPage:true});
 if(process.env.SHELL_THEMES==='1') {
  await page.setViewportSize({width:1280,height:960});await page.waitForTimeout(230);
  await page.getByRole('button',{name:'Blue',exact:true}).click();await page.waitForTimeout(230);
  assert(await page.evaluate(()=>document.documentElement.dataset.theme)==='blue');await check('blue desktop');
  await page.screenshot({path:output+'/blue-desktop.png',fullPage:true});
  await page.getByRole('button',{name:'मराठी',exact:true}).click();await page.waitForTimeout(230);await check('Marathi desktop');
  await page.setViewportSize({width:320,height:640});await page.waitForTimeout(230);await check('Marathi mobile');const bell=await page.locator('.notification-indicator').boundingBox();assert(bell.x>=0&&bell.x+bell.width<=320,'Utility controls clipped at 320px');
  await page.getByRole('button',{name:'बाजूचा मेनू दाखवा',exact:true}).click();await page.waitForTimeout(230);
  const dialog=page.getByRole('dialog',{name:'प्रशासन मेनू'});assert(await dialog.isVisible());
  for(let i=0;i<12;i++){await page.keyboard.press('Tab');await page.waitForTimeout(30);const inside=await page.evaluate(()=>!!document.activeElement.closest('.sidebar-slot'));if(!inside)console.log('FOCUS',i,await page.evaluate(()=>({active:document.activeElement.outerHTML.slice(0,180),anchors:[...document.querySelectorAll('.cdk-focus-trap-anchor')].map(e=>e.outerHTML)})));assert(inside,'Focus escaped the drawer');}
  await page.screenshot({path:output+'/marathi-mobile.png',fullPage:true});await page.keyboard.press('Escape');
 }
 fs.writeFileSync(output+'/geometry.json',JSON.stringify({results,errors},null,2));assert(errors.length===0,'Browser runtime errors: '+errors.join('; '));console.log('PASS '+results.length+' layout states; collapse, persistence, pointer/keyboard resize and mobile drawer verified.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
