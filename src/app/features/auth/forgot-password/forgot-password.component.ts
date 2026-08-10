import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthService } from '../../../core/services/auth.service';
import { ForgotPasswordRequest } from '../../../core/models/forgot-password-request.model';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css',
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  isSubmitting = false;

  forgotPasswordForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get f() {
    return this.forgotPasswordForm.controls;
  }

  onSubmit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();

      return;
    }

    this.isSubmitting = true;

    const request: ForgotPasswordRequest = {
      email: this.forgotPasswordForm.value.email,
    };

    this.authService.forgotPassword(request).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;

        Swal.fire({
          icon: 'success',

          title: 'Email Sent',

          text: response.message,
        });

        this.forgotPasswordForm.reset();
      },

      error: (error) => {
        this.isSubmitting = false;

        Swal.fire({
          icon: 'error',

          title: 'Error',

          text: error.error?.message ?? 'Something went wrong',
        });
      },
    });
  }
}
