import { Component, inject } from '@angular/core';

import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import { Router } from '@angular/router';

import Swal from 'sweetalert2';

import { AuthService } from '../../../core/services/auth.service';
import { ChangePasswordRequest } from '../models/change-password-request.model';



@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.css',
})
export class ChangePasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  // ============================================
  // Component State
  // ============================================

  isSubmitting = false;

  showCurrentPassword = false;
  showPassword = false;
  showConfirmPassword = false;

  // ============================================
  // Change Password Form
  // ============================================

  changePasswordForm: FormGroup = this.fb.group(
    {
      currentPassword: ['', Validators.required],

      newPassword: [
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
    return this.changePasswordForm.controls;
  }

  // ============================================
  // Password Match Validator
  // ============================================

  passwordMatchValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const newPassword = control.get('newPassword')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;

      if (
        newPassword &&
        confirmPassword &&
        newPassword !== confirmPassword
      ) {
        return {
          passwordMismatch: true,
        };
      }

      return null;
    };
  }

  // ============================================
  // Toggle Current Password
  // ============================================

  toggleCurrentPassword(): void {
    this.showCurrentPassword = !this.showCurrentPassword;
  }

  // ============================================
  // Toggle New Password
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
  // Submit
  // ============================================

  onSubmit(): void {
    // --------------------------------------------
    // Validate Form
    // --------------------------------------------

    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
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

    const request: ChangePasswordRequest = {
      currentPassword:
        this.f['currentPassword'].value?.trim(),

      newPassword:
        this.f['newPassword'].value,

      confirmPassword:
        this.f['confirmPassword'].value,
    };

    // --------------------------------------------
    // API Call
    // --------------------------------------------

    this.authService.changePassword(request).subscribe({
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
            title: 'Change Password Failed',
            text:
              response?.message ??
              'Unable to change your password. Please try again.',
            confirmButtonColor: '#c4512d',
          });

          return;
        }

        // ----------------------------------------
        // API Success
        // ----------------------------------------

        Swal.fire({
          icon: 'success',
          title: 'Password Changed Successfully',
          text:
            response?.message ??
            'Your password has been changed successfully.',
          confirmButtonColor: '#c4512d',
        }).then(() => {
          this.changePasswordForm.reset();

          this.router.navigate(['/profile']);
        });
      },

      // ==========================================
      // HTTP Error
      // ==========================================

      error: (error: any) => {
        this.isSubmitting = false;

        Swal.fire({
          icon: 'error',
          title: 'Change Password Failed',
          text:
            error?.error?.message ??
            'Something went wrong while changing your password.',
          confirmButtonColor: '#c4512d',
        });

        console.error('Change Password Error:', error);
      },
    });
  }
}