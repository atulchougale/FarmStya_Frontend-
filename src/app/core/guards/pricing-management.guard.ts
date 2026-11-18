import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AdminService } from '../services/admin.service';

export const pricingManagementGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(AdminService).getAdminMenu().pipe(
    map(response => response.data?.modules.some(module =>
      module.subMenus?.some(menu => menu.permissions.includes('Pricing.View')))
      || router.createUrlTree(['/admin/dashboard'])),
    catchError(() => of(router.createUrlTree(['/admin/dashboard'])))
  );
};
