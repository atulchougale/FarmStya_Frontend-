import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize, Observable, shareReplay, tap, throwError } from 'rxjs';
import { TokenService } from './token.service';
import { LoginResponse } from '../../features/auth/models/login-response.model';
import { environment } from '../../../environments/environment';

interface RefreshResponse { success: boolean; data: LoginResponse; }

@Injectable({ providedIn: 'root' })
export class SessionService {
  private pending: Observable<RefreshResponse> | null = null;
  private expiryTimer?: ReturnType<typeof setTimeout>;

  constructor(private readonly tokens: TokenService, private readonly http: HttpClient, private readonly router: Router) {
    this.tokens.currentUser$.subscribe(user => {
      if (this.expiryTimer) clearTimeout(this.expiryTimer);
      if (!user) return;
      const expiry = this.tokens.getAccessTokenExpiry();
      const delay = expiry === null ? 0 : Math.max(0, expiry - Date.now());
      this.expiryTimer = setTimeout(() => {
        this.refresh().subscribe({ error: () => this.endSession() });
      }, Math.min(delay, 2147483647));
    });
  }

  refresh(): Observable<RefreshResponse> {
    if (this.pending) return this.pending;
    const accessToken = this.tokens.getAccessToken();
    const refreshToken = this.tokens.getRefreshToken();
    if (!accessToken?.trim() || !refreshToken?.trim()) return throwError(() => new Error('Session is missing.'));
    this.pending = this.http.post<RefreshResponse>(environment.apiUrl + '/auth/refresh-token', { accessToken, refreshToken }).pipe(
      tap(response => {
        if (this.tokens.getAccessToken() !== accessToken || this.tokens.getRefreshToken() !== refreshToken) {
          throw new Error('Session changed during refresh.');
        }
        if (!response.success || !response.data?.accessToken || !response.data?.refreshToken) {
          throw new Error('Session refresh failed.');
        }
        this.tokens.updateTokens(response.data.accessToken, response.data.refreshToken);
      }),
      finalize(() => { this.pending = null; }),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.pending;
  }

  endSession(): void {
    const returnUrl = this.router.url;
    this.tokens.logout();
    if (!returnUrl.startsWith('/login')) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl } });
    }
  }
}
