import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ReportingService } from '../services/reporting.service';
export const reportingGuard: CanActivateFn = route => {
  const router = inject(Router);
  return inject(ReportingService).catalog().pipe(map(r =>
    (route.data['reportKey'] ? r.data.some(d => d.key === route.data['reportKey']) : r.data.length > 0)
    || router.createUrlTree(['/admin/dashboard'])), catchError(() => of(router.createUrlTree(['/admin/dashboard']))));
};
