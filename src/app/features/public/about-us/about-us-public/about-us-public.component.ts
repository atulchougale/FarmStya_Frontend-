import { TranslationPipe } from '../../../../core/i18n/language';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

import { PublicSiteService } from '../../../../core/services/public-site.service';
import { AboutUsResponseDto } from '../about-us.model';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [TranslationPipe, CommonModule, RouterLink],
  templateUrl: './about-us-public.component.html',
  styleUrl: './about-us-public.component.css',
})
export class AboutUsPublicComponent implements OnInit, OnDestroy {
  readonly imageRoot = '/assets/images/about/';
  readonly designFeatures = [
    {
      featureId: -1,
      title: 'Thoughtful hospitality',
      description:
        'A warm, caring and unhurried experience, with attention to the little things that make your stay comfortable.',
      icon: 'bi bi-cup-hot',
    },
    {
      featureId: -2,
      title: 'Closer to nature',
      description:
        'Open spaces, greenery and a peaceful environment that helps you breathe, relax and feel refreshed.',
      icon: 'bi bi-leaf',
    },
    {
      featureId: -3,
      title: 'Time together',
      description:
        'The right setting to slow down, share good conversations, enjoy homestyle meals and make meaningful memories with your loved ones.',
      icon: 'bi bi-people',
    },
  ];
  readonly details = [
    {
      file: 'comfortable-room',
      title: 'Comfortable spaces for a restful stay',
    },
    { file: 'poolside', title: 'A refreshing poolside pause' },
    { file: 'garden', title: 'Quiet corners in the garden' },
    { file: 'homestyle-meal', title: 'A homestyle meal shared together' },
  ];
  get hospitalityFeatures() {
    return this.designFeatures;
  }
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
