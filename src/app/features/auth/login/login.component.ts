import { Component } from '@angular/core';

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

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginForm: FormGroup;

  showPassword = false;

  isSubmitting = false;

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
  }

  // ============================================
  // Form Controls
  // ============================================

  get f() {
    return this.loginForm.controls;
  }

  // ============================================
  // Toggle Password
  // ============================================

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  // ============================================
  // Login
  // ============================================

  onSubmit(): void {
    // --------------------------------------------
    // Validate Form
    // --------------------------------------------

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
      // ==========================================
      // SUCCESS HTTP RESPONSE
      // ==========================================

      next: (response) => {
        this.isSubmitting = false;

        // ----------------------------------------
        // Safety Check
        // ----------------------------------------

        if (!response) {
          Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: 'Invalid response received from server.',
            confirmButtonColor: '#c4512d',
          });

          return;
        }

        // ========================================
        // CASE 1
        // API returned Success = false
        //
        // Normally this will come through error()
        // because backend controller returns
        // BadRequest(), but keeping this here
        // makes frontend safe for HTTP 200 responses.
        // ========================================

        if (!response.success) {
          this.handleVerificationOrLoginError(response);
          return;
        }

        // ========================================
        // CASE 2
        // Successful Login
        // ========================================

        if (!response.data) {
          Swal.fire({
            icon: 'error',
            title: 'Login Failed',
            text: 'Login information was not received from server.',
            confirmButtonColor: '#c4512d',
          });

          return;
        }

        // ----------------------------------------
        // Save Login Details
        // ----------------------------------------

        this.tokenService.saveLogin(
          response.data,
          this.loginForm.value.rememberMe,
        );

        // ----------------------------------------
        // Verify Saved Data
        // ----------------------------------------

        console.log('Access Token : ', this.tokenService.getAccessToken());

        console.log('User : ', this.tokenService.getCurrentUser());

        // ----------------------------------------
        // Login Success
        // ----------------------------------------

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
      },

      // ==========================================
      // HTTP ERROR RESPONSE
      // ==========================================

      error: (error: any) => {
        this.isSubmitting = false;

        const response = error?.error;

        console.log('Login API Error Response:', response);

        // ========================================
        // Unverified User
        // ========================================

        if (
          response?.data &&
          (response.data.isEmailVerified === false ||
            response.data.isMobileVerified === false)
        ) {
          this.redirectToVerification(response);

          return;
        }

        // ========================================
        // Other Login Error
        // ========================================

        Swal.fire({
          icon: 'error',
          title: 'Login Failed',
          text: response?.message ?? 'Invalid email or password.',
          confirmButtonColor: '#c4512d',
        });

        console.error('Login Error:', error);
      },
    });
  }

  // ============================================
  // Handle Verification / Login Error
  // ============================================

  private handleVerificationOrLoginError(response: any): void {
    const data = response?.data;

    // --------------------------------------------
    // User verification pending
    // --------------------------------------------

    if (
      data &&
      (data.isEmailVerified === false || data.isMobileVerified === false)
    ) {
      this.redirectToVerification(response);

      return;
    }

    // --------------------------------------------
    // Normal Login Failure
    // --------------------------------------------

    Swal.fire({
      icon: 'error',
      title: 'Login Failed',
      text: response?.message ?? 'Invalid email or password.',
      confirmButtonColor: '#c4512d',
    });
  }

  // ============================================
  // Redirect To Verification Page
  // ============================================

  private redirectToVerification(response: any): void {
    const data = response?.data;

    // --------------------------------------------
    // Validate Required Verification Information
    // --------------------------------------------

    if (!data?.userId || !data?.farmHouseId) {
      Swal.fire({
        icon: 'error',
        title: 'Verification Required',
        text: 'Verification information is missing. Please register again.',
        confirmButtonColor: '#c4512d',
      });

      return;
    }

    // --------------------------------------------
    // Show Verification Message
    // --------------------------------------------

    Swal.fire({
      icon: 'warning',
      title: 'Verification Required',
      text:
        response?.message ??
        'Please verify your email and mobile number to continue.',
      confirmButtonColor: '#c4512d',
      allowOutsideClick: false,
    }).then(() => {
      // ------------------------------------------
      // Navigate To Verification Page
      // ------------------------------------------

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
}
