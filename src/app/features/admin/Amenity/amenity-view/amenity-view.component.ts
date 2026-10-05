import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

import { AmenityService } from '../../../../core/services/amenity.service';
import { AmenityResponse } from '../models/amenity.model';

@Component({
  selector: 'app-amenity-view',
  standalone: true,
  imports: [],
  templateUrl: './amenity-view.component.html',
  styleUrl: './amenity-view.component.css',
})
export class AmenityViewComponent implements OnInit, OnDestroy {
  amenityItems: AmenityResponse[] = [];
  filteredAmenityItems: AmenityResponse[] = [];

  loading: boolean = false;

  selectedItem: AmenityResponse | null = null;

  deleting: boolean = false;

  constructor(
    private readonly amenityService: AmenityService,
    private readonly router: Router,
  ) {}

  // =========================================
  // Component Initialization
  // =========================================

  ngOnInit(): void {
    this.loadAmenities();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  // =========================================
  // Load Amenities
  // =========================================

  private loadAmenities(): void {
    this.loading = true;

    this.amenityService.getAllAmenity().subscribe({
      next: (
        response: {
          success: boolean;
          message: string;
          data: AmenityResponse[];
        },
      ) => {
        if (response.success && response.data) {
          this.amenityItems = response.data;
          this.filteredAmenityItems = response.data;
        } else {
          this.amenityItems = [];
          this.filteredAmenityItems = [];
        }

        this.loading = false;
      },

      error: (error: any) => {
        console.error('Failed to load amenities:', error);

        this.amenityItems = [];
        this.filteredAmenityItems = [];

        this.loading = false;

        Swal.fire({
          title: 'Error',
          text:
            error?.error?.message ||
            'Unable to load amenities. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545',
        });
      },
    });
  }

  // =========================================
  // Popup Controls
  // =========================================

  openPopup(item: AmenityResponse): void {
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
  // Delete Amenity
  // =========================================

  confirmDelete(item: AmenityResponse): void {
    Swal.fire({
      title: 'Delete this item?',
      text: `"${item.title}" will be deleted. This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        this.deleteAmenityItem(item.imageId);
      }
    });
  }

  private deleteAmenityItem(imageId: number): void {
    this.deleting = true;

    this.amenityService.deleteAmenity(imageId).subscribe({
      next: (response: any) => {
        this.deleting = false;

        if (response?.success === false) {
          Swal.fire({
            title: 'Failed',
            text: response?.message || 'Unable to delete the amenity.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc3545',
          });

          return;
        }

        this.closePopup();

        Swal.fire({
          title: 'Deleted!',
          text: 'Amenity has been deleted successfully.',
          icon: 'success',
          confirmButtonText: 'OK',
          confirmButtonColor: '#198754',
        }).then(() => {
          this.loadAmenities();
        });
      },

      error: (error: any) => {
        this.deleting = false;

        console.error('Failed to delete amenity:', error);

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

  AmenityCreate(): void {
    this.router.navigate([
      '/admin/website-settings/amenity/amenity-create',
    ]);
  }

  // =========================================
  // Navigate to Edit Page
  // =========================================

  editItem(item: AmenityResponse): void {
    this.router.navigate([
      '/admin/website-settings/amenity/amenity-create',
      item.imageId,
    ]);
  }
}