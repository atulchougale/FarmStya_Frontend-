import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TokenService } from '../services/token.service';
import { PublicSiteService } from '../services/public-site.service';
import { SessionService } from '../services/session.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl + '/')) return next(req);
  const tokens = inject(TokenService);
  const session = inject(SessionService);
  const site = inject(PublicSiteService);
  const accessToken = tokens.getAccessToken();
  const headers: Record<string, string> = {};
  if (accessToken) headers['Authorization'] = 'Bearer ' + accessToken;
  if (site.currentFarmHouseId !== null) headers['FarmHouseId'] = String(site.currentFarmHouseId);
  const request = req.clone({ setHeaders: headers });
  const refreshOrLogin = (error: HttpErrorResponse) => {
    if (error.status !== 401) return throwError(() => error);
    session.endSession();
    return throwError(() => error);
  };
  return next(request).pipe(catchError((error: HttpErrorResponse) => {
    // Credential endpoints own their validation responses.
    if (error.status !== 401 || /\/auth\/(login|refresh-token|logout|verify-login-otp)(\?|$)/.test(req.url)) {
      return throwError(() => error);
    }
    if (!accessToken || !tokens.getRefreshToken()) return refreshOrLogin(error);
    const currentToken = tokens.getAccessToken();
    if (currentToken && currentToken !== accessToken) {
      return next(request.clone({ setHeaders: { Authorization: 'Bearer ' + currentToken } })).pipe(catchError(refreshOrLogin));
    }
    return session.refresh().pipe(
      catchError(refreshError => {
        session.endSession();
        return throwError(() => refreshError);
      }),
      switchMap(response => next(request.clone({
        setHeaders: { Authorization: 'Bearer ' + response.data.accessToken }
      })).pipe(catchError(refreshOrLogin)))
    );
  }));
};
