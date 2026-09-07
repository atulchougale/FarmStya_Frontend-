import { Component, inject, OnInit } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { Profile } from '../models/profile.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [],
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
