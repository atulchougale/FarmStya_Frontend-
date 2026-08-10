import { Component, inject } from '@angular/core';
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
import { ResetPasswordRequest } from '../../../core/models/reset-password-request.model';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.css',
})

export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  token = '';

  isSubmitting = false;

  showPassword = false;

  showConfirmPassword = false;

  resetPasswordForm: FormGroup = this.fb.group(
    {
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

  get f() {
    return this.resetPasswordForm.controls;
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

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!this.token) {
      Swal.fire({
        icon: 'error',

        title: 'Invalid Link',

        text: 'Password reset token is missing.',
      });
    }
  }

  onSubmit(): void {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();

      return;
    }

    this.isSubmitting = true;

    const request: ResetPasswordRequest = {
      token: this.token,

      newPassword: this.resetPasswordForm.value.password,

      confirmPassword: this.resetPasswordForm.value.confirmPassword,
    };

    this.authService.resetPassword(request).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;

        Swal.fire({
          icon: 'success',

          title: 'Password Reset Successful',

          text: response.message,
        }).then(() => {
          this.router.navigate(['/login']);
        });
      },

      error: (error) => {
        this.isSubmitting = false;

        Swal.fire({
          icon: 'error',

          title: 'Reset Failed',

          text: error.error?.message ?? 'Something went wrong',
        });
      },
    });
  }
}
