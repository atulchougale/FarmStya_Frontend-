import { FormsModule } from '@angular/forms';
import { TranslationPipe } from '../../../core/i18n/language';
import { Component, inject, OnInit } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { Profile } from '../models/profile.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [TranslationPipe, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  // ============================================
  // Component State
  // ============================================

  profile: Profile | null = null;

  isLoading = false;
  emailDraft = '';
  savingEmail = false;
  emailMessage = '';
  emailError = '';

  saveEmail(): void {
    if (this.savingEmail) return;
    this.savingEmail = true;
    this.emailMessage = '';
    this.emailError = '';
    this.authService.updateEmail(this.emailDraft.trim() || null).subscribe({
      next: response => {
        this.savingEmail = false;
        this.emailMessage = response.message;
        this.getProfile();
      },
      error: error => { this.savingEmail = false; this.emailError = error.error?.message ?? 'Could not update email.'; }
    });
  }

  refreshProfile(): void { this.getProfile(); }

  // ============================================
  // Initial Load
  // ============================================

  ngOnInit(): void {
    this.getProfile();
  }

  goToChangePassword(): void {
    this.router.navigate(['/change-password']);
  }
  // ============================================
  // Get Profile
  // ============================================

  private getProfile(): void {
    this.isLoading = true;

    this.authService.getProfile().subscribe({
      // ==========================================
      // API Success
      // ==========================================

      next: (response) => {
        this.isLoading = false;

        if (!response?.success) {
          console.error('Get Profile Failed:', response?.message);
          return;
        }

        this.profile = response.data;
        this.emailDraft = response.data.email ?? "";
      },

      // ==========================================
      // HTTP Error
      // ==========================================

      error: (error: any) => {
        this.isLoading = false;

        console.error('Get Profile Error:', error);
      },
    });
  }
}
