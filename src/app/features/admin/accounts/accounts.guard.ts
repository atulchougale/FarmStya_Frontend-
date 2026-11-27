import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AccountsService } from './accounts.service';
export const accountsGuard:CanActivateFn=(route)=>{const router=inject(Router);return inject(AccountsService).get<{permissions:string[]}>('access').pipe(map(r=>{const required=route.data['permission'];return !required||r.data.permissions.includes('Accounts.'+required)?true:router.createUrlTree(['/admin/accounts']);}),catchError(()=>of(router.createUrlTree(['/admin/dashboard']))));};
