import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, firstValueFrom, finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { TranslationPipe, LanguageService } from '../../../core/i18n/language';
import { AccountsService, AccountRow, AccountPage } from './accounts.service';
import { AccountsBreadcrumbComponent } from './accounts-breadcrumb.component';
import { ACCOUNT_PAGES, ACCOUNT_REPORTS, AccountField } from './accounts.schema';
export function localDay(d=new Date()):string {return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
@Component({standalone:true,imports:[CommonModule,FormsModule,RouterLink,MatTableModule,MatPaginatorModule,TranslationPipe,AccountsBreadcrumbComponent],templateUrl:'./accounts-page.component.html',styleUrl:'./accounts.css'})
export class AccountsPageComponent implements OnInit {
 private readonly router=inject(Router);private readonly language=inject(LanguageService);private readonly api=inject(AccountsService);private readonly route=inject(ActivatedRoute);private readonly destroy=inject(DestroyRef);
 mode:'list'|'create'|'edit'|'view'='list';
 area='overview';definition=ACCOUNT_PAGES['overview'];reports=ACCOUNT_REPORTS;
 rows:AccountRow[]=[];total=0;loading=false;saving=false;error='';rights:string[]=[];dashboard:AccountRow={};draft:AccountRow|null=null;editing:number|null=null;options:Record<string,{value:string|number;label:string}[]>={};
 query={page:1,pageSize:25,search:'',from:'',to:'',kind:''};actionRow:AccountRow|null=null;action='';actionInput:AccountRow={};actionResult:AccountRow|null=null;
 ngOnInit(){combineLatest([this.route.data,this.route.paramMap]).pipe(takeUntilDestroyed(this.destroy)).subscribe(([data])=>{this.area=data['area']||'overview';this.mode=data['mode']||'list';this.definition=ACCOUNT_PAGES[this.area];this.draft=null;this.options={};this.actionRow=null;this.query.page=1;this.query.search='';this.load();});this.api.get<{permissions:string[]}>('access').pipe(takeUntilDestroyed(this.destroy)).subscribe({next:r=>this.rights=r.data.permissions,error:e=>this.error=e.error?.message||'Accounts access is unavailable.'});}
 get editorPage(){return this.mode!=='list';}
 get recordName(){return ({ledgers:'Ledger',vendors:'Vendor','money-accounts':'Money Account',masters:'Master',assets:'Asset',recurring:'Schedule',statements:'Statement Line'} as Record<string,string>)[this.area]||'record';}
 get createLabel(){return 'Create '+this.recordName;}
 get editorLabel(){return (this.mode==='create'?'Create ':this.mode==='view'?'View ':'Edit ')+this.recordName;}
 get pageTitle(){return this.editorPage?this.language.translate(this.editorLabel)+' · '+this.language.translate(this.definition.title):this.language.translate(this.definition.title);}

 get voucherType(){return this.area==='income'?'Income':this.area==='payables'?'VendorBill':this.area==='vendor-payments'?'VendorPayment':this.area==='expenses'?'Expense':'Journal';}
 backToList(){void this.router.navigate(['/admin/accounts',this.area]);}
 async loadEditor(){
  this.loading=true;this.error='';
  try{
   if(this.mode==='create')await this.open();
   else{
    const id=Number(this.route.snapshot.paramMap.get('id'));if(!Number.isSafeInteger(id)||id<1)throw new Error('Record not found.');
    const reply=await firstValueFrom(this.api.get<AccountPage>(this.area,{id,page:1,pageSize:1}));
    const row=reply.data.items.find(r=>Number(r['id'])===id);
    if(!row)throw new Error('Record not found.');
    if(this.mode==='edit'&&row['isSystemDefined'])throw new Error('System records are read-only.');
    await this.open(row);
   }
  }catch(e){this.draft=null;this.error=(e as Error).message||'Could not load accounting data.';}finally{this.loading=false;}
 }

 can(p:string){return this.rights.includes('Accounts.'+p);}
 load(){if(this.editorPage){void this.loadEditor();return;}this.loading=true;this.error='';if(this.area==='reports'){this.loading=false;return;}this.api.get<AccountPage|AccountRow>(this.area,this.query).pipe(takeUntilDestroyed(this.destroy),finalize(()=>this.loading=false)).subscribe({next:r=>{if(this.area==='overview')this.dashboard=r.data as AccountRow;else if(this.area==='settings'){this.draft={...r.data as AccountRow};void Promise.all((this.definition.fields||[]).filter(f=>f.source).map(f=>this.lookup(f.source!))).catch(()=>this.error='Could not load Money Account choices.');}else{const page=r.data as AccountPage;this.rows=page.items;this.total=page.total;}},error:e=>this.error=e.error?.message||'Could not load accounting data.'});}
 page(e:PageEvent){this.query.page=e.pageIndex+1;this.query.pageSize=e.pageSize;this.load();}
 filter(){this.query.page=1;this.load();}
 reset(){this.query={page:1,pageSize:25,search:'',from:'',to:'',kind:''};this.load();}
 get columns(){return [...this.definition.columns,'actions'];}
 label(key:string){return ({voucherNumber:'Voucher number',voucherDate:'Date',voucherType:'Type',totalDebit:'Debit / amount',totalCredit:'Credit',isSystemDefined:'System default',groupCode:'Account group',normalBalance:'Normal balance',defaultLedgerCode:'Default ledger',accountNumberLast4:'Account ••••',ifsc:'IFSC',isActive:'Active',isClosed:'Closed',fromDate:'From date',toDate:'To date',nextDate:'Next date',intervalMonths:'Interval (months)',statementDate:'Statement date',voucherLineId:'Matched line',gstNumber:'GST number'} as Record<string,string>)[key]||key.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());}
 display(row:AccountRow,key:string){const value=row[key];if(value===null||value===undefined||value==='')return '—';if(['cost','amount','debit','credit','totalDebit','totalCredit','residualValue','outstanding'].includes(key))return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(Number(value));if(/Date$/.test(key))return new Date(String(value)).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'});return typeof value==='boolean'?(value?'Yes':'No'):String(value);}
 number(value:unknown){return Number(value);}
 money(key:string){return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(Number(this.dashboard[key]||0));}
 async lookup(source:string){if(this.options[source])return;const rows:AccountRow[]=[];for(let page=1;page<=100;page++){const reply=await firstValueFrom(this.api.get<AccountPage>(['CashMoneyAccount','BankMoneyAccount'].includes(source)?'money-accounts':['ledgers','vendors'].includes(source)?source:'masters',{page,pageSize:100,...(!['ledgers','vendors','CashMoneyAccount','BankMoneyAccount'].includes(source)?{kind:source}:{})}));rows.push(...reply.data.items);if(rows.length>=reply.data.total)break;}this.options[source]=rows.filter(r=>r['isActive']!==false && (source!=='CashMoneyAccount'||r['kind']==='Cash') && (source!=='BankMoneyAccount'||r['kind']==='Bank')).map(r=>({value:Number(r['id']),label:`${r['name']}${r['isSystemDefined']?' · System':''}`}));}
 async open(row?:AccountRow){this.editing=row?Number(row['id']):null;this.draft=row?{...row}:{isActive:true,kind:this.area==='masters'?'ExpenseCategory':'Bank',depreciationMethod:'SLM',purchaseDate:localDay(),inServiceDate:localDay(),nextDate:localDay(),date:localDay(),annualRate:0,residualValue:0,intervalMonths:1,debit:0,credit:0,capitalisationThreshold:0};this.error='';try{await Promise.all((this.definition.fields||[]).filter(f=>f.source).map(f=>this.lookup(f.source!)));}catch{this.error='Could not load the required dropdown data.';}}
 set(key:string,value:unknown){if(this.draft)this.draft[key]=value;}
 fieldOptions(f:AccountField){return f.options||(f.source?this.options[f.source]||[]:[]);}
 save(){if(!this.draft||this.saving||this.mode==='view')return;this.saving=true;this.error='';const input={...this.draft};for(const f of this.definition.fields||[])if(input[f.key]===''&&!f.required)input[f.key]=null;this.api.save(this.area,this.editing,input).pipe(finalize(()=>this.saving=false),takeUntilDestroyed(this.destroy)).subscribe({next:()=>{if(this.editorPage)this.backToList();else{this.draft=null;this.load();}void Swal.fire({icon:'success',title:'Saved',timer:1400,showConfirmButton:false});},error:e=>this.error=e.error?.message||Object.values(e.error?.errors||{}).flat().join(' ')||'Could not save this record.'});}
 async startAction(row:AccountRow,action:string){this.actionRow=row;this.action=action;this.actionInput={requestId:crypto.randomUUID(),date:localDay(),reason:'',amount:0,version:row['version']};this.actionResult=null;try{if(['disposal','maintenance'].includes(action))await this.lookup('ledgers');if(action==='reconcile'){const reply=await firstValueFrom(this.api.get<AccountRow[]>('reports/reconciliation',{accountId:row['accountId'],from:'2000-01-01',to:localDay(),pageSize:100}));this.options['reconciliation-lines']=reply.data.filter(l=>l['bucket']==='Unmatched book'&&l['debit']===row['debit']&&l['credit']===row['credit']).map(l=>({value:Number(l['id']),label:String(l['reference'])+' · '+String(l['date']).slice(0,10)}));}}catch{this.error='Could not load account choices.';}}
 applyAction(){if(!this.actionRow||this.saving)return;this.saving=true;this.error='';const row=this.actionRow;let request;if(this.area==='periods')request=this.api.save('periods',Number(row['id']),{...this.actionInput,amount:row['isClosed']?0:1});else if(this.area==='statements')request=this.api.action('statements',Number(row['id']),'reconcile',this.actionInput);else request=this.api.action('assets',Number(row['id']),this.action,this.actionInput);request.pipe(finalize(()=>this.saving=false),takeUntilDestroyed(this.destroy)).subscribe({next:r=>{if(this.action==='preview')this.actionResult=r.data;else{this.actionRow=null;this.load();void Swal.fire({icon:'success',title:'Completed',timer:1400,showConfirmButton:false});}},error:e=>this.error=e.error?.message||'Could not complete this action.'});}
 async retrySource(row:AccountRow){if(this.saving)return;const reply=await Swal.fire({title:this.language.translate('Request source retry?'),input:'textarea',inputLabel:this.language.translate('What was corrected?'),showCancelButton:true,inputValidator:value=>value.trim()?'':this.language.translate('Enter a reason.')});if(!reply.isConfirmed)return;this.saving=true;this.api.save('source-reviews',Number(row['id']),{reason:reply.value,version:row['version']}).pipe(finalize(()=>this.saving=false),takeUntilDestroyed(this.destroy)).subscribe({next:()=>this.load(),error:e=>this.error=e.error?.message||'Could not request retry.'});}
}
