// Compiled app + read-only local public video + mock APIs. No existing Chrome session or real bookings touched.
const {chromium}=require(process.env.FARMSTAY_PLAYWRIGHT_MODULE||'playwright');
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const root=path.resolve('dist/frontend/browser');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});let passed=0;
 try{
  const fixture=process.env.TEST_GALLERY_VIDEO;
  if(!fixture)throw new Error('Set TEST_GALLERY_VIDEO to a local public gallery MP4 fixture. It is read only and never uploaded.');
  const videoBytes=fs.readFileSync(fixture);
  for(const role of (process.env.GALLERY_ONLY?['Guest']:['Admin','Farm Owner','Customer','Guest'])){
   const context=await browser.newContext({viewport:{width:1440,height:1000}});let customerCalls=0,mediaRequests=[],transient=true;
   await context.addInitScript(role=>{
    if(role==='Guest')return;
    const token=btoa('{"alg":"none"}')+'.'+btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+86400}))+'.fixture';
    localStorage.setItem('farmstay_access_token',token);localStorage.setItem('farmstay_refresh_token','fixture');
    localStorage.setItem('farmstay_user',JSON.stringify({userId:1,userMembershipId:1,farmHouseId:1,roleName:role,fullName:'Fixture',mobileNumber:'9000000000',email:'',isMobileVerified:true,isEmailVerified:false,accessToken:token,refreshToken:'fixture'}));
   },role);
   await context.route('**/*',async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.pathname.startsWith('/uploads/')){
     mediaRequests.push(req.url());
     if(url.searchParams.has('preview-frame')&&transient){transient=false;return route.abort('failed');}
     const range=req.headers()['range']?.match(/bytes=(\d+)-(\d*)/);
     const start=range?Number(range[1]):0,end=range?Math.min(range[2]?Number(range[2]):start+2*1024*1024-1,videoBytes.length-1):videoBytes.length-1;
     const headers={'access-control-allow-origin':'http://localhost:4200','cache-control':'private, no-store','accept-ranges':'bytes',...(range?{'content-range':`bytes ${start}-${end}/${videoBytes.length}`}:{})};
     return route.fulfill({status:range?206:200,headers,contentType:'video/mp4',body:videoBytes.subarray(start,end+1)});
    }
    if(url.pathname.startsWith('/api/')){
     assert.ok(['GET','OPTIONS'].includes(req.method()),'No test may write booking data');let data=[];
     if(url.pathname.endsWith('/booking-calendar/reserve/active')){customerCalls++;assert.equal(role,'Customer');}
     else if(url.pathname.endsWith('/booking-calendar/month'))data={farmHouseId:1,month:Number(url.searchParams.get('month')),year:Number(url.searchParams.get('year')),bookedDates:[],reservedDates:[]};
     else if(url.pathname.endsWith('/auth/profile'))data={fullName:'Fixture',mobileNumber:'9000000000',email:'',isMobileVerified:true};
     else if(url.pathname.endsWith('/site'))data={farmHouseId:1,farmHouseName:'FarmStay Test',mobileNumber:'0000000000'};
     else if(url.pathname.endsWith('/admin/menu'))data={modules:[{moduleId:1,moduleName:'Bookings',displayName:'Bookings',route:'/booking',icon:'bi bi-calendar',subMenus:[{name:'Create customer booking',route:'/bookings/create',permissions:['Bookings.Create']}]}]};
     else if(url.pathname.includes('/gallery'))data=[{imageId:1,imageUrl:'https://localhost:7081/uploads/1/Gallery/fixture.mp4',imageName:'Garden Video',category:'Garden',description:'Fixture',displayOrder:1,isFavorite:false}];
     return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data})});
    }
    if(url.hostname==='localhost'){
     let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));assert.ok(file===root||file.startsWith(root+path.sep));
     if(!fs.existsSync(file)||!fs.statSync(file).isFile())file=path.join(root,'index.html');
     const types={'.js':'application/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml'};
     return route.fulfill({status:200,contentType:types[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
    }return route.abort();
   });
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   const recovered=role==='Customer'?page.waitForResponse(r=>r.url().endsWith('/booking-calendar/reserve/active')):null;
   await page.goto('http://localhost:4200/booking');
   if(['Admin','Farm Owner'].includes(role))await page.waitForURL('**/admin/bookings/create');
   else await page.locator('app-booking').waitFor();
   if(recovered)await recovered;
   assert.equal(customerCalls,role==='Customer'?1:0);passed++;console.log('PASS booking entry '+role);
   if(role==='Guest'){
    await page.goto('http://localhost:4200/gallery');
    await page.locator('app-video-preview img').first().waitFor({timeout:20000}).catch(async e=>{console.log(JSON.stringify({mediaRequests,preview:await page.locator('app-video-preview').allTextContents(),body:(await page.locator('main.gallery-page').innerText()).slice(0,500),bytes:videoBytes.length}));throw e;});
    assert.equal(await page.locator('main.gallery-page video').count(),0);passed++;
    assert.ok(mediaRequests.every(url=>url.includes('media-cache=2')));passed++;
    assert.equal(new Set(mediaRequests.filter(url=>url.includes('preview-frame'))).size,2,'One decoder with one bounded retry, shared by previews');const previewRequestsAtReady=mediaRequests.filter(url=>url.includes('preview-frame')).length;passed++;
    assert.equal(await page.getByText('Preview unavailable',{exact:true}).count(),0);passed++;
    await page.locator('.feature-open').click();
    const modal=page.locator('.modal-media video');await modal.waitFor();
    await page.waitForFunction(()=>document.querySelector('.modal-media video')?.readyState>=2);
    assert.equal(await modal.getAttribute('crossorigin'),'anonymous');passed++;
    await modal.evaluate(v=>v.play());await modal.evaluate(v=>v.pause());passed++;
    await page.getByRole('button',{name:'Close gallery popup',exact:true}).click();
    await page.getByRole('button',{name:'Videos',exact:true}).click();
    await page.locator('app-video-preview img').first().waitFor();
    assert.equal(mediaRequests.filter(url=>url.includes('preview-frame')).length,previewRequestsAtReady,'Successful thumbnail reused after filters and modal playback');passed++;
    console.log('PASS video preview, bounded retry, CORS playback and shared thumbnail cache');
   }
   assert.deepEqual(errors,[]);passed++;await context.close();
  }
  console.log(JSON.stringify({passed,realWrites:0}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
