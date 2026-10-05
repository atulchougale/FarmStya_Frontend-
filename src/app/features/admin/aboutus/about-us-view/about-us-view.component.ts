import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import Swal from 'sweetalert2';

import { AboutUsResponseDto } from '../models/about-us.model';
import { AboutUsService } from '../../../../core/services/about-us.service';

@Component({
  selector: 'app-about-us-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about-us-view.component.html',
  styleUrl: './about-us-view.component.css',
})
export class AboutUsViewComponent implements OnInit {
  aboutUs: AboutUsResponseDto | null = null;

  isLoading = false;

  constructor(
    private aboutUsService: AboutUsService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadAboutUs();
  }

  loadAboutUs(): void {
    this.isLoading = true;

    this.aboutUsService.getAboutUs().subscribe({
      next: (response) => {
        this.isLoading = false;

        if (response.success && response.data) {
          this.aboutUs = response.data;
        } else {
          this.aboutUs = null;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.aboutUs = null;

        console.error('Error loading About Us:', error);

        // 404 means About Us has not been created yet.
        if (error.status === 404) {
          return;
        }

        Swal.fire({
          icon: 'error',
          title: 'Unable to Load',
          text: 'About Us content could not be loaded. Please try again.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28643b',
        });
      },
    });
  }

  createAboutUs(): void {
    this.router.navigate(['/admin/website-settings/aboutus/create']);
  }

  updateAboutUs(): void {
    if (!this.aboutUs) {
      return;
    }

    this.router.navigate([
      '/admin/website-settings/aboutus/edit',
      this.aboutUs.aboutUsId,
    ]);
  }

  trackByFeatureId(
    index: number,
    feature: {
      featureId: number;
    },
  ): number {
    return feature.featureId;
  }
}
