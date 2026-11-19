import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AdminService } from '../services/admin.service';
export const adminBookingCreateGuard: CanActivateFn = () => {
  const router=inject(Router);
  return inject(AdminService).getAdminMenu().pipe(
    map(r=>r.data?.modules.some(m=>m.subMenus?.some(s=>s.permissions.includes('Bookings.Create'))) || router.createUrlTree(['/admin/booking'])),
    catchError(()=>of(router.createUrlTree(['/admin/booking'])))
  );
};
