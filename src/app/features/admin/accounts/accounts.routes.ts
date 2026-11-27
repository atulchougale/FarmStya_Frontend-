import { Routes } from '@angular/router';
import { accountsGuard } from './accounts.guard';
import { ACCOUNT_PAGES } from './accounts.schema';
const page=()=>import('./accounts-page.component').then(m=>m.AccountsPageComponent);
const editorAreas=Object.entries(ACCOUNT_PAGES).filter(([area,d])=>d.fields&&area!=='settings');
export const ACCOUNTS_ROUTES:Routes=[
 {path:'',pathMatch:'full',loadComponent:()=>import('./accounts-menu.component').then(m=>m.AccountsMenuComponent),canActivate:[accountsGuard]},
 {path:'refunds',loadComponent:()=>import('./refunds.component').then(m=>m.AccountRefundsComponent),canActivate:[accountsGuard]},
 {path:'vouchers/new',data:{permission:'Create'},loadComponent:()=>import('./voucher.component').then(m=>m.AccountVoucherComponent),canActivate:[accountsGuard]},
 {path:'vouchers/:id',loadComponent:()=>import('./voucher.component').then(m=>m.AccountVoucherComponent),canActivate:[accountsGuard]},
 {path:'reports/:report',loadComponent:()=>import('./accounts-report.component').then(m=>m.AccountsReportComponent),canActivate:[accountsGuard]},
 {path:'vendor-bills',pathMatch:'full',redirectTo:'payables'},
 ...editorAreas.flatMap(([area,d])=>[
  {path:area+'/new',data:{area,mode:'create',permission:d.permission},loadComponent:page,canActivate:[accountsGuard]},
  ...(['assets','statements'].includes(area)?[]:[{path:area+'/:id/edit',data:{area,mode:'edit',permission:d.permission},loadComponent:page,canActivate:[accountsGuard]}]),
  {path:area+'/:id/view',data:{area,mode:'view'},loadComponent:page,canActivate:[accountsGuard]}
 ]),
 ...Object.keys(ACCOUNT_PAGES).map(area=>({path:area,data:{area,mode:'list'},loadComponent:page,canActivate:[accountsGuard]}))
];
