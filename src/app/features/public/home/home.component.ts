import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { PublicSiteService } from '../../../core/services/public-site.service';

import {
  AmenityResponseDto,
  CarouselResponseDto,
  FeedbackResponseDto,
} from '../home/models/home.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  amenities: AmenityResponseDto[] = [];
  carouselImages: CarouselResponseDto[] = [];
  feedbacks: FeedbackResponseDto[] = [];
  isLoading = true;
  errorMessage = '';

  amenitiesLoading = true;
  feedbackLoading = true;

  paginatedFeedbacks: FeedbackResponseDto[] = [];
  currentFeedbackSlide = 0;
  feedbackSlideCount = 0;

  private readonly feedbacksPerSlide = 6;
  private readonly feedbackSlideInterval = 30000;
  private feedbackAutoSlideTimer: ReturnType<typeof setInterval> | null = null;

  private destroy$ = new Subject<void>();

  constructor(private publicSiteService: PublicSiteService) {}

  ngOnInit(): void {
    this.loadHomePageData();
  }

  /**
   * Load Home Page Data
   */
  loadHomePageData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.loadCarousel();
    this.loadAmenities();
    this.loadFeedback();
  }

  /**
   * Load Carousel Images
   */
  loadCarousel(): void {
    this.publicSiteService
      .getCarousel()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          //console.log('Carousel API Response:', response);

          if (response.success && response.data) {
            this.carouselImages = response.data;
          } else {
            this.carouselImages = [];
          }

          // console.log('Carousel Images:', this.carouselImages);
          // console.log('Carousel Count:', this.carouselImages.length);
        },
        error: (error) => {
          console.error('Error loading carousel:', error);
          this.carouselImages = [];
        },
      });
  }

  /**
   * Load Amenities
   */

  loadAmenities(): void {
    this.amenitiesLoading = true;

    this.publicSiteService
      .getAmenities()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.amenities = response.data;
          } else {
            this.amenities = [];
          }

          this.amenitiesLoading = false;

          // console.log('Amenities API Response:', response);
          // console.log('Amenities:', this.amenities);
        },
        error: (error) => {
          console.error('Error loading amenities:', error);

          this.amenities = [];
          this.amenitiesLoading = false;
        },
      });
  }

  getAmenityIcon(title: string): string {
    const name = (title || '').toLowerCase();

    if (name.includes('pool') || name.includes('swim')) {
      return 'bi-water';
    }

    if (name.includes('kitchen') || name.includes('cook')) {
      return 'bi-cup-hot';
    }

    if (name.includes('garden') || name.includes('lawn')) {
      return 'bi-tree';
    }

    if (
      name.includes('room') ||
      name.includes('bed') ||
      name.includes('stay')
    ) {
      return 'bi-house';
    }

    return 'bi-stars';
  }

  /**
   * Load Top Feedback
   */

  loadFeedback(): void {
    this.feedbackLoading = true;

    this.publicSiteService
      .getFeedback()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.feedbacks = response.data;
          } else {
            this.feedbacks = [];
          }

          this.feedbackLoading = false;

          this.setupFeedbackPagination();

          // console.log('Feedback API Response:', response);
          // console.log('Feedbacks:', this.feedbacks);
        },
        error: (error) => {
          console.error('Error loading feedback:', error);

          this.feedbacks = [];
          this.feedbackLoading = false;

          this.resetFeedbackPagination();
        },
      });
  }

  /**
   * Setup Feedback Pagination
   */
  private setupFeedbackPagination(): void {
    this.currentFeedbackSlide = 0;

    this.feedbackSlideCount = Math.ceil(
      this.feedbacks.length / this.feedbacksPerSlide
    );

    this.updatePaginatedFeedbacks();
    this.startFeedbackAutoSlide();
  }

  /**
   * Update Feedbacks For Current Slide
   */
  private updatePaginatedFeedbacks(): void {
    const startIndex = this.currentFeedbackSlide * this.feedbacksPerSlide;
    const endIndex = startIndex + this.feedbacksPerSlide;

    this.paginatedFeedbacks = this.feedbacks.slice(startIndex, endIndex);
  }

  /**
   * Go To Selected Feedback Slide
   */
  goToFeedbackSlide(slideIndex: number): void {
    if (
      slideIndex < 0 ||
      slideIndex >= this.feedbackSlideCount ||
      slideIndex === this.currentFeedbackSlide
    ) {
      return;
    }

    this.currentFeedbackSlide = slideIndex;
    this.updatePaginatedFeedbacks();
    this.restartFeedbackAutoSlide();
  }

  /**
   * Go To Next Feedback Slide
   */
  private goToNextFeedbackSlide(): void {
    if (this.feedbackSlideCount <= 1) {
      return;
    }

    this.currentFeedbackSlide =
      (this.currentFeedbackSlide + 1) % this.feedbackSlideCount;

    this.updatePaginatedFeedbacks();
  }

  /**
   * Start Feedback Auto Slide
   */
  private startFeedbackAutoSlide(): void {
    this.stopFeedbackAutoSlide();

    if (this.feedbackSlideCount <= 1) {
      return;
    }

    this.feedbackAutoSlideTimer = setInterval(() => {
      this.goToNextFeedbackSlide();
    }, this.feedbackSlideInterval);
  }

  /**
   * Restart Feedback Auto Slide
   */
  private restartFeedbackAutoSlide(): void {
    this.startFeedbackAutoSlide();
  }

  /**
   * Stop Feedback Auto Slide
   */
  private stopFeedbackAutoSlide(): void {
    if (this.feedbackAutoSlideTimer !== null) {
      clearInterval(this.feedbackAutoSlideTimer);
      this.feedbackAutoSlideTimer = null;
    }
  }

  /**
   * Reset Feedback Pagination
   */
  private resetFeedbackPagination(): void {
    this.stopFeedbackAutoSlide();
    this.paginatedFeedbacks = [];
    this.currentFeedbackSlide = 0;
    this.feedbackSlideCount = 0;
  }

  /**
   * Cleanup Subscriptions
   */
  ngOnDestroy(): void {
    this.stopFeedbackAutoSlide();
    this.destroy$.next();
    this.destroy$.complete();
  }
}