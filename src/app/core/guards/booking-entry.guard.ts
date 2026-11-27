import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token.service';

// Staff book for a verified customer through the administration workflow.
// Customer-only APIs keep their backend authorisation policy.
export const bookingEntryGuard: CanActivateFn = () => {
  const tokens = inject(TokenService);
  const user = tokens.getCurrentUser();
  if (!tokens.getAccessToken() || !user || user.roleName === 'Customer') return true;
  return inject(Router).createUrlTree(['/admin/bookings/create']);
};
