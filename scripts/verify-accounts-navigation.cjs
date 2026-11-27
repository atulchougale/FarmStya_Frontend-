// Isolated browser regression. All API traffic is fulfilled locally; no real finance writes.
const {chromium}=require(process.env.FARMSTAY_PLAYWRIGHT_MODULE||'playwright');
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=path.resolve('dist/frontend/browser');
const output='output/accounts-navigation';fs.mkdirSync(output,{recursive:true});
const full=['View','Create','Edit','Post','Reverse','Export','ManageMasters','ManagePeriods','ManageAssets'].map(p=>'Accounts.'+p);
const reportKeys=['ledger','trial-balance','profit-loss','balance-sheet','cashbook','bankbook','daybook','income-expense','receivables','payables','assets','depreciation','reconciliation','tax'];
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});let assertions=0;
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});let rights=full,saved;
  await context.addInitScript(()=>{
   const token=btoa('{"alg":"none"}')+'.'+btoa(JSON.stringify({exp:Math.floor(Date.now()/1000)+86400}))+'.fixture';
   localStorage.setItem('farmstay_access_token',token);localStorage.setItem('farmstay_refresh_token','fixture');
   localStorage.setItem('farmstay_user',JSON.stringify({userId:1,userMembershipId:1,farmHouseId:1,roleName:'Admin',fullName:'UI Test',accessToken:token,refreshToken:'fixture'}));
  });
  await context.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.pathname.startsWith('/api/')){
    let data=[];const area=url.pathname.split('/').pop();
    if(!['GET','OPTIONS'].includes(req.method())){
     assert.equal(url.pathname,'/api/administration/accounts/ledgers');assert.equal(req.method(),'POST');
     saved=req.postDataJSON();assert.equal(typeof saved.isActive,'boolean');data={id:3,...saved};
    }else if(area==='access')data={permissions:rights};
    else if(area==='site')data={farmHouseId:1,farmHouseName:'FarmStay Test',address:'Kolhapur',mobileNumber:'0000000000'};
    else if(area==='menu')data={modules:[{moduleId:1,moduleName:'Accounts',displayName:'Accounts',route:'/accounts/overview',icon:'bi bi-wallet2',subMenus:[]}]};
    else if(url.pathname.includes('/accounts/reports/'))data=[];
    else if(area==='overview')data={income:1000,expenses:200,cash:800};
    else if(area==='settings')data={gstEnabled:false,capitalisationThreshold:0};
    else if(url.pathname.includes('/accounts/')){
     const id=Number(url.searchParams.get('id')||1);
     const row={id,code:id===2?'1000':'6140',name:id===2?'Cash in Hand':'Gardening Expense',groupCode:'INDIRECT_EXP',normalBalance:'Debit',isActive:true,isSystemDefined:id===2,kind:'ExpenseCategory',status:'Draft',voucherNumber:'AV-TEST-1',voucherType:'VendorPayment',totalDebit:100,version:'fixture'};
     data={items:[row],total:1};
    }
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,message:'Fixture',data})});
   }
   if(url.hostname==='localhost'){
    let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
    assert.ok(file===root||file.startsWith(root+path.sep));
    if(!fs.existsSync(file)||!fs.statSync(file).isFile())file=path.join(root,'index.html');
    const mime={'.js':'application/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.svg':'image/svg+xml'};
    return route.fulfill({status:200,contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
   }
   await route.abort();
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const go=async suffix=>{await page.goto('http://localhost:4200/admin/accounts'+suffix);await page.locator('app-accounts-menu,app-root main.accounts-page').last().waitFor();};
  const clean=async()=>{assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'No horizontal document overflow');assertions++;};
  await go('');await page.locator('.account-menu-card').first().waitFor();
  assert.deepEqual(await page.locator('.account-menu-section h2').allTextContents(),['Daily Work / Quick Actions','Masters','Financial Year & Periods','Reconciliation & Review','Reporting']);assertions++;
  assert.equal(await page.locator('.accounts-nav').count(),0);assertions++;
  const links=await page.locator('.account-menu-card').evaluateAll(els=>els.map(e=>e.getAttribute('href')));
  for(const link of [...new Set(links)]){await page.goto('http://localhost:4200'+link);await page.locator('main.accounts-page').last().waitFor();await clean();}
  await go('/ledgers');assert.equal(await page.locator('form.account-editor').count(),0);assertions++;
  await page.getByRole('link',{name:'Create Ledger',exact:true}).click();await page.locator('#account-code').waitFor();
  assert.ok(page.url().endsWith('/ledgers/new'));assert.equal(await page.locator('.records-panel,.account-filters').count(),0);assertions++;
  await page.locator('#account-code').fill('6140');await page.locator('#account-name').fill('Gardening Expense');await page.locator('#account-groupCode').selectOption({label:'INDIRECT_EXP'});
  assert.equal(await page.locator('#account-isActive').isChecked(),true);await page.locator('#account-isActive').uncheck();
  await page.getByRole('button',{name:'Save',exact:true}).click();await page.waitForURL('**/accounts/ledgers');assert.equal(saved.isActive,false);assertions++;
  await page.locator('.swal2-container').waitFor({state:'hidden'});
  await go('/ledgers/1/edit');await page.locator('#account-name').waitFor();assert.equal(await page.locator('#account-name').inputValue(),'Gardening Expense');assertions++;
  await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.waitForURL('**/accounts/ledgers');assertions++;
  await go('/ledgers/2/view');await page.locator('#account-name').waitFor();assert.equal(await page.locator('#account-name').isDisabled(),true);assert.equal(await page.getByRole('button',{name:'Save',exact:true}).count(),0);assertions++;
  await go('/ledgers/2/edit');await page.getByRole('alert').filter({hasText:'System records are read-only.'}).waitFor();assert.equal(await page.locator('form.account-editor').count(),0);assertions++;
  for(const area of ['vendors','money-accounts','masters','assets','recurring','statements']){
   await go('/'+area);assert.equal(await page.locator('form.account-editor').count(),0);
   await go('/'+area+'/new');await page.locator('form.account-editor').waitFor();assert.equal(await page.locator('.records-panel').count(),0);await clean();assertions++;
  }
  await go('/reports');assert.equal(await page.locator('.account-report-cards a').count(),14);assertions++;
  for(const key of reportKeys){await go('/reports/'+key);await page.locator('form.account-editor').waitFor();assert.ok(page.url().endsWith('/reports/'+key));assertions++;}
  for(const width of [1440,768,375]){
   await page.setViewportSize({width,height:1000});
   for(const route of ['','/ledgers','/ledgers/new','/reports','/reports/ledger','/vouchers/new?type=VendorBill']){await go(route);await clean();}
   await go('');await page.screenshot({path:output+'/menu-'+width+'.png',fullPage:true});
  }
  await page.evaluate(()=>{localStorage.setItem('farmstay-brand-theme','blue');localStorage.setItem('farmstay_language','mr');});
  await go('');assert.equal(await page.locator('html').getAttribute('data-theme'),'blue');await page.getByRole('heading',{name:'दैनंदिन कामे / झटपट कृती',exact:true}).waitFor();await clean();assertions++;
  rights=['Accounts.View'];await page.evaluate(()=>localStorage.setItem('farmstay_language','en'));
  await go('/ledgers/new');await page.waitForURL('**/admin/accounts');assert.equal(await page.getByRole('link',{name:'Create Vendor',exact:true}).count(),0);assertions++;
  await go('/vouchers/new');await page.waitForURL('**/admin/accounts');assertions++;
  assert.deepEqual(errors,[]);console.log(JSON.stringify({assertions,pageErrors:errors,realWrites:0,reportPages:14}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
