import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import Swal from 'sweetalert2';

import { GalleryService } from '../../../../core/services/gallery.service';
import { PublicSiteService } from '../../../../core/services/public-site.service';
import { FileUploadService } from '../../../../core/services/file-upload.service';

import { GalleryCategory } from '../models/gallery.model';

@Component({
  selector: 'app-gallery-create',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './gallery-create.component.html',
  styleUrl: './gallery-create.component.css',
})
export class GalleryCreateComponent implements OnInit {
  galleryForm!: FormGroup;

  categories: GalleryCategory[] = [];

  // =========================================
  // Category: dropdown <-> new-category input toggle
  // =========================================
  isNewCategory: boolean = false;

  // =========================================
  // Edit mode state
  // =========================================
  isEditMode: boolean = false;
  imageId: number = 0;
  loadingItem: boolean = false;
  submitting: boolean = false;

  // =========================================
  // File upload / preview state
  // =========================================
  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;
  uploadingFile: boolean = false;
  uploadProgress: number = 0;

  constructor(
    private readonly fb: FormBuilder,
    private readonly galleryService: GalleryService,
    private readonly publicSiteService: PublicSiteService,
    private readonly fileUploadService: FileUploadService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  // =========================================
  // Component Initialization
  // =========================================
  ngOnInit(): void {
    this.buildForm();
    this.loadCategories();

    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.isEditMode = true;
      this.imageId = +idParam;
      this.loadGalleryItem();
    }
  }

  // =========================================
  // Build Form
  // =========================================
  private buildForm(): void {
    this.galleryForm = this.fb.group({
      imageName: ['', [Validators.required, Validators.maxLength(150)]],

      // File Upload API returns the final URL
      imageUrl: ['', [Validators.required]],

      category: ['', [Validators.required]],

      description: ['', [Validators.required]],

      displayOrder: [0, [Validators.required, Validators.min(0)]],

      isFavorite: [false],
    });
  }

  // =========================================
  // Load Categories
  // =========================================
  private loadCategories(): void {
    this.galleryService.getGalleryCategories().subscribe({
      next: (response) => {
        this.categories = response;
        this.syncCategoryMode();
      },

      error: (error) => {
        console.error('Failed to load gallery categories:', error);
        this.categories = [];
      },
    });
  }

  // =========================================
  // Load Existing Gallery Item (Edit Mode)
  // =========================================
  private loadGalleryItem(): void {
    this.loadingItem = true;

    this.galleryService.getGalleryById(this.imageId).subscribe({
      next: (response: any) => {
        this.loadingItem = false;

        const item = response?.data ?? response;

        if (!item) {
          Swal.fire({
            title: 'Not Found',
            text: 'Gallery item not found.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc3545',
          }).then(() => {
            this.router.navigate(['/admin/website-settings/gallery']);
          });

          return;
        }

        this.galleryForm.patchValue({
          imageName: item.imageName,
          imageUrl: item.imageUrl,
          category: item.category,
          description: item.description,
          displayOrder: item.displayOrder,
          isFavorite: item.isFavorite,
        });

        this.imagePreviewUrl = item.imageUrl || null;

        this.syncCategoryMode();
      },

      error: (error) => {
        this.loadingItem = false;

        console.error('Failed to load gallery item:', error);

        Swal.fire({
          title: 'Error',
          text: 'Unable to load gallery item details.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545',
        }).then(() => {
          this.router.navigate(['/admin/website-settings/gallery']);
        });
      },
    });
  }

  // =========================================
  // Sync Category Mode
  // =========================================
  private syncCategoryMode(): void {
    const currentCategory = this.galleryForm.get('category')?.value;

    if (!currentCategory) {
      return;
    }

    const existsInList = this.categories.some(
      (cat) => cat.value.toLowerCase() === currentCategory.toLowerCase(),
    );

    this.isNewCategory = !existsInList;
  }

  // =========================================
  // Toggle: Existing Category <-> New Category
  // =========================================
  toggleNewCategory(): void {
    this.isNewCategory = !this.isNewCategory;

    this.galleryForm.get('category')?.setValue('');
  }

  // =========================================
  // File Selection / Preview
  // =========================================
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    this.selectedFile = file;
    this.uploadProgress = 0;

    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }

    this.imagePreviewUrl = URL.createObjectURL(file);
  }

  // =========================================
  // Upload Selected File (with progress)
  // =========================================
  uploadSelectedFile(): void {
    if (!this.selectedFile) {
      Swal.fire({
        title: 'No File Selected',
        text: 'Please select an image or video first.',
        icon: 'warning',
        confirmButtonText: 'OK',
      });

      return;
    }

    this.uploadingFile = true;
    this.uploadProgress = 0;

    this.fileUploadService
      .uploadFileWithProgress(this.selectedFile, 'Gallery')
      .subscribe({
        next: (event) => {
          // Track live upload percentage
          if (event.type === HttpEventType.UploadProgress && event.total) {
            this.uploadProgress = Math.round(
              (event.loaded / event.total) * 100,
            );
          }

          // Final server response
          if (event.type === HttpEventType.Response) {
            this.uploadingFile = false;

            const response = event.body;

            if (!response?.success || !response.data) {
              this.uploadProgress = 0;

              Swal.fire({
                title: 'Upload Failed',
                text: response?.message || 'Unable to upload file.',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#dc3545',
              });

              return;
            }

            // Store final URL returned by File Upload API
            this.galleryForm.patchValue({
              imageUrl: response.data.fileUrl,
            });

            Swal.fire({
              title: 'Uploaded!',
              text: 'File uploaded successfully.',
              icon: 'success',
              confirmButtonText: 'OK',
              confirmButtonColor: '#198754',
            });
          }
        },

        error: (error) => {
          this.uploadingFile = false;
          this.uploadProgress = 0;

          console.error('File upload failed:', error);

          Swal.fire({
            title: 'Upload Failed',
            text:
              error?.error?.message ||
              'Unable to upload file. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc3545',
          });
        },
      });
  }

  // =========================================
  // Remove Selected File
  // =========================================
  removeSelectedFile(): void {
    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }

    this.selectedFile = null;
    this.uploadProgress = 0;

    this.imagePreviewUrl = this.galleryForm.get('imageUrl')?.value || null;
  }

  // =========================================
  // Determine if current preview is a video
  // (works for both: newly selected file AND
  // existing imageUrl loaded in edit mode)
  // =========================================
  isPreviewVideo(): boolean {
  
    if (this.selectedFile) {
      return this.selectedFile.type.startsWith('video/');
    }

    const url = this.imagePreviewUrl;

    if (!url) {
      return false;
    }

    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];

    const lowerUrl = url.toLowerCase().split('?')[0];

    return videoExtensions.some((ext) => lowerUrl.endsWith(ext));
  }

  // =========================================
  // Submit
  // =========================================
  onSubmit(): void {
    if (this.galleryForm.invalid) {
      this.galleryForm.markAllAsTouched();
      return;
    }

    const farmHouseId = this.publicSiteService.currentFarmHouseId;

    if (farmHouseId === null || farmHouseId === undefined) {
      Swal.fire({
        title: 'Error',
        text: 'Farm house information is missing. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        confirmButtonColor: '#dc3545',
      });

      return;
    }

    this.submitting = true;

    const dto = {
      imageId: this.isEditMode ? this.imageId : 0,
      farmHouseId: farmHouseId,
      ...this.galleryForm.value,
    };

    const request$ = this.isEditMode
      ? this.galleryService.updateGallery(dto)
      : this.galleryService.saveGallery(dto);

    request$.subscribe({
      next: (response) => {
        this.submitting = false;

        if (response?.success === false) {
          Swal.fire({
            title: 'Failed',
            text:
              response?.message ||
              `Unable to ${
                this.isEditMode ? 'update' : 'save'
              } the gallery item.`,
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc3545',
          });

          return;
        }

        Swal.fire({
          title: this.isEditMode ? 'Updated!' : 'Created!',

          text: `Gallery item has been ${
            this.isEditMode ? 'updated' : 'created'
          } successfully.`,

          icon: 'success',

          confirmButtonText: 'OK',

          confirmButtonColor: '#198754',
        }).then(() => {
          this.router.navigate(['/admin/website-settings/gallery']);
        });
      },

      error: (error) => {
        this.submitting = false;

        console.error(
          `Failed to ${this.isEditMode ? 'update' : 'save'} gallery item:`,
          error,
        );

        Swal.fire({
          title: 'Error',
          text:
            error?.error?.message || 'Something went wrong. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545',
        });
      },
    });
  }

  // =========================================
  // Cancel
  // =========================================
  onCancel(): void {
    this.router.navigate(['/admin/website-settings/gallery']);
  }

  // =========================================
  // Template validation shortcut
  // =========================================
  get f() {
    return this.galleryForm.controls;
  }
}