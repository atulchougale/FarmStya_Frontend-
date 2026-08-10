import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

import { TokenService } from '../services/token.service';

export const authGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);

  const router = inject(Router);

  if (tokenService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login'], {
    queryParams: {
      returnUrl: state.url,
    },
  });

  return false;
};
