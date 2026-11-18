import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, map, of } from 'rxjs';
import { TokenService } from '../services/token.service';
import { SessionService } from '../services/session.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const tokens = inject(TokenService);
  const session = inject(SessionService);
  const router = inject(Router);
  const login = () => {
    tokens.logout();
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  };
  if (!tokens.isLoggedIn()) return login();
  if (!tokens.isAccessTokenExpired()) return true;
  return session.refresh().pipe(map(() => true), catchError(() => of(login())));
};
