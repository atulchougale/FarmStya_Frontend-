import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { RegisterRequest } from '../../features/auth/models/register-request.model';
import { ForgotPasswordRequest } from '../../features/auth/models/forgot-password-request.model';
import { ResetPasswordEmailRequest } from '../../features/auth/models/reset-password-email-request.model';
import { ResetPasswordOtpRequest } from '../../features/auth/models/reset-password-otp-request.model';
import { LoginRequest } from '../../features/auth/models/login-request.model';
import { LoginResponse } from '../../features/auth/models/login-response.model';
import { SendLoginOtpRequest } from '../../features/auth/models/send-login-otp-request.model';
import { VerifyLoginOtpRequest } from '../../features/auth/models/verify-login-otp-request.model';
import { ResendOtpRequest } from '../../features/auth/models/resend-otp-request.model';
import { Profile } from '../../features/profile/models/profile.model';
import { ChangePasswordRequest } from '../../features/profile/models/change-password-request.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {}

  // ============================================
  // Register
  // ============================================

  register(request: RegisterRequest): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/register`, request);
  }

  // ============================================
  // Login (Email + Password)
  // ============================================

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

  // ============================================
  // Login (Mobile OTP) - Send OTP
  // ============================================

  sendLoginOtp(request: SendLoginOtpRequest): Observable<{
    success: boolean;
    message: string;
    data: boolean;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: boolean;
    }>(`${environment.apiUrl}/auth/send-login-otp`, request);
  }

  // ============================================
  // Login (Mobile OTP) - Verify OTP
  // ============================================

  verifyLoginOtp(request: VerifyLoginOtpRequest): Observable<{
    success: boolean;
    message: string;
    data: LoginResponse;
  }> {
    return this.http.post<{
      success: boolean;
      message: string;
      data: LoginResponse;
    }>(`${environment.apiUrl}/auth/verify-login-otp`, request);
  }

  // ============================================
  // Verify Email
  // ============================================

  verifyEmail(
    farmHouseId: number,
    userId: number,
    token: string,
  ): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/auth/verify-email`, {
      params: {
        farmHouseId: farmHouseId,
        userId: userId,
        token: token,
      },
    });
  }

  // ============================================
  // Verify OTP
  // ============================================

  verifyOtp(request: {
    farmHouseId: number;
    userId: number;
    otpCode: string;
  }): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/auth/verify-otp`,
      request,
    );
  }

  // ============================================
  // Resend OTP
  // ============================================

  resendOtp(request: ResendOtpRequest): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/auth/resend-otp`,
      request,
    );
  }

  // ============================================
  // Forgot Password
  // ============================================

  forgotPassword(request: ForgotPasswordRequest): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/auth/forgot-password`,
      request,
    );
  }

  // ============================================
  // Reset Password - Email
  // ============================================

  resetPasswordEmail(request: ResetPasswordEmailRequest): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/auth/reset-password-email`,
      request,
    );
  }

  // ============================================
  // Reset Password - WhatsApp OTP
  // ============================================

  resetPasswordOtp(request: ResetPasswordOtpRequest): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/auth/reset-password-otp`,
      request,
    );
  }

  // ============================================
  // Get Profile
  // ============================================

  getProfile(): Observable<{
    success: boolean;
    message: string;
    data: Profile;
  }> {
    return this.http.get<{
      success: boolean;
      message: string;
      data: Profile;
    }>(`${environment.apiUrl}/auth/profile`);
  }

  // ============================================
  // Change Password
  // ============================================

  changePassword(request: ChangePasswordRequest): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/auth/change-password`,
      request,
    );
  }
}
