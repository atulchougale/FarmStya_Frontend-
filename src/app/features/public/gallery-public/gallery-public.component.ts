import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

import { PublicSiteService } from '../../../core/services/public-site.service';
import { GalleryResponseDto } from './gallery.model';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery-public.component.html',
  styleUrl: './gallery-public.component.css',
})
export class GalleryPublicComponent implements OnInit, OnDestroy {
  galleryItems: GalleryResponseDto[] = [];

  loading = true;
  errorMessage = '';

  selectedGalleryItem: GalleryResponseDto | null = null;

  modalMuted = true;

  private destroy$ = new Subject<void>();

  constructor(private publicSiteService: PublicSiteService) {}

  ngOnInit(): void {
    this.loadGallery();
  }

  // Load gallery images and videos from the existing public API
  loadGallery(): void {
    this.loading = true;
    this.errorMessage = '';

    this.publicSiteService
      .getGallery()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.galleryItems = response.data;
          } else {
            this.galleryItems = [];
          }

          this.loading = false;

          // console.log('Gallery API Response:', response);
          // console.log('Gallery Items:', this.galleryItems);
        },
        error: (error) => {
          console.error('Error loading gallery:', error);

          this.galleryItems = [];
          this.errorMessage =
            'Unable to load gallery images. Please try again later.';
          this.loading = false;
        },
      });
  }

  // Detect supported video file extensions
  isVideo(url: string): boolean {
    if (!url) {
      return false;
    }

    return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);
  }

  // Open image/video in the popup modal
  openGalleryModal(item: GalleryResponseDto): void {
    this.selectedGalleryItem = item;
    this.modalMuted = true;

    document.body.style.overflow = 'hidden';
  }

  // Close the popup modal
  closeGalleryModal(): void {
    this.selectedGalleryItem = null;
    document.body.style.overflow = '';
  }

  // Toggle mute/unmute for the popup video
  toggleModalMute(video: HTMLVideoElement): void {
    video.muted = !video.muted;
    this.modalMuted = video.muted;
  }

  // Close popup using Escape key
  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.selectedGalleryItem) {
      this.closeGalleryModal();
    }
  }

  // Track gallery cards efficiently
  trackByImageId(index: number, item: GalleryResponseDto): number {
    return item.imageId;
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';

    this.destroy$.next();
    this.destroy$.complete();
  }
}
