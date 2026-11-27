import { AccountsBreadcrumbComponent } from './accounts-breadcrumb.component';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule,PageEvent } from '@angular/material/paginator';
import { finalize, firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslationPipe } from '../../../core/i18n/language';
import { AccountsService,AccountRow,AccountPage } from './accounts.service';
import { ACCOUNT_REPORTS } from './accounts.schema';
import { localDay } from './accounts-page.component';
@Component({standalone:true,imports:[CommonModule,FormsModule,RouterLink,MatTableModule,MatPaginatorModule,TranslationPipe,AccountsBreadcrumbComponent],templateUrl:'./accounts-report.component.html',styleUrl:'./accounts.css'})
export class AccountsReportComponent implements OnInit {
 private api=inject(AccountsService);private route=inject(ActivatedRoute);private destroy=inject(DestroyRef);
 ledgers:AccountRow[]=[];report='ledger';title='';rows:AccountRow[]=[];loading=false;downloading='';error='';canExport=false;period='year';year=new Date().getFullYear();month=new Date().getMonth()+1;
 filter={from:localDay(new Date(new Date().getMonth()<3?new Date().getFullYear()-1:new Date().getFullYear(),3,1)),to:localDay(),search:'',page:1,pageSize:25,accountId:null as number|null};applied={...this.filter};
 columns=['code','name','date','reference','narration','opening','debit','credit','balance','bucket'];
 async loadLedgers(){try{for(let page=1;page<=100;page++){const r=await firstValueFrom(this.api.get<AccountPage>('ledgers',{page,pageSize:100}));this.ledgers.push(...r.data.items);if(this.ledgers.length>=r.data.total)break;}}catch{this.error='Could not load ledger choices.';}}
 ngOnInit(){void this.loadLedgers();this.api.get<{permissions:string[]}>('access').pipe(takeUntilDestroyed(this.destroy)).subscribe({next:r=>this.canExport=r.data.permissions.includes('Accounts.Export')});this.route.paramMap.pipe(takeUntilDestroyed(this.destroy)).subscribe(p=>{this.report=p.get('report')||'ledger';this.title=ACCOUNT_REPORTS.find(r=>r[0]===this.report)?.[1]||'Accounting report';this.applied.page=1;this.load();});}
 submit(){if(this.period==='month'){this.filter.from=localDay(new Date(this.year,this.month-1,1));this.filter.to=localDay(new Date(this.year,this.month,0));}else if(this.period==='year'){this.filter.from=localDay(new Date(this.year,3,1));this.filter.to=localDay(new Date(this.year+1,2,31));}else if(this.period==='all'){this.filter.from='2000-01-01';this.filter.to=localDay();}if(this.filter.from>this.filter.to){this.error='From date must not follow To date.';return;}this.applied={...this.filter,page:1};this.load();}
 load(){this.loading=true;this.error='';this.api.get<AccountRow[]>('reports/'+this.report,this.applied).pipe(finalize(()=>this.loading=false),takeUntilDestroyed(this.destroy)).subscribe({next:r=>this.rows=r.data,error:e=>{this.rows=[];this.error=e.error?.message||'Could not load report.';}});}
 page(e:PageEvent){this.applied.page=e.pageIndex+1;this.applied.pageSize=e.pageSize;this.load();}
 label(key:string){return key==='groupCode'?'Account group':key.replace(/^./,x=>x.toUpperCase());}
 value(row:AccountRow,key:string){if(key==='date')return new Date(String(row[key])).toLocaleDateString('en-IN');if(['opening','debit','credit','balance'].includes(key))return new Intl.NumberFormat('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(row[key]||0));return row[key]||'—';}
 download(format:'pdf'|'excel'){if(this.downloading)return;this.downloading=format;this.api.download(`reports/${this.report}/export/${format}`,this.applied).pipe(finalize(()=>this.downloading=''),takeUntilDestroyed(this.destroy)).subscribe({next:b=>{const url=URL.createObjectURL(b);const a=document.createElement('a');a.href=url;a.download=`accounts-${this.report}.${format==='pdf'?'pdf':'xlsx'}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},error:async e=>{try{this.error=JSON.parse(await e.error.text()).message;}catch{this.error='Could not download report.';}}});}
}
