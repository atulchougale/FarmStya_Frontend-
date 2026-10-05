import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { PublicSiteService } from '../../../../core/services/public-site.service';
import { AboutUsResponseDto } from '../about-us.model';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-us-public.component.html',
  styleUrl: './about-us-public.component.css',
})
export class AboutUsPublicComponent implements OnInit, OnDestroy {
  aboutUs: AboutUsResponseDto | null = null;

  loading = true;
  errorMessage = '';

  private destroy$ = new Subject<void>();

  constructor(private publicSiteService: PublicSiteService) {}

  ngOnInit(): void {
    this.loadAboutUs();
  }

  loadAboutUs(): void {
    this.loading = true;
    this.errorMessage = '';

    this.publicSiteService
      .getAboutUs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.aboutUs = {
              ...response.data,
              features: [...(response.data.features ?? [])].sort(
                (a, b) => a.displayOrder - b.displayOrder,
              ),
            };
          } else {
            this.aboutUs = null;
            this.errorMessage =
              response.message || 'About Us information is unavailable.';
          }

          this.loading = false;
        },

        error: (error) => {
          this.aboutUs = null;

          this.errorMessage =
            error.status === 404
              ? 'About Us information is not available yet.'
              : 'Unable to load About Us information. Please try again later.';

          this.loading = false;
        },
      });
  }

  trackByFeatureId(index: number, feature: { featureId: number }): number {
    return feature.featureId;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
