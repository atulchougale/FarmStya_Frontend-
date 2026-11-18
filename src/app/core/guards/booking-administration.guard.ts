import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isAdministrationRole } from '../models/administration-role';
import { TokenService } from '../services/token.service';

export const bookingAdministrationGuard: CanActivateFn = () => {
  const session = inject(TokenService);
  return !session.isLoggedIn() || isAdministrationRole(session.getCurrentUser()?.roleName)
    || inject(Router).createUrlTree(['/home']);
};
