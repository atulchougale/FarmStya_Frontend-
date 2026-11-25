import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AccountsService } from './accounts.service';
export const accountsGuard:CanActivateFn=()=>{const router=inject(Router);return inject(AccountsService).get<{permissions:string[]}>('access').pipe(map(()=>true),catchError(()=>of(router.createUrlTree(['/admin/dashboard']))));};
