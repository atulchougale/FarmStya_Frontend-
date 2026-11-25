import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting,HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute,provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AccountsService } from './accounts.service';
import { AccountVoucherComponent } from './voucher.component';
import { AccountsReportComponent } from './accounts-report.component';
import { AccountsPageComponent } from './accounts-page.component';

describe('Accounts integration contracts',()=>{
 let api:AccountsService;let http:HttpTestingController;
 beforeEach(()=>{TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting(),provideRouter([]),{provide:ActivatedRoute,useValue:{snapshot:{queryParamMap:{get:()=>null}},paramMap:of({get:()=> 'new'}),data:of({area:'vouchers'})}}]});api=TestBed.inject(AccountsService);http=TestBed.inject(HttpTestingController);});
 afterEach(()=>http.verify());
 it('uses the Accounts endpoint and bounded query without a client tenant field',()=>{api.get('vouchers',{page:2,pageSize:25,search:'test'}).subscribe();const r=http.expectOne(x=>x.url.endsWith('/accounts/vouchers'));expect(r.request.params.get('page')).toBe('2');expect(r.request.params.has('farmHouseId')).toBeFalse();r.flush({success:true,data:{items:[],total:0,page:2,pageSize:25}});});
 it('preserves the posting concurrency version',()=>{api.action('vouchers',4,'post',{version:'abc'}).subscribe();const r=http.expectOne(x=>x.url.endsWith('/accounts/vouchers/4/post'));expect(r.request.method).toBe('POST');expect(r.request.body.version).toBe('abc');r.flush({success:true,data:{}});});
 it('uploads attachments as multipart data',()=>{api.upload(4,new File(['%PDF'],'test.pdf',{type:'application/pdf'})).subscribe();const r=http.expectOne(x=>x.url.endsWith('/vouchers/4/attachments'));expect(r.request.body instanceof FormData).toBeTrue();r.flush({success:true,data:{id:1}});});
 it('requires balanced positive lines',()=>{const c=TestBed.createComponent(AccountVoucherComponent).componentInstance;c.add();c.add();c.draft.lines[0]={...c.draft.lines[0],accountId:1,debit:100};c.draft.lines[1]={...c.draft.lines[1],accountId:2,credit:90};expect(c.balanced).toBeFalse();c.draft.lines[1].credit=100;expect(c.balanced).toBeTrue();c.draft.lines[0].credit=1;expect(c.balanced).toBeFalse();});
 it('does not save a posted voucher',()=>{const c=TestBed.createComponent(AccountVoucherComponent).componentInstance;c.record={status:'Posted'};expect(c.posted).toBeTrue();c.save();http.expectNone(x=>x.method==='POST'||x.method==='PUT');});
 it('permission visibility uses specific Accounts rights',()=>{const c=TestBed.createComponent(AccountsPageComponent).componentInstance;c.rights=['Accounts.View'];expect(c.can('View')).toBeTrue();expect(c.can('Post')).toBeFalse();expect(c.can('ManageMasters')).toBeFalse();});
 it('rejects reversed date filters before requesting report data',()=>{const c=TestBed.createComponent(AccountsReportComponent).componentInstance;c.period='range';c.filter.from='2026-12-31';c.filter.to='2026-01-01';c.submit();expect(c.error).toContain('From date');http.expectNone(x=>x.url.includes('/reports/'));});
 it('uses April–March for financial-year filters',()=>{const c=TestBed.createComponent(AccountsReportComponent).componentInstance;c.period='year';c.year=2026;c.submit();const r=http.expectOne(x=>x.url.endsWith('/reports/ledger'));expect(r.request.params.get('from')).toBe('2026-04-01');expect(r.request.params.get('to')).toBe('2027-03-31');r.flush({success:true,data:[]});});
});
