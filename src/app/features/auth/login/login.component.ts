import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import Swal from 'sweetalert2';

import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/login-request.model';
import { TokenService } from '../../../core/services/token.service';
import { ActivatedRoute, Router } from '@angular/router';

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

  get f() {
    return this.loginForm.controls;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

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

        // Save Login Details
        this.tokenService.saveLogin(
          response.data,
          this.loginForm.value.rememberMe,
        );

        // Verify Saved Data (Remove these logs in production)
        console.log('Token : ', this.tokenService.getToken());

        console.log('User : ', this.tokenService.getCurrentUser());

        Swal.fire({
          icon: 'success',

          title: 'Welcome',

          text: response.message,

          timer: 1500,

          showConfirmButton: false,
        }).then(() => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');

          this.router.navigateByUrl(returnUrl ?? '/dashboard');
        });
      },

      error: (error) => {
        this.isSubmitting = false;

        Swal.fire({
          icon: 'error',

          title: 'Login Failed',

          text: error.error?.message ?? 'Invalid email or password',
        });
      },
    });
  }
}
