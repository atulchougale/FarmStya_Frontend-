import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AccountsService } from './accounts.service';
import { TranslationPipe } from '../../../core/i18n/language';

interface MenuItem { label:string; path:string; icon:string; permission?:string; type?:string; }
@Component({standalone:true,imports:[CommonModule,RouterLink,TranslationPipe],templateUrl:'./accounts-menu.component.html',styleUrl:'./accounts.css'})
export class AccountsMenuComponent implements OnInit {
 private api=inject(AccountsService);private destroy=inject(DestroyRef);
 loading=true;error='';rights:string[]=[];
 groups:{title:string;description:string;items:MenuItem[]}[]=[
  {title:'Daily Work / Quick Actions',description:'Create a new entry or open your daily transaction lists.',items:[
   {label:'Create Voucher',path:'vouchers/new',icon:'bi-journal-plus',permission:'Create',type:'Journal'},
   {label:'Create Vendor',path:'vendors/new',icon:'bi-person-plus',permission:'ManageMasters'},
   {label:'Create Vendor Bill',path:'vouchers/new',icon:'bi-receipt',permission:'Create',type:'VendorBill'},
   {label:'Vendor Payment',path:'vouchers/new',icon:'bi-credit-card',permission:'Create',type:'VendorPayment'},
   {label:'Record Income',path:'vouchers/new',icon:'bi-arrow-down-left-circle',permission:'Create',type:'Income'},
   {label:'Record Expense',path:'vouchers/new',icon:'bi-arrow-up-right-circle',permission:'Create',type:'Expense'},
   {label:'Vouchers',path:'vouchers',icon:'bi-journal-check'},
   {label:'Income',path:'income',icon:'bi-graph-up-arrow'},
   {label:'Expenses',path:'expenses',icon:'bi-graph-down-arrow'},
   {label:'Vendor Bills',path:'payables',icon:'bi-receipt-cutoff'},
   {label:'Vendor Payments',path:'vendor-payments',icon:'bi-credit-card-2-front'},
   {label:'Actual Refunds',path:'refunds',icon:'bi-arrow-return-left'}]},
  {title:'Masters',description:'Manage the accounts and reference information used by forms.',items:[
   {label:'Chart of Accounts',path:'ledgers',icon:'bi-diagram-3'},
   {label:'Vendors',path:'vendors',icon:'bi-shop'},
   {label:'Cash & Bank',path:'money-accounts',icon:'bi-bank'},
   {label:'Accounting Masters',path:'masters',icon:'bi-grid'},
   {label:'Accounting Settings',path:'settings',icon:'bi-gear'},
   {label:'Fixed Assets',path:'assets',icon:'bi-buildings'},
   {label:'Recurring Expenses',path:'recurring',icon:'bi-arrow-repeat'}]},
  {title:'Financial Year & Periods',description:'Review financial years and manage monthly periods.',items:[
   {label:'Financial Years',path:'financial-years',icon:'bi-calendar3'},
   {label:'Financial Periods',path:'periods',icon:'bi-calendar-range'}]},
  {title:'Reconciliation & Review',description:'Match bank records and review accounting exceptions.',items:[
   {label:'Bank Reconciliation',path:'statements',icon:'bi-check2-square'},
   {label:'Source Posting Review',path:'source-reviews',icon:'bi-exclamation-triangle'},
   {label:'Accounting Audit',path:'audit',icon:'bi-shield-check'}]},
  {title:'Reporting',description:'Open an individual report to filter, review and export.',items:[
   {label:'Accounting Reports',path:'reports',icon:'bi-file-earmark-bar-graph'}]}
 ];
 ngOnInit(){this.api.get<{permissions:string[]}>('access').pipe(takeUntilDestroyed(this.destroy)).subscribe({next:r=>{this.rights=r.data.permissions;this.loading=false;},error:()=>{this.error='Accounts access is unavailable.';this.loading=false;}});}
 visible(item:MenuItem){return !item.permission||this.rights.includes('Accounts.'+item.permission);}
}
