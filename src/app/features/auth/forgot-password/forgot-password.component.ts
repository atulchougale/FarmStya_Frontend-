import { Component, inject } from '@angular/core';

import { Router, RouterLink } from '@angular/router';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import Swal from 'sweetalert2';

import { AuthService } from '../../../core/services/auth.service';

import { ForgotPasswordRequest } from '../models/forgot-password-request.model';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  // ============================================
  // Component State
  // ============================================

  isSubmitting = false;

  // 1 = Email
  // 2 = Mobile OTP
  selectedMethod = 1;

  // ============================================
  // Forgot Password Form
  // ============================================

  forgotPasswordForm: FormGroup = this.fb.group({
    method: [1, Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mobileNumber: [''],
  });

  // ============================================
  // Form Controls
  // ============================================

  get f() {
    return this.forgotPasswordForm.controls;
  }

  // ============================================
  // Initial Setup
  // ============================================

  constructor() {
    this.setEmailValidation();
  }

  // ============================================
  // Change Reset Method
  // ============================================

  onMethodChange(method: number): void {
    this.selectedMethod = method;

    // Update selected method
    this.forgotPasswordForm.patchValue({
      method: method,
    });

    // Clear previous input
    this.forgotPasswordForm.patchValue({
      email: '',
      mobileNumber: '',
    });

    // Apply validation according to method
    if (method === 1) {
      this.setEmailValidation();
    } else {
      this.setMobileValidation();
    }
  }

  // ============================================
  // Email Validation
  // ============================================

  private setEmailValidation(): void {
    this.f['email'].setValidators([Validators.required, Validators.email]);

    this.f['mobileNumber'].clearValidators();

    this.updateValidation();
  }

  // ============================================
  // Mobile Validation
  // ============================================

  private setMobileValidation(): void {
    this.f['email'].clearValidators();

    this.f['mobileNumber'].setValidators([
      Validators.required,
      Validators.pattern(/^[0-9]{10}$/),
    ]);

    this.updateValidation();
  }

  // ============================================
  // Update Validation
  // ============================================

  private updateValidation(): void {
    Object.keys(this.forgotPasswordForm.controls).forEach((controlName) => {
      this.f[controlName].updateValueAndValidity();
    });
  }

  // ============================================
  // Submit
  // ============================================

  onSubmit(): void {
    // --------------------------------------------
    // Validate Form
    // --------------------------------------------

    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    // --------------------------------------------
    // Prevent Duplicate Request
    // --------------------------------------------

    if (this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;

    // --------------------------------------------
    // Prepare Request
    // --------------------------------------------

    const request: ForgotPasswordRequest = {
      method: this.selectedMethod,

      email: this.selectedMethod === 1 ? this.f['email'].value?.trim() : '',

      mobileNumber:
        this.selectedMethod === 2 ? this.f['mobileNumber'].value?.trim() : '',
    };

    // --------------------------------------------
    // API Call
    // --------------------------------------------

    this.authService.forgotPassword(request).subscribe({
      // ==========================================
      // API Response
      // ==========================================

      next: (response: any) => {
        this.isSubmitting = false;

        // ----------------------------------------
        // API Failure
        // ----------------------------------------

        if (!response?.success) {
          Swal.fire({
            icon: 'error',

            title:
              this.selectedMethod === 1
                ? 'Unable to Send Email'
                : 'Unable to Send OTP',

            text:
              response?.message ??
              'Unable to process your password reset request.',

            confirmButtonColor: '#c4512d',
          });

          return;
        }

        // ========================================
        // Email Flow
        // ========================================

        if (this.selectedMethod === 1) {
          Swal.fire({
            icon: 'success',
            title: 'Email Sent',

            text:
              response?.message ??
              'Password reset instructions have been sent to your email.',

            confirmButtonColor: '#c4512d',
          }).then(() => {
            // Backend has already sent the reset link.
            // User will open the link from email.

            this.forgotPasswordForm.reset({
              method: 1,
              email: '',
              mobileNumber: '',
            });

            this.selectedMethod = 1;

            this.setEmailValidation();
          });

          return;
        }

        // ========================================
        // Mobile OTP Flow
        // ========================================

        if (this.selectedMethod === 2) {
          const mobileNumber = this.f['mobileNumber'].value?.trim();

          Swal.fire({
            icon: 'success',
            title: 'OTP Sent',

            text:
              response?.message ??
              'Password reset OTP has been sent to your mobile.',

            confirmButtonColor: '#c4512d',
          }).then(() => {
            // Navigate to common Reset Password page
            // for OTP mode.

            this.router.navigate(['/reset-password'], {
              queryParams: {
                method: 'otp',
                mobileNumber: mobileNumber,
              },
            });
          });

          return;
        }
      },

      // ==========================================
      // HTTP Error
      // ==========================================

      error: (error: any) => {
        this.isSubmitting = false;

        Swal.fire({
          icon: 'error',

          title:
            this.selectedMethod === 1
              ? 'Email Reset Failed'
              : 'OTP Reset Failed',

          text:
            error?.error?.message ??
            'Something went wrong while processing your request.',

          confirmButtonColor: '#c4512d',
        });

        console.error('Forgot Password Error:', error);
      },
    });
  }
}
