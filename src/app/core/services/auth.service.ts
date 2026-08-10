import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { RegisterRequest } from '../models/register-request.model';
import { ForgotPasswordRequest } from '../models/forgot-password-request.model';
import { ResetPasswordRequest } from '../models/reset-password-request.model';
import { LoginRequest } from '../models/login-request.model';
import { LoginResponse } from '../models/login-response.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  register(request: RegisterRequest): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/register`, request);
  }

  login(request: LoginRequest): Observable<{
    success: boolean;
    message: string;
    data: LoginResponse;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: LoginResponse;
    }>(`${environment.apiUrl}/auth/login`, request);
  }

  verifyEmail(token: string): Observable<any> {
    return this.http.get<any>(
      `${environment.apiUrl}/auth/verify-email?token=${token}`,
    );
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/auth/forgot-password`,
      request,
    );
  }

  resetPassword(request: ResetPasswordRequest): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/auth/reset-password`,
      request,
    );
  }
}
