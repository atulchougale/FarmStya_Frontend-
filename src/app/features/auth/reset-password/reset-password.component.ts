import { Component, inject, OnInit } from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  ValidatorFn,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';

import Swal from 'sweetalert2';

import { AuthService } from '../../../core/services/auth.service';

import { ResetPasswordEmailRequest } from '../models/reset-password-email-request.model';

import { ResetPasswordOtpRequest } from '../models/reset-password-otp-request.model';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  // ============================================
  // Component State
  // ============================================

  isSubmitting = false;
  method = '';
  // email | otp
  resetMethod: 'email' | 'otp' = 'email';

  // Email Reset Details
  farmHouseId = 0;
  userId = 0;
  token = '';

  // OTP Reset Details
  mobileNumber = '';

  showPassword = false;
  showConfirmPassword = false;

  // ============================================
  // Reset Password Form
  // ============================================

  resetPasswordForm: FormGroup = this.fb.group(
    {
      otpCode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],

      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/,
          ),
        ],
      ],

      confirmPassword: ['', Validators.required],
    },
    {
      validators: this.passwordMatchValidator(),
    },
  );

  // ============================================
  // Form Controls
  // ============================================

  get f() {
    return this.resetPasswordForm.controls;
  }

  // ============================================
  // Password Match Validator
  // ============================================

  passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get('password')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;

      if (password && confirmPassword && password !== confirmPassword) {
        return {
          passwordMismatch: true,
        };
      }

      return null;
    };
  }

  // ============================================
  // Toggle Password
  // ============================================

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // ============================================
  // Toggle Confirm Password
  // ============================================

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  // ============================================
  // Initial Load
  // ============================================

  ngOnInit(): void {
    const queryParams = this.route.snapshot.queryParamMap;

    const method = queryParams.get('method');

    this.method = this.route.snapshot.queryParamMap.get('method') ?? '';
    // --------------------------------------------
    // Determine Reset Method
    // --------------------------------------------

    if (method === 'otp') {
      this.resetMethod = 'otp';

      this.mobileNumber = queryParams.get('mobileNumber') ?? '';

      // OTP is required in OTP mode
      this.f['otpCode'].setValidators([
        Validators.required,
        Validators.pattern(/^[0-9]{6}$/),
      ]);

      this.f['otpCode'].updateValueAndValidity();

      // Validate mobile number
      if (!this.mobileNumber) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Request',
          text: 'Mobile number is missing.',
          confirmButtonColor: '#c4512d',
        });

        return;
      }

      return;
    }

    // --------------------------------------------
    // Email Reset Mode
    // --------------------------------------------

    this.resetMethod = 'email';

    this.farmHouseId = Number(queryParams.get('farmHouseId'));

    this.userId = Number(queryParams.get('userId'));

    this.token = queryParams.get('token') ?? '';

    // OTP is not required in Email mode
    this.f['otpCode'].clearValidators();
    this.f['otpCode'].updateValueAndValidity();

    // Validate Email Reset Parameters
    if (!this.farmHouseId || !this.userId || !this.token) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid Link',
        text: 'Password reset link is missing or invalid.',
        confirmButtonColor: '#c4512d',
      });
    }
  }

  // ============================================
  // Reset Password
  // ============================================

  onSubmit(): void {
    // --------------------------------------------
    // Validate Form
    // --------------------------------------------

    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    // --------------------------------------------
    // Prevent Duplicate Request
    // --------------------------------------------

    if (this.isSubmitting) {
      return;
    }

    // --------------------------------------------
    // Validate Reset Details
    // --------------------------------------------

    if (this.resetMethod === 'email') {
      if (!this.farmHouseId || !this.userId || !this.token) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Link',
          text: 'Password reset link is missing or invalid.',
          confirmButtonColor: '#c4512d',
        });

        return;
      }
    }

    if (this.resetMethod === 'otp') {
      if (!this.mobileNumber) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid Request',
          text: 'Mobile number is missing.',
          confirmButtonColor: '#c4512d',
        });

        return;
      }
    }

    this.isSubmitting = true;

    // ============================================
    // Email Reset Flow
    // ============================================

    if (this.resetMethod === 'email') {
      const request: ResetPasswordEmailRequest = {
        userId: this.userId,
        token: this.token,
        newPassword: this.f['password'].value,
        confirmPassword: this.f['confirmPassword'].value,
      };

      this.authService.resetPasswordEmail(request).subscribe({
        next: (response: any) => {
          this.isSubmitting = false;

          // ------------------------------------
          // API Failure
          // ------------------------------------

          if (!response?.success) {
            Swal.fire({
              icon: 'error',
              title: 'Reset Failed',
              text: response?.message ?? 'Unable to reset your password.',
              confirmButtonColor: '#c4512d',
            });

            return;
          }

          // ------------------------------------
          // API Success
          // ------------------------------------

          Swal.fire({
            icon: 'success',
            title: 'Password Reset Successful',
            text:
              response?.message ?? 'Your password has been reset successfully.',
            confirmButtonColor: '#c4512d',
          }).then(() => {
            this.resetPasswordForm.reset();
            this.router.navigate(['/login']);
          });
        },

        error: (error: any) => {
          this.isSubmitting = false;

          Swal.fire({
            icon: 'error',
            title: 'Reset Failed',
            text:
              error?.error?.message ??
              'Something went wrong while resetting your password.',
            confirmButtonColor: '#c4512d',
          });

          console.error('Email Reset Password Error:', error);
        },
      });

      return;
    }

    // ============================================
    // OTP Reset Flow
    // ============================================

    const request: ResetPasswordOtpRequest = {
      mobileNumber: this.mobileNumber,
      otpCode: this.f['otpCode'].value?.trim(),
      newPassword: this.f['password'].value,
      confirmPassword: this.f['confirmPassword'].value,
    };

    this.authService.resetPasswordOtp(request).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;

        // --------------------------------------
        // API Failure
        // --------------------------------------

        if (!response?.success) {
          Swal.fire({
            icon: 'error',
            title: 'Reset Failed',
            text:
              response?.message ??
              'Invalid OTP or unable to reset your password.',
            confirmButtonColor: '#c4512d',
          });

          return;
        }

        // --------------------------------------
        // API Success
        // --------------------------------------

        Swal.fire({
          icon: 'success',
          title: 'Password Reset Successful',
          text:
            response?.message ?? 'Your password has been reset successfully.',
          confirmButtonColor: '#c4512d',
        }).then(() => {
          this.resetPasswordForm.reset();
          this.router.navigate(['/login']);
        });
      },

      error: (error: any) => {
        this.isSubmitting = false;

        Swal.fire({
          icon: 'error',
          title: 'Reset Failed',
          text:
            error?.error?.message ??
            'Something went wrong while resetting your password.',
          confirmButtonColor: '#c4512d',
        });

        console.error('OTP Reset Password Error:', error);
      },
    });
  }
}
