import { Component, OnDestroy } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import Swal from 'sweetalert2';

import { AuthService } from '../../../core/services/auth.service';
import { TokenService } from '../../../core/services/token.service';

import { LoginRequest } from '../models/login-request.model';
import { LoginResponse } from '../models/login-response.model';

type LoginMode = 'password' | 'otp';

type LoginApiResponse = {
  success: boolean;
  message: string;
  data: LoginResponse;
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent implements OnDestroy {
  // ============================================
  // Forms
  // ============================================

  loginForm: FormGroup;

  otpForm: FormGroup;

  // ============================================
  // UI State
  // ============================================

  loginMode: LoginMode = 'otp';

  showPassword = false;

  isSubmitting = false;

  // ============================================
  // OTP State
  // ============================================

  otpSent = false;

  isSendingOtp = false;

  isVerifyingOtp = false;

  resendSeconds = 0;

  // Must match the resend cooldown enforced by the backend (60 seconds)
  private readonly resendCooldownSeconds = 60;

  private resendTimerId: ReturnType<typeof setInterval> | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private tokenService: TokenService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],

      password: ['', Validators.required],

      rememberMe: [false],
    });

    this.otpForm = this.fb.group({
      mobileNumber: [
        '',
        [Validators.required, Validators.pattern(/^[0-9]{10}$/)],
      ],

      otpCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],

      rememberMe: [false],
    });
  }

  ngOnDestroy(): void {
    this.clearResendTimer();
  }

  // ============================================
  // Form Controls
  // ============================================

  get f() {
    return this.loginForm.controls;
  }

  get o() {
    return this.otpForm.controls;
  }

  // Example: 9876543210 -> 98******10
  get maskedMobile(): string {
    const mobile = (this.o['mobileNumber'].value ?? '') as string;

    return mobile.length === 10
      ? `${mobile.slice(0, 2)}******${mobile.slice(-2)}`
      : mobile;
  }

  // ============================================
  // Login Mode Toggle
  // ============================================

  setLoginMode(mode: LoginMode): void {
    if (this.loginMode === mode) {
      return;
    }

    this.loginMode = mode;

    // Leaving or entering OTP mode always restarts the OTP flow
    this.resetOtpFlow();
  }

  // ============================================
  // Toggle Password
  // ============================================

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // ============================================
  // Digits-only input (mobile number / OTP)
  // ============================================

  onDigitsInput(
    controlName: 'mobileNumber' | 'otpCode',
    maxLength: number,
  ): void {
    const control = this.otpForm.get(controlName);

    const current = (control?.value ?? '').toString();

    const cleaned = current.replace(/\D/g, '').slice(0, maxLength);

    if (cleaned !== current) {
      control?.setValue(cleaned);
    }
  }

  // ============================================
  // Login (Email + Password)
  // ============================================

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    const request: LoginRequest = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password,
    };

    this.authService.login(request).subscribe({
      next: (response) => {
        this.isSubmitting = false;

        this.handleLoginResponse(
          response,
          !!this.loginForm.value.rememberMe,
          'Invalid email or password.',
        );
      },

      error: (error: any) => {
        this.isSubmitting = false;

        console.error('Login Error:', error);

        this.handleLoginHttpError(error, 'Invalid email or password.');
      },
    });
  }

  // ============================================
  // Login (Mobile OTP) - Step 1: Send OTP
  // ============================================

  sendOtp(): void {
    const mobileControl = this.o['mobileNumber'];

    if (mobileControl.invalid) {
      mobileControl.markAsTouched();
      return;
    }

    this.isSendingOtp = true;

    this.authService
      .sendLoginOtp({ mobileNumber: mobileControl.value })
      .subscribe({
        next: (response) => {
          this.isSendingOtp = false;

          if (!response?.success) {
            this.showError(
              'Could not send OTP',
              response?.message ?? 'Unable to send OTP. Please try again.',
            );

            return;
          }

          this.otpSent = true;

          this.otpForm.patchValue({ otpCode: '' });
          this.o['otpCode'].markAsUntouched();

          this.startResendTimer();

          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'OTP sent to your WhatsApp',
            showConfirmButton: false,
            timer: 2500,
          });
        },

        error: (error: any) => {
          this.isSendingOtp = false;

          console.error('Send login OTP error:', error);

          this.showError(
            'Could not send OTP',
            error?.error?.message ?? 'Unable to send OTP. Please try again.',
          );
        },
      });
  }

  resendOtp(): void {
    if (this.resendSeconds > 0 || this.isSendingOtp) {
      return;
    }

    this.sendOtp();
  }

  // Go back to the mobile number step
  changeNumber(): void {
    this.resetOtpFlow();
  }

  // ============================================
  // Login (Mobile OTP) - Step 2: Verify OTP
  // ============================================

  verifyOtp(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    this.isVerifyingOtp = true;

    this.authService
      .verifyLoginOtp({
        mobileNumber: this.otpForm.value.mobileNumber,
        otpCode: this.otpForm.value.otpCode,
      })
      .subscribe({
        next: (response) => {
          this.isVerifyingOtp = false;

          this.handleLoginResponse(
            response,
            !!this.otpForm.value.rememberMe,
            'Invalid OTP.',
          );
        },

        error: (error: any) => {
          this.isVerifyingOtp = false;

          console.error('Verify login OTP error:', error);

          // Let the user retype the OTP after a wrong attempt
          this.otpForm.patchValue({ otpCode: '' });
          this.o['otpCode'].markAsUntouched();

          this.handleLoginHttpError(error, 'Invalid OTP.');
        },
      });
  }

  // ============================================
  // OTP Helpers
  // ============================================

  private resetOtpFlow(): void {
    this.otpSent = false;

    this.isSendingOtp = false;
    this.isVerifyingOtp = false;

    this.clearResendTimer();

    this.resendSeconds = 0;

    this.otpForm.patchValue({ otpCode: '' });
    this.o['otpCode'].markAsUntouched();
  }

  private startResendTimer(): void {
    this.clearResendTimer();

    this.resendSeconds = this.resendCooldownSeconds;

    this.resendTimerId = setInterval(() => {
      this.resendSeconds--;

      if (this.resendSeconds <= 0) {
        this.resendSeconds = 0;

        this.clearResendTimer();
      }
    }, 1000);
  }

  private clearResendTimer(): void {
    if (this.resendTimerId) {
      clearInterval(this.resendTimerId);

      this.resendTimerId = null;
    }
  }

  // ============================================
  // Shared: Handle Login API Response
  // (used by both password and OTP login)
  // ============================================

  private handleLoginResponse(
    response: LoginApiResponse | null,
    rememberMe: boolean,
    fallbackErrorMessage: string,
  ): void {
    if (!response) {
      this.showError('Login Failed', 'Invalid response received from server.');

      return;
    }

    // The backend normally returns BadRequest (handled in the error callback),
    // but this keeps the frontend safe for HTTP 200 responses with success = false.
    if (!response.success) {
      this.handleVerificationOrLoginError(response, fallbackErrorMessage);

      return;
    }

    if (!response.data) {
      this.showError(
        'Login Failed',
        'Login information was not received from server.',
      );

      return;
    }

    this.tokenService.saveLogin(response.data, rememberMe);

    Swal.fire({
      icon: 'success',
      title: 'Welcome',
      text: response.message ?? 'Login successful.',
      timer: 1500,
      showConfirmButton: false,
    }).then(() => {
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

      this.router.navigateByUrl(returnUrl ?? '/dashboard');
    });
  }

  // ============================================
  // Shared: Handle HTTP Error Response
  // ============================================

  private handleLoginHttpError(error: any, fallbackErrorMessage: string): void {
    const response = error?.error;

    // Unverified user: send to the verification page
    if (
      response?.data &&
      (response.data.isEmailVerified === false ||
        response.data.isMobileVerified === false)
    ) {
      this.redirectToVerification(response);

      return;
    }

    this.showError('Login Failed', response?.message ?? fallbackErrorMessage);
  }

  // ============================================
  // Handle Verification / Login Error
  // ============================================

  private handleVerificationOrLoginError(
    response: any,
    fallbackErrorMessage: string,
  ): void {
    const data = response?.data;

    if (
      data &&
      (data.isEmailVerified === false || data.isMobileVerified === false)
    ) {
      this.redirectToVerification(response);

      return;
    }

    this.showError('Login Failed', response?.message ?? fallbackErrorMessage);
  }

  // ============================================
  // Redirect To Verification Page
  // ============================================

  private redirectToVerification(response: any): void {
    const data = response?.data;

    if (!data?.userId || !data?.farmHouseId) {
      this.showError(
        'Verification Required',
        'Verification information is missing. Please register again.',
      );

      return;
    }

    Swal.fire({
      icon: 'warning',
      title: 'Verification Required',
      text:
        response?.message ??
        'Please verify your email and mobile number to continue.',
      confirmButtonColor: '#c4512d',
      allowOutsideClick: false,
    }).then(() => {
      this.router.navigate(['/verify-email'], {
        queryParams: {
          userId: data.userId,
          farmHouseId: data.farmHouseId,
          isEmailVerified: data.isEmailVerified,
          isMobileVerified: data.isMobileVerified,
        },
      });
    });
  }

  // ============================================
  // Error Popup
  // ============================================

  private showError(title: string, text: string): void {
    Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonColor: '#c4512d',
    });
  }
}
