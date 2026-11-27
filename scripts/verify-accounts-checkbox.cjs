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
 if(process.env.TEST_STATIC_BUILD){
  const path=require('path');const root=path.resolve('dist/frontend/browser');
  await context.route('http://localhost:4200/**',async route=>{
   const pathname=decodeURIComponent(new URL(route.request().url()).pathname);
   let file=path.resolve(root,'.'+pathname);assert.ok(file.startsWith(root+path.sep));
   if(!fs.existsSync(file)||!fs.statSync(file).isFile())file=path.join(root,'index.html');
   const ext=path.extname(file);const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml'};
   await route.fulfill({status:200,contentType:mime[ext]||'application/octet-stream',body:fs.readFileSync(file)});
  });
 }
 await context.route('**/api/**',async route=>{
  const request=route.request();if(request.method()==='POST'&&request.url().endsWith('/accounts/ledgers')){const body=request.postDataJSON();assert.equal(typeof body.isActive,'boolean');globalThis.lastLedger=body;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:{id:2,...body}})});return;}if(!['GET','OPTIONS'].includes(request.method())&&!request.url().includes('/administration/bookings/customers')&&!request.url().includes('/auth/profile/contact/send-code'))throw new Error('UI test attempted a write: '+request.url());
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
 await page.goto((process.env.TEST_BASE_URL||'http://localhost:4200')+'/admin/accounts/ledgers');
 for(const active of [false,true]){
  await page.getByRole('link',{name:'Create Ledger',exact:true}).click();
  await page.locator('#account-code').fill('6140');
  await page.locator('#account-name').fill('Gardening Expense');
  await page.locator('#account-groupCode').selectOption({label:'INDIRECT_EXP'});
  const checkbox=page.locator('#account-isActive');
  assert.equal(await checkbox.isChecked(),true,'New ledgers default to active');
  await checkbox.setChecked(active);
  const response=page.waitForResponse(r=>r.url().endsWith('/accounts/ledgers')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'Save',exact:true}).click();await response;
  assert.equal(globalThis.lastLedger.isActive,active);
  await page.locator('.swal2-container').waitFor({state:'hidden'});
 }
 assert.deepEqual(errors,[]);console.log('PASS: Active defaults to true; false and true save as JSON booleans. All APIs mocked.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
