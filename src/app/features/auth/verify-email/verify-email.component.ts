import { Component, OnInit, inject } from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css',
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);

  private authService = inject(AuthService);

  isLoading = true;

  isVerified = false;
  

  message = '';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.isLoading = false;

      this.isVerified = false;

      this.message = 'Verification token not found';

      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: (response: any) => {
        this.isLoading = false;

        this.isVerified = true;

        this.message = response.message ?? 'Email verified successfully';
      },

      error: (error) => {
        this.isLoading = false;

        this.isVerified = false;

        this.message = error.error?.message ?? 'Email verification failed';
      },
    });
  }
}
