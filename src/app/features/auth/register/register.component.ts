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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from './../../../core/services/auth.service';
import { RegisterRequest } from '../models/register-request.model';

import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  registerForm: FormGroup;

  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;

  private destroyRef = inject(DestroyRef);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.registerForm = this.fb.group(
      {
        fullName: ['', [Validators.required]],

        email: ['', [Validators.required, Validators.email]],

        mobileNumber: [
          '',
          [Validators.required, Validators.pattern(/^[0-9]{10}$/)],
        ],

        password: [
          '',
          [
            Validators.required,
            Validators.pattern(
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/,
            ),
          ],
        ],

        confirmPassword: ['', [Validators.required]],
      },
      {
        validators: this.passwordMatchValidator(),
      },
    );
  }

  get f() {
    return this.registerForm.controls;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

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

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;

    Swal.fire({
      title: 'Creating Account...',
      text: 'Please wait',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const request: RegisterRequest = {
      fullName: this.registerForm.value.fullName,
      email: this.registerForm.value.email,
      mobileNumber: this.registerForm.value.mobileNumber,
      password: this.registerForm.value.password,
    };

    this.authService
      .register(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          this.isLoading = false;

          Swal.close();

          if (!response?.success || !response?.data) {
            Swal.fire({
              icon: 'error',
              title: 'Registration Failed',
              text:
                response?.message ??
                'Unable to create your account. Please try again.',
              confirmButtonColor: '#c4512d',
            });

            return;
          }

          // ============================================
          // Registration Response
          // ============================================

          const data = response.data;

          const userId = data.userId;
          const farmHouseId = data.farmHouseId;

          const isEmailVerified = data.isEmailVerified ?? false;
          const isMobileVerified = data.isMobileVerified ?? false;

          // ============================================
          // Validate Verification Information
          // ============================================

          if (!userId || !farmHouseId) {
            Swal.fire({
              icon: 'error',
              title: 'Registration Failed',
              text: 'Verification information could not be generated.',
              confirmButtonColor: '#c4512d',
            });

            return;
          }

          // ============================================
          // Registration Successful
          // ============================================

          Swal.fire({
            icon: 'success',
            title: 'Registration Successful',
            text: 'Please complete your account verification to continue.',
            confirmButtonColor: '#c4512d',
            allowOutsideClick: false,
          }).then(() => {
            this.registerForm.reset();

            // ============================================
            // Navigate To Verification Page
            // ============================================
            //
            // We are passing the initial verification
            // status received from RegisterResponseDto.
            //
            // No getVerificationStatus() API is required
            // for the initial registration redirect.
            //
            this.router.navigate(['/verify-email'], {
              queryParams: {
                userId: userId,
                farmHouseId: farmHouseId,
                isEmailVerified: isEmailVerified,
                isMobileVerified: isMobileVerified,
              },
            });
          });
        },

        error: (error: any) => {
          this.isLoading = false;

          Swal.close();

          Swal.fire({
            icon: 'error',
            title: 'Registration Failed',
            text:
              error?.error?.message ??
              'Something went wrong while creating your account.',
            confirmButtonColor: '#c4512d',
          });

          console.error('Registration Error:', error);
        },
      });
  }
}
