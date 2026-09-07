import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import Swal from 'sweetalert2';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css',
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  // ============================================
  // User / FarmHouse Information
  // ============================================

  userId!: number;
  farmHouseId!: number;

  // ============================================
  // Verification Status
  // ============================================

  isEmailVerified = false;
  isMobileVerified = false;

  // ============================================
  // Page State
  // ============================================

  isLoading = true;
  isVerifyingOtp = false;
  isResendingOtp = false;

  message = '';

  // ============================================
  // OTP Form
  // ============================================

  otpForm: FormGroup;

  constructor() {
    this.otpForm = this.fb.group({
      otpCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    });
  }

  // ============================================
  // Form Controls
  // ============================================

  get f() {
    return this.otpForm.controls;
  }

  // ============================================
  // Initial Load
  // ============================================

  ngOnInit(): void {
    const userIdParam = this.route.snapshot.queryParamMap.get('userId');

    const farmHouseIdParam =
      this.route.snapshot.queryParamMap.get('farmHouseId');

    const token = this.route.snapshot.queryParamMap.get('token');

    const isEmailVerifiedParam =
      this.route.snapshot.queryParamMap.get('isEmailVerified');

    const isMobileVerifiedParam =
      this.route.snapshot.queryParamMap.get('isMobileVerified');

    // ============================================
    // Validate Required IDs
    // ============================================

    if (!userIdParam || !farmHouseIdParam) {
      this.isLoading = false;

      this.message =
        'Verification information is missing. Please register again.';

      return;
    }

    const userId = Number(userIdParam);
    const farmHouseId = Number(farmHouseIdParam);

    // ============================================
    // Validate IDs
    // ============================================

    if (
      !Number.isInteger(userId) ||
      userId <= 0 ||
      !Number.isInteger(farmHouseId) ||
      farmHouseId <= 0
    ) {
      this.isLoading = false;

      this.message = 'Invalid verification information. Please register again.';

      return;
    }

    this.userId = userId;
    this.farmHouseId = farmHouseId;

    // ============================================
    // Email Link Case
    // ============================================
    //
    // User clicked verification link received
    // in email.
    //
    // Token exists -> verify email from backend.
    //
    // ============================================

    if (token) {
      this.verifyEmailFromLink(token);
      return;
    }

    // ============================================
    // Registration Redirect Case
    // ============================================
    //
    // Registration response already contains:
    //
    // isEmailVerified
    // isMobileVerified
    //
    // Therefore no separate
    // getVerificationStatus() API is required.
    //
    // ============================================

    this.isEmailVerified = isEmailVerifiedParam === 'true';

    this.isMobileVerified = isMobileVerifiedParam === 'true';

    this.isLoading = false;

    // ============================================
    // Check Initial Status
    // ============================================

    if (this.isEmailVerified && this.isMobileVerified) {
      this.redirectToLogin();
      return;
    }

    this.updateVerificationMessage();
  }

  // ============================================
  // Verify Email From Email Link
  // ============================================

  private verifyEmailFromLink(token: string): void {
    this.isLoading = true;

    this.authService
      .verifyEmail(this.farmHouseId, this.userId, token)
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;

          // ========================================
          // Backend Verification Failed
          // ========================================

          if (!response?.success) {
            this.message = response?.message ?? 'Email verification failed.';

            this.updateVerificationMessage();

            return;
          }

          // ========================================
          // Update Latest Verification Status
          // ========================================

          if (response.data) {
            this.isEmailVerified = response.data.isEmailVerified ?? false;

            this.isMobileVerified = response.data.isMobileVerified ?? false;
          } else {
            // Fallback only if backend does not return
            // data for some reason.

            this.isEmailVerified = true;
          }

          // ========================================
          // Check Both Verification
          // ========================================

          if (this.isEmailVerified && this.isMobileVerified) {
            this.redirectToLogin();
            return;
          }

          // ========================================
          // One Verification Still Pending
          // ========================================

          this.message = response.message ?? 'Email verified successfully.';

          this.updateVerificationMessage();
        },

        error: (error: any) => {
          this.isLoading = false;

          this.message = error?.error?.message ?? 'Email verification failed.';

          this.updateVerificationMessage();
        },
      });
  }

  // ============================================
  // Verify OTP
  // ============================================

  verifyOtp(): void {
    if (this.otpForm.invalid) {
      this.otpForm.markAllAsTouched();
      return;
    }

    // ============================================
    // Mobile Already Verified
    // ============================================

    if (this.isMobileVerified) {
      return;
    }

    this.isVerifyingOtp = true;

    const otpCode = this.otpForm.get('otpCode')?.value;

    this.authService
      .verifyOtp({
        userId: this.userId,
        farmHouseId: this.farmHouseId,
        otpCode: otpCode,
      })
      .subscribe({
        next: (response: any) => {
          this.isVerifyingOtp = false;

          // ========================================
          // Backend Verification Failed
          // ========================================

          if (!response?.success) {
            Swal.fire({
              icon: 'error',
              title: 'OTP Verification Failed',
              text: response?.message ?? 'Invalid OTP.',
              confirmButtonColor: '#c4512d',
            });

            return;
          }

          // ========================================
          // Update Latest Verification Status
          // ========================================

          if (response.data) {
            this.isEmailVerified = response.data.isEmailVerified ?? false;

            this.isMobileVerified = response.data.isMobileVerified ?? false;
          } else {
            // Fallback only if backend does not return
            // data for some reason.

            this.isMobileVerified = true;
          }

          this.otpForm.reset();

          // ========================================
          // Both Verification Completed
          // ========================================

          if (this.isEmailVerified && this.isMobileVerified) {
            this.redirectToLogin();
            return;
          }

          // ========================================
          // Email Still Pending
          // ========================================

          this.message = 'Mobile number verified successfully.';

          this.updateVerificationMessage();

          Swal.fire({
            icon: 'success',
            title: 'Mobile Verified',
            text: 'Your mobile number has been verified successfully.',
            timer: 1800,
            showConfirmButton: false,
          });
        },

        error: (error: any) => {
          this.isVerifyingOtp = false;

          Swal.fire({
            icon: 'error',
            title: 'OTP Verification Failed',
            text: error?.error?.message ?? 'Invalid OTP.',
            confirmButtonColor: '#c4512d',
          });
        },
      });
  }

  // ============================================
  // Resend OTP
  // ============================================

  resendOtp(): void {
    if (!this.userId || !this.farmHouseId || this.isResendingOtp) {
      return;
    }

    // ============================================
    // Mobile Already Verified
    // ============================================

    if (this.isMobileVerified) {
      Swal.fire({
        icon: 'info',
        title: 'Already Verified',
        text: 'Your mobile number is already verified.',
        confirmButtonColor: '#c4512d',
      });

      return;
    }

    this.isResendingOtp = true;

    this.authService
      .resendOtp({
        userId: this.userId,
        farmHouseId: this.farmHouseId,
      })
      .subscribe({
        next: (response: any) => {
          this.isResendingOtp = false;

          // ========================================
          // Resend Failed
          // ========================================

          if (!response?.success) {
            Swal.fire({
              icon: 'error',
              title: 'Unable to Resend OTP',
              text: response?.message ?? 'Unable to resend OTP.',
              confirmButtonColor: '#c4512d',
            });

            return;
          }

          // ========================================
          // Resend Successful
          // ========================================

          Swal.fire({
            icon: 'success',
            title: 'OTP Sent',
            text:
              response?.message ??
              'A new OTP has been sent to your WhatsApp number.',
            timer: 2000,
            showConfirmButton: false,
          });
        },

        error: (error: any) => {
          this.isResendingOtp = false;

          Swal.fire({
            icon: 'error',
            title: 'Unable to Resend OTP',
            text:
              error?.error?.message ??
              'Something went wrong while resending OTP.',
            confirmButtonColor: '#c4512d',
          });
        },
      });
  }

  // ============================================
  // Update Verification Message
  // ============================================

  private updateVerificationMessage(): void {
    // ============================================
    // Both Verified
    // ============================================

    if (this.isEmailVerified && this.isMobileVerified) {
      this.message =
        'Your email and mobile number have been verified successfully.';

      return;
    }

    // ============================================
    // Email Pending
    // ============================================

    if (!this.isEmailVerified) {
      if (this.isMobileVerified) {
        this.message =
          'Your mobile number is verified. Please check your email and click the verification link.';
      } else {
        this.message =
          'Please check your email and click the verification link to verify your email address.';
      }

      return;
    }

    // ============================================
    // Email Verified + Mobile Pending
    // ============================================

    if (this.isEmailVerified && !this.isMobileVerified) {
      this.message =
        'Your email is verified. Please verify your mobile number using the OTP.';
    }
  }

  // ============================================
  // Redirect To Login
  // ============================================

  private redirectToLogin(): void {
    Swal.fire({
      icon: 'success',
      title: 'Verification Complete',
      text: 'Your email and mobile number have been verified successfully.',
      timer: 1800,
      showConfirmButton: false,
      allowOutsideClick: false,
    }).then(() => {
      this.router.navigate(['/login']);
    });
  }
}
