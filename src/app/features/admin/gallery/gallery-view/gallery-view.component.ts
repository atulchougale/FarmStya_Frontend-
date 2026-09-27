import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { GalleryService } from '../../../../core/services/gallery.service';

import { GalleryResponse, GalleryCategory } from '../models/gallery.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-gallery-view',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './gallery-view.component.html',
  styleUrl: './gallery-view.component.css',
})
export class GalleryViewComponent implements OnInit, OnDestroy {
  galleryItems: GalleryResponse[] = [];
  filteredGalleryItems: GalleryResponse[] = [];

  selectedCategory: string = '';

  categories: GalleryCategory[] = [];

  loading: boolean = false;

  selectedItem: GalleryResponse | null = null;

  deleting: boolean = false;

  constructor(
    private readonly galleryService: GalleryService,
    private readonly router: Router,
  ) {}

  // =========================================
  // Component Initialization
  // =========================================

  ngOnInit(): void {
    this.loadCategories();

    this.loadGallery();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  // =========================================
  // Load Gallery
  // =========================================

  private loadGallery(): void {
    this.loading = true;

    this.galleryService.getAllGallery().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.galleryItems = response.data;

          this.filteredGalleryItems = response.data;
        } else {
          this.galleryItems = [];
          this.filteredGalleryItems = [];
        }

        this.loading = false;
      },

      error: (error) => {
        console.error('Failed to load gallery:', error);

        this.galleryItems = [];
        this.filteredGalleryItems = [];

        this.loading = false;
      },
    });
  }

  // =========================================
  // Load Categories
  // =========================================

  private loadCategories(): void {
    this.galleryService.getGalleryCategories().subscribe({
      next: (response) => {
        this.categories = response;
      },

      error: (error) => {
        console.error('Failed to load gallery categories:', error);

        this.categories = [];
      },
    });
  }

  // =========================================
  // Category Filter
  // =========================================

  onCategoryChange(): void {
    // All Categories
    if (!this.selectedCategory) {
      this.filteredGalleryItems = this.galleryItems;

      return;
    }

    // Selected Category
    this.filteredGalleryItems = this.galleryItems.filter(
      (item) =>
        item.category.toLowerCase() === this.selectedCategory.toLowerCase(),
    );
  }

  // =========================================
  // Detect file type from URL extension
  // =========================================

  isVideo(url: string): boolean {
    if (!url) {
      return false;
    }

    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];

    const lowerUrl = url.toLowerCase().split('?')[0];

    return videoExtensions.some((ext) => lowerUrl.endsWith(ext));
  }

  // =========================================
  // Popup Controls
  // =========================================

  openPopup(item: GalleryResponse): void {
    this.selectedItem = item;

    document.body.style.overflow = 'hidden';
  }

  closePopup(): void {
    this.selectedItem = null;

    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.selectedItem) {
      this.closePopup();
    }
  }

  // =========================================
  // Delete Gallery Item
  // =========================================

  confirmDelete(item: GalleryResponse): void {
    Swal.fire({
      title: 'Delete this item?',
      text: `"${item.imageName}" will be permanently deleted. This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteGalleryItem(item.imageId);
      }
    });
  }

  private deleteGalleryItem(imageId: number): void {
    this.deleting = true;

    this.galleryService.deleteGallery(imageId).subscribe({
      next: (response) => {
        this.deleting = false;

        if (response?.success === false) {
          Swal.fire({
            title: 'Failed',
            text: response?.message || 'Unable to delete the gallery item.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc3545',
          });

          return;
        }

        // Close popup if open
        this.closePopup();

        Swal.fire({
          title: 'Deleted!',
          text: 'Gallery item has been deleted successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#198754',
        });

        // ================================
        // Reload data after successful delete
        // ================================

        this.loadCategories();

        this.loadGallery();
      },

      error: (error) => {
        this.deleting = false;

        console.error('Failed to delete gallery item:', error);

        Swal.fire({
          title: 'Error',
          text:
            error?.error?.message ||
            'Something went wrong. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545',
        });
      },
    });
  }

  // =========================================
  // Navigate to Create Page
  // =========================================

  GalleryCreate(): void {
    this.router.navigate(['/admin/website-settings/gallery/gallery-create']);
  }

  // =========================================
  // Navigate to Edit Page
  // =========================================

  editItem(item: GalleryResponse): void {
    this.router.navigate(['/admin/website-settings/gallery/gallery-create', item.imageId]);
  }
}