import { Routes } from '@angular/router';
import { accountsGuard } from './accounts.guard';
import { ACCOUNT_PAGES } from './accounts.schema';
export const ACCOUNTS_ROUTES:Routes=[
 {path:'',pathMatch:'full',redirectTo:'overview'},
 {path:'vouchers/:id',loadComponent:()=>import('./voucher.component').then(m=>m.AccountVoucherComponent),canActivate:[accountsGuard]},
 {path:'reports/:report',loadComponent:()=>import('./accounts-report.component').then(m=>m.AccountsReportComponent),canActivate:[accountsGuard]},
 ...Object.keys(ACCOUNT_PAGES).map(area=>({path:area,data:{area},loadComponent:()=>import('./accounts-page.component').then(m=>m.AccountsPageComponent),canActivate:[accountsGuard]}))
];
