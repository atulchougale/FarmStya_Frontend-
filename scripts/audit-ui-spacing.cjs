// Isolated UI verification: all API calls are fixtures; no real financial records are changed.
const {chromium}=require(process.env.FARMSTAY_PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs');const assert=require('assert/strict');
const output=process.env.SHELL_OUTPUT||'output/spacing-audit';fs.mkdirSync(output,{recursive:true});
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
  if(['/login','/register','/forgot-password','/reset-password','/verify-email'].includes(location.pathname)){localStorage.removeItem('farmstay_access_token');localStorage.removeItem('farmstay_refresh_token');localStorage.removeItem('farmstay_user');return;}
  const token=btoa(JSON.stringify({alg:'none'}))+'.'+btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+86400}))+'.fixture';
  localStorage.setItem('farmstay_access_token',token);localStorage.setItem('farmstay_refresh_token','layout-fixture');
  localStorage.setItem('farmstay_user',JSON.stringify({userId:1,userMembershipId:1,farmHouseId:1,roleName:location.pathname.startsWith('/admin')?'Admin':'Customer',fullName:'Layout Test Admin',farmHouseName:'Green Valley Farm Stay',accessToken:token,refreshToken:'layout-fixture'}));
 });
 let registered=false,verified=false,checkoutView=false;
 const profile={userId:1,farmHouseId:1,fullName:'Spacing Demo',mobileNumber:'9000000000',email:'',isMobileVerified:true,isEmailVerified:false,roleName:'Customer',farmHouseName:'Green Valley Farm Stay'};
 const sampleBooking={bookingId:1,bookingSource:'WalkIn',createdBy:1,bookingReference:'UI-DEMO-001',fullName:'Spacing Demo',mobileNumber:'9000000000',email:'',adultCount:2,childrenCount:0,personCount:2,checkInDate:'2026-12-15',checkOutDate:'2026-12-16',stayDays:1,bookingType:'BookingOnly',status:'Approved',baseAmount:5000,eventAmount:0,totalAmount:5000,advanceAmount:1000,totalPaid:0,advancePaid:0,discountAmount:0,remainingAmount:5000,currencyCode:'INR',ownerDeadline:'2099-12-10T12:00:00',customerDeadline:'2099-12-10T12:00:00',createdDate:'2026-11-26',eventDates:[],statusHistory:[],canManageConfirmation:true};
 await context.route('**/api/**',async route=>{
  const request=route.request();if(!['GET','OPTIONS'].includes(request.method())&&!request.url().includes('/administration/bookings/customers')&&!request.url().includes('/auth/profile/contact/send-code'))throw new Error('UI test attempted a write: '+request.url());
  const path=new URL(request.url()).pathname.toLowerCase();let data=[];
  if(path.endsWith('/auth/profile'))data=profile;
  else if(path.endsWith('/auth/profile/contact/send-code'))data={};
  else if(path.endsWith('/booking/1/checkout'))data={total:5000,advancePaid:1000,payable:4000,discount:0,currency:'INR'};
  else if(path.endsWith('/accounts/refunds/payments'))data={bookingId:1,bookingReference:'UI-DEMO-001',fullName:'Spacing Demo',status:'CheckedOut',payments:[{paymentTransactionId:1,paymentType:'Advance',paymentMethod:'Cash',amount:1000,refunded:0}],refunds:[]};
  else if(path.includes('/administration/bookings/customers')){if(request.method()==='POST')registered=true;if(path.endsWith('/verify-mobile'))verified=true;data=registered?{...profile,isMobileVerified:verified,hasMembership:verified,canBook:verified,mobileOtpExpiresAt:new Date(Date.now()+300000).toISOString()}:null;}
  else if(path.endsWith('/booking/my-bookings'))data=[sampleBooking];
  else if(/\/booking\/(my-bookings\/)?1$/.test(path))data=checkoutView?{...sampleBooking,status:'CheckedIn'}:sampleBooking;
  else if(path.endsWith('/id-proof'))data=null;
  else if(path.endsWith('/receipts'))data=[];
  else if(path.endsWith('/administration-list'))data={items:[sampleBooking],totalCount:1,summary:{total:1,confirmed:0,checkedIn:0,checkedOut:0,pending:0}};
  else if(path.endsWith('/public/site'))data={farmHouseId:1,farmHouseName:'Green Valley Farm Stay',taluka:'Karveer',district:'Kolhapur',address:'Layout fixture',mobileNumber:'0000000000'};
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
  else if(path.includes('pricing'))data=[];
  await route.fulfill({status:200,contentType:'application/json',headers:{'access-control-allow-origin':'*'},body:JSON.stringify({success:true,message:'UI fixture',data})});
 });
 const page=await context.newPage();const errors=[];let current='';page.on('pageerror',e=>errors.push({page:current,message:e.message}));const results=[];
 async function audit(name){
  await page.waitForTimeout(220);
  const checks=await page.evaluate(()=>{
   const issues=[];let fields=0,buttons=0;const visible=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[hidden],[inert]')};
   const bounds=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height}};
   for(const label of document.querySelectorAll('main label, form label')){
    let control=label.htmlFor?document.getElementById(label.htmlFor):label.querySelector('input,select,textarea');
    if(!control){const next=label.nextElementSibling;if(next)control=next.matches('input,select,textarea')?next:next.querySelector('input,select,textarea');}
    if(!control||!visible(label)||!visible(control)||['checkbox','radio','hidden'].includes(control.type)||label.classList.contains('btn'))continue;
    fields++;
    if(!label.contains(control)){const l=bounds(label),c=bounds(control);const gap=c.y-l.bottom;if(gap<6&&gap>=-1)issues.push({kind:'label-gap',text:label.innerText.trim(),gap:Math.round(gap*10)/10,id:control.id});}
   }
   for(const control of document.querySelectorAll('main input,main select,main textarea,form input,form select,form textarea')){
    if(!visible(control)||control.closest('.input-group')||['checkbox','radio','hidden'].includes(control.type))continue;
    const parent=control.parentElement;for(const button of parent.querySelectorAll(':scope>button,:scope>.btn')){
     if(!visible(button)||getComputedStyle(button).position==='absolute')continue;const c=bounds(control),b=bounds(button);
     if(Math.abs(c.y-b.y)<8){const gap=Math.max(b.x-c.right,c.x-b.right);if(gap<7.5&&gap>=-1)issues.push({kind:'field-button-gap',text:button.innerText.trim(),gap,id:control.id});if(Math.abs(c.h-b.h)>10)issues.push({kind:'height-mismatch',text:button.innerText.trim(),fieldHeight:c.h,buttonHeight:b.h});}
    }
   }
   for(const button of document.querySelectorAll('main button.btn,main button.account-button,main button.submit-button,main button.contact-button,main button.continue-button,form button.btn')){
    if(!visible(button)||button.closest('.input-group,table,.star-rating,.rating-stars')||!button.innerText.trim())continue;buttons++;const r=bounds(button);if(r.h<36)issues.push({kind:'short-action',text:button.innerText.trim(),height:r.h});
   }
   for(const input of document.querySelectorAll('.search-box input,.report-search input')){
    if(!visible(input))continue;const style=getComputedStyle(input);
    if(parseFloat(style.borderTopWidth)>0)issues.push({kind:'double-search-border',className:input.className});
    input.focus();const focused=getComputedStyle(input);
    if(parseFloat(focused.borderTopWidth)>0||focused.boxShadow!=='none'||focused.outlineStyle!=='none')issues.push({kind:'nested-search-focus',className:input.className});
    input.blur();
   }
   if(document.documentElement.scrollWidth>innerWidth+2)issues.push({kind:'page-overflow',width:document.documentElement.scrollWidth,viewport:innerWidth});return{fields,buttons,issues,viewport:innerWidth,scroll:document.documentElement.scrollWidth};
  });results.push({name,...checks});console.log(name,JSON.stringify(checks));
 }
 const routes=['/login','/register','/forgot-password','/reset-password','/verify-email','/profile','/profile/edit','/change-password','/home','/gallery','/about','/contact','/booking','/my-bookings','/my-bookings/1','/feedback?bookingId=1',
 '/admin/bookings/create','/admin/booking','/admin/booking/1','/admin/dashboard','/admin/website-settings/gallery','/admin/website-settings/gallery/gallery-create','/admin/website-settings/amenity','/admin/website-settings/amenity/amenity-create','/admin/website-settings/aboutus','/admin/website-settings/aboutus/create','/admin/website-settings/message','/admin/website-settings/feedback','/admin/website-settings/pricing',
 '/admin/accounts/overview','/admin/accounts/ledgers','/admin/accounts/vendors','/admin/accounts/money-accounts','/admin/accounts/assets','/admin/accounts/masters','/admin/accounts/recurring','/admin/accounts/statements','/admin/accounts/settings','/admin/accounts/refunds','/admin/accounts/vouchers/new','/admin/accounts/reports/trial-balance',
 '/admin/reporting/bookings','/admin/reporting/revenue','/admin/reporting/customers','/admin/reporting/occupancy'];
 for(const width of (process.env.SPACING_WIDTHS||'1440,375').split(',').map(Number)){
  await page.setViewportSize({width,height:960});
  for(const path of (process.env.SPACING_ROUTE?process.env.SPACING_ROUTE.split(','):routes)){
   checkoutView=path.endsWith('/checkout');if(path==='/admin/bookings/create'){registered=false;verified=false;}current=width+' '+path;await page.goto('http://localhost:4200'+path,{waitUntil:'domcontentloaded'});await page.locator('app-root').waitFor();await page.waitForTimeout(450);
   if(path.startsWith('/admin/accounts/')&&['ledgers','vendors','money-accounts','assets','masters','recurring','statements'].includes(path.split('/').pop())){await page.goto('http://localhost:4200'+path+'/new',{waitUntil:'domcontentloaded'});await page.locator('form.account-editor').waitFor();}
   if(path.endsWith('/pricing')){const button=page.getByRole('button',{name:'Add pricing',exact:true});await button.waitFor({timeout:5000});await button.click();}
   await audit(current);
   const touched=await page.evaluate(()=>{let count=0;for(const form of document.querySelectorAll('form'))for(const directive of window.ng?.getDirectives(form)||[]){if(directive.form?.markAllAsTouched){directive.form.markAllAsTouched();count++;}}return count;});if(touched)await audit(current+' validation');
   if(path==='/admin/booking/1/checkout') {await page.getByLabel('Apply discount',{exact:true}).check();await audit(current+' discount');}
   if(path==='/admin/accounts/refunds'){await page.locator('input[name=reference]').fill('UI-DEMO-001');await page.getByRole('button',{name:'Find booking',exact:true}).click();await page.locator('select[name=payment]').waitFor();await audit(current+' refund form');}
   if(path==='/profile/edit'){await page.locator('#edit-mobile').fill('9000000001');await page.getByRole('button',{name:'Verify Mobile',exact:true}).click();await page.locator('#otp-mobile').waitFor();await audit(current+' contact OTP');}
   if(path==='/login'){await page.locator('label[for=modeOtp]').click();await audit(current+' mobile login');await page.evaluate(()=>{const c=window.ng?.getComponent(document.querySelector('app-login'));if(c){c.otpSent=true;window.ng.applyChanges(c);}});await audit(current+' OTP login');}
   if(path==='/admin/bookings/create'){
    await page.screenshot({path:output+'/assisted-'+width+'.png',fullPage:true});await page.locator('#customer-mobile').fill('9000000000');await page.getByRole('button',{name:'Find customer',exact:true}).click();await page.locator('#customer-name').waitFor();await audit(current+' register');
    await page.locator('#customer-name').fill('Spacing Demo');await page.getByRole('button',{name:'Register and send verification',exact:true}).click();await page.locator('#customer-otp').waitFor();await audit(current+' OTP');
    await page.locator('#customer-otp').fill('123456');await page.getByRole('button',{name:'Verify OTP',exact:true}).click();await page.getByRole('button',{name:'Continue to booking',exact:true}).click();await audit(current+' booking details');
   }
   if(path==='/booking'){
    for(const step of [2,3,4,5]){await page.evaluate(step=>{const el=document.querySelector('app-booking');const component=window.ng?.getComponent(el);if(component){component.currentStep=step;window.ng.applyChanges(component);}},step);await audit(current+' step '+step);}
   }
  }
 }
 fs.writeFileSync(output+'/audit.json',JSON.stringify({results,errors},null,2));console.log('SUMMARY',JSON.stringify({states:results.length,fields:results.reduce((s,r)=>s+r.fields,0),issues:results.filter(r=>r.issues.length),errors}));
 if(process.env.SPACING_STRICT==='1'){assert(results.every(r=>!r.issues.length),'Spacing findings remain');assert(!errors.length,'Browser errors remain');}
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
