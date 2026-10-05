import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpEventType } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';

import Swal from 'sweetalert2';

import { AmenityService } from '../../../../core/services/amenity.service';
import { PublicSiteService } from '../../../../core/services/public-site.service';
import { FileUploadService } from '../../../../core/services/file-upload.service';

@Component({
  selector: 'app-amenity-create',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './amenity-create.component.html',
  styleUrl: './amenity-create.component.css',
})
export class AmenityCreateComponent implements OnInit {
  amenityForm!: FormGroup;

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
    private readonly amenityService: AmenityService,
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

    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.isEditMode = true;
      this.imageId = +idParam;
      this.loadAmenityItem();
    }
  }

  // =========================================
  // Build Form
  // =========================================
  private buildForm(): void {
    this.amenityForm = this.fb.group(
      {
        // File Upload API returns the final URL
        imageUrl: ['', [Validators.required]],

        title: ['', [Validators.required, Validators.maxLength(100)]],

        description: ['', [Validators.required, Validators.maxLength(500)]],

        isAmenity: [false],

        isCarasoul: [false],
      },
      {
        validators: this.atLeastOneChecked,
      },
    );
  }

  // =========================================
  // At least one checkbox is required
  // =========================================
  private atLeastOneChecked(
    control: AbstractControl,
  ): ValidationErrors | null {
    const isAmenity = control.get('isAmenity')?.value;
    const isCarasoul = control.get('isCarasoul')?.value;

    if (isAmenity || isCarasoul) {
      return null;
    }

    return {
      atLeastOneRequired: true,
    };
  }

  // =========================================
  // Load Existing Amenity Item (Edit Mode)
  // =========================================
  private loadAmenityItem(): void {
    this.loadingItem = true;

    this.amenityService.getAmenityById(this.imageId).subscribe({
      next: (response: any) => {
        this.loadingItem = false;

        const item = response?.data ?? response;

        if (!item) {
          Swal.fire({
            title: 'Not Found',
            text: 'Amenity item not found.',
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc3545',
          }).then(() => {
            this.router.navigate(['/admin/website-settings/amenity']);
          });

          return;
        }

        this.amenityForm.patchValue({
          imageUrl: item.imageUrl,
          title: item.title,
          description: item.description,
          isAmenity: item.isAmenity,
          isCarasoul: item.isCarasoul,
        });

        this.imagePreviewUrl = item.imageUrl || null;
      },

      error: (error) => {
        this.loadingItem = false;

        console.error('Failed to load amenity item:', error);

        Swal.fire({
          title: 'Error',
          text: 'Unable to load amenity item details.',
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545',
        }).then(() => {
          this.router.navigate(['/admin/website-settings/amenity']);
        });
      },
    });
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
        text: 'Please select an image first.',
        icon: 'warning',
        confirmButtonText: 'OK',
      });

      return;
    }

    this.uploadingFile = true;
    this.uploadProgress = 0;

    this.fileUploadService
      .uploadFileWithProgress(this.selectedFile, 'Amenity')
      .subscribe({
        next: (event) => {
          // Track live upload percentage
          if (
            event.type === HttpEventType.UploadProgress &&
            event.total
          ) {
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
            this.amenityForm.patchValue({
              imageUrl: response.data.fileUrl,
            });

            Swal.fire({
              title: 'Uploaded!',
              text: 'Image uploaded successfully.',
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

    this.imagePreviewUrl =
      this.amenityForm.get('imageUrl')?.value || null;
  }

  // =========================================
  // Submit
  // =========================================
  onSubmit(): void {
    if (this.amenityForm.invalid) {
      this.amenityForm.markAllAsTouched();
      return;
    }

    const farmHouseId =
      this.publicSiteService.currentFarmHouseId;

    if (
      farmHouseId === null ||
      farmHouseId === undefined
    ) {
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
      ...this.amenityForm.value,
    };

    const request$ = this.isEditMode
      ? this.amenityService.updateAmenity(dto)
      : this.amenityService.saveAmenity(dto);

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
              } the amenity.`,
            icon: 'error',
            confirmButtonText: 'OK',
            confirmButtonColor: '#dc3545',
          });

          return;
        }

        Swal.fire({
          title: this.isEditMode ? 'Updated!' : 'Created!',

          text: `Amenity has been ${
            this.isEditMode ? 'updated' : 'created'
          } successfully.`,

          icon: 'success',

          confirmButtonText: 'OK',

          confirmButtonColor: '#198754',
        }).then(() => {
          this.router.navigate([
            '/admin/website-settings/amenity',
          ]);
        });
      },

      error: (error) => {
        this.submitting = false;

        console.error(
          `Failed to ${
            this.isEditMode ? 'save' : 'save'
          } amenity:`,
          error,
        );

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
  // Cancel
  // =========================================
  onCancel(): void {
    this.router.navigate([
      '/admin/website-settings/amenity',
    ]);
  }

  // =========================================
  // Template validation shortcut
  // =========================================
  get f() {
    return this.amenityForm.controls;
  }
}