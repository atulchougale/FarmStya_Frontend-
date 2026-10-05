import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import Swal from 'sweetalert2';

import {
  AboutUsFeatureRequestDto,
  AboutUsResponseDto,
  AboutUsRequestDto,
} from '../models/about-us.model';

import { AboutUsService } from '../../../../core/services/about-us.service';
import { FileUploadService } from '../../../../core/services/file-upload.service';

@Component({
  selector: 'app-about-us-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './about-us-form.component.html',
  styleUrl: './about-us-form.component.css',
})
export class AboutUsFormComponent implements OnInit {
  aboutUsForm!: FormGroup;
  featureForm!: FormGroup;

  features: AboutUsFeatureRequestDto[] = [];

  iconOptions = [
    { label: 'Leaf', value: 'bi bi-leaf' },
    { label: 'Heart', value: 'bi bi-heart' },
    { label: 'Waves', value: 'bi bi-water' },
    { label: 'Trees', value: 'bi bi-tree' },
    { label: 'Check', value: 'bi bi-check-circle' },
    { label: 'Star', value: 'bi bi-star' },
    { label: 'Home', value: 'bi bi-house' },
    { label: 'Users', value: 'bi bi-people' },
    { label: 'Shield', value: 'bi bi-shield-check' },
    { label: 'Location', value: 'bi bi-geo-alt' },
    { label: 'WiFi', value: 'bi bi-wifi' },
    { label: 'Food', value: 'bi bi-cup-hot' },
    { label: 'Parking', value: 'bi bi-p-square' },
  ];

  isEditMode = false;
  aboutUsId = 0;
  editingFeatureIndex: number | null = null;
  isSubmitting = false;

  // --------------------------------------------------
  // Hero Image Upload / Preview
  // --------------------------------------------------

  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;
  uploadingFile = false;
  uploadProgress = 0;

  constructor(
    private fb: FormBuilder,
    private aboutUsService: AboutUsService,
    private fileUploadService: FileUploadService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initializeAboutUsForm();
    this.initializeFeatureForm();

    const routeId = this.route.snapshot.paramMap.get('id');

    if (routeId) {
      this.isEditMode = true;
      this.aboutUsId = Number(routeId);

      this.loadAboutUs();
    }
  }

  // --------------------------------------------------
  // About Us Master Form
  // --------------------------------------------------

  initializeAboutUsForm(): void {
    this.aboutUsForm = this.fb.group({
      heroTitle: ['', [Validators.required, Validators.maxLength(200)]],

      heroSubtitle: ['', [Validators.required, Validators.maxLength(500)]],

      heroImageUrl: ['', [Validators.required, Validators.maxLength(1000)]],

      storyTitle: ['', [Validators.required, Validators.maxLength(200)]],

      storyDescription: [''],
    });
  }

  // --------------------------------------------------
  // Feature Form
  // --------------------------------------------------

  initializeFeatureForm(): void {
    this.featureForm = this.fb.group({
      featureId: [0],

      title: ['', [Validators.required, Validators.maxLength(200)]],

      description: ['', [Validators.required]],

      icon: ['bi bi-leaf', [Validators.required]],

      displayOrder: [1, [Validators.required, Validators.min(1)]],
    });
  }

  // --------------------------------------------------
  // Load About Us for Update
  // --------------------------------------------------

  loadAboutUs(): void {
    this.aboutUsService.getAboutUs().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const data: AboutUsResponseDto = response.data;

          this.aboutUsId = data.aboutUsId;

          this.aboutUsForm.patchValue({
            heroTitle: data.heroTitle,
            heroSubtitle: data.heroSubtitle,
            heroImageUrl: data.heroImageUrl,
            storyTitle: data.storyTitle,
            storyDescription: data.storyDescription,
          });

          // Existing Hero Image Preview
          this.imagePreviewUrl = data.heroImageUrl || null;

          this.features = data.features.map((feature) => ({
            featureId: feature.featureId,
            title: feature.title,
            description: feature.description,
            icon: feature.icon,
            displayOrder: feature.displayOrder,
          }));
        } else {
          Swal.fire({
            icon: 'error',
            title: 'About Us Not Found',
            text: 'About Us content could not be found.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#28643b',
          }).then(() => {
            this.router.navigate(['/admin/website-settings/aboutus']);
          });
        }
      },

      error: (error) => {
        console.error('Error loading About Us:', error);

        Swal.fire({
          icon: 'error',
          title: 'Unable to Load',
          text: 'About Us content could not be loaded.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28643b',
        }).then(() => {
          this.router.navigate(['/admin/website-settings/aboutus']);
        });
      },
    });
  }

  // --------------------------------------------------
  // Hero Image File Selection / Preview
  // --------------------------------------------------

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // Only image files are allowed for About Us Hero Image.
    if (!file.type.startsWith('image/')) {
      Swal.fire({
        title: 'Invalid File',
        text: 'Please select an image file only.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#28643b',
      });

      input.value = '';
      return;
    }

    this.selectedFile = file;
    this.uploadProgress = 0;

    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }

    this.imagePreviewUrl = URL.createObjectURL(file);

    // New file is selected but not uploaded yet.
    // Clear old URL so user must upload the new file.
    this.aboutUsForm.patchValue({
      heroImageUrl: '',
    });

    this.aboutUsForm.get('heroImageUrl')?.markAsTouched();
  }

  // --------------------------------------------------
  // Upload Hero Image
  // --------------------------------------------------

  uploadSelectedFile(): void {
    if (!this.selectedFile) {
      Swal.fire({
        title: 'No File Selected',
        text: 'Please select an image first.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#28643b',
      });

      return;
    }

    this.uploadingFile = true;
    this.uploadProgress = 0;

    this.fileUploadService
      .uploadFileWithProgress(this.selectedFile, 'AboutUs')
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
                text: response?.message || 'Unable to upload hero image.',
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#c74747',
              });

              return;
            }

            // Store final URL returned by File Upload API
            this.aboutUsForm.patchValue({
              heroImageUrl: response.data.fileUrl,
            });

            this.aboutUsForm.get('heroImageUrl')?.markAsTouched();

            Swal.fire({
              title: 'Uploaded!',
              text: 'Hero image uploaded successfully.',
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
              'Unable to upload hero image. Please try again.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#c74747',
          });
        },
      });
  }

  // --------------------------------------------------
  // Remove Selected File
  // --------------------------------------------------

  removeSelectedFile(): void {
    if (this.imagePreviewUrl) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }

    this.selectedFile = null;
    this.uploadProgress = 0;

    // Restore already uploaded/existing image URL.
    this.imagePreviewUrl = this.aboutUsForm.get('heroImageUrl')?.value || null;
  }

  // --------------------------------------------------
  // Feature Add / Update
  // --------------------------------------------------

  saveFeature(): void {
    if (this.featureForm.invalid) {
      this.featureForm.markAllAsTouched();

      return;
    }

    const feature: AboutUsFeatureRequestDto = {
      featureId: this.featureForm.value.featureId ?? 0,

      title: this.featureForm.value.title,

      description: this.featureForm.value.description,

      icon: this.featureForm.value.icon,

      displayOrder: Number(this.featureForm.value.displayOrder),
    };

    // Update existing feature
    if (this.editingFeatureIndex !== null) {
      this.features[this.editingFeatureIndex] = feature;

      this.features = [...this.features];

      this.editingFeatureIndex = null;
    } else {
      // Add new feature
      feature.featureId = 0;

      this.features.push(feature);
    }

    this.resetFeatureForm();
  }

  // --------------------------------------------------
  // Edit Feature
  // --------------------------------------------------

  editFeature(index: number): void {
    const feature = this.features[index];

    this.editingFeatureIndex = index;

    this.featureForm.patchValue({
      featureId: feature.featureId,
      title: feature.title,
      description: feature.description,
      icon: feature.icon,
      displayOrder: feature.displayOrder,
    });
  }

  // --------------------------------------------------
  // Delete Feature
  // --------------------------------------------------

  deleteFeature(index: number): void {
    const feature = this.features[index];

    Swal.fire({
      title: 'Delete Feature?',
      text: `Are you sure you want to remove "${feature.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true,
      confirmButtonColor: '#c74747',
      cancelButtonColor: '#6c757d',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.features.splice(index, 1);

      this.features = [...this.features];

      if (this.editingFeatureIndex === index) {
        this.resetFeatureForm();
      }

      this.recalculateDisplayOrder();
    });
  }

  // --------------------------------------------------
  // Cancel Feature Edit
  // --------------------------------------------------

  cancelFeatureEdit(): void {
    this.resetFeatureForm();
  }

  // --------------------------------------------------
  // Reset Feature Form
  // --------------------------------------------------

  resetFeatureForm(): void {
    this.editingFeatureIndex = null;

    this.featureForm.reset({
      featureId: 0,
      title: '',
      description: '',
      icon: 'bi bi-leaf',
      displayOrder: this.features.length + 1,
    });
  }

  // --------------------------------------------------
  // Recalculate Feature Display Order
  // --------------------------------------------------

  recalculateDisplayOrder(): void {
    this.features = this.features.map((feature, index) => ({
      ...feature,
      displayOrder: index + 1,
    }));
  }

  // --------------------------------------------------
  // Submit About Us
  // --------------------------------------------------

  submitAboutUs(): void {
    if (this.aboutUsForm.invalid) {
      this.aboutUsForm.markAllAsTouched();

      return;
    }

    if (this.features.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Features Added',
        text: 'Please add at least one feature before saving About Us.',
        confirmButtonText: 'OK',
        confirmButtonColor: '#28643b',
      });

      return;
    }

    const request: AboutUsRequestDto = {
      aboutUsId: this.isEditMode ? this.aboutUsId : 0,

      heroTitle: this.aboutUsForm.value.heroTitle,

      heroSubtitle: this.aboutUsForm.value.heroSubtitle,

      heroImageUrl: this.aboutUsForm.value.heroImageUrl,

      storyTitle: this.aboutUsForm.value.storyTitle,

      storyDescription: this.aboutUsForm.value.storyDescription,

      features: this.features.map((feature) => ({
        featureId: feature.featureId,
        title: feature.title,
        description: feature.description,
        icon: feature.icon,
        displayOrder: feature.displayOrder,
      })),
    };

    this.isSubmitting = true;

    const request$ = this.isEditMode
      ? this.aboutUsService.updateAboutUs(request)
      : this.aboutUsService.saveAboutUs(request);

    request$.subscribe({
      next: (response) => {
        this.isSubmitting = false;

        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: this.isEditMode
              ? 'Updated Successfully'
              : 'Created Successfully',
            text: response.message,
            confirmButtonText: 'OK',
            confirmButtonColor: '#28643b',
          }).then(() => {
            this.router.navigate(['/admin/website-settings/aboutus']);
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Save Failed',
            text: response.message || 'Unable to save About Us.',
            confirmButtonText: 'OK',
            confirmButtonColor: '#28643b',
          });
        }
      },

      error: (error) => {
        this.isSubmitting = false;

        console.error('Error saving About Us:', error);

        Swal.fire({
          icon: 'error',
          title: 'Save Failed',
          text: 'Something went wrong while saving About Us.',
          confirmButtonText: 'OK',
          confirmButtonColor: '#28643b',
        });
      },
    });
  }

  // --------------------------------------------------
  // Cancel Master Form
  // --------------------------------------------------

  cancel(): void {
    this.router.navigate(['/admin/website-settings/aboutus']);
  }

  // --------------------------------------------------
  // Validation Helper
  // --------------------------------------------------

  isInvalid(form: FormGroup, controlName: string): boolean {
    const control = form.get(controlName);

    return !!(control && control.invalid && (control.touched || control.dirty));
  }

  // --------------------------------------------------
  // Track Feature
  // --------------------------------------------------

  trackByFeatureId(index: number, feature: AboutUsFeatureRequestDto): number {
    return feature.featureId || index;
  }
}
