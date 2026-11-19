import { TranslationPipe, LanguageService } from '../../../core/i18n/language';
import { inject as injectLanguage } from '@angular/core';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import Swal from 'sweetalert2';

import { FeedbackService } from '../../../core/services/feedback.service';
import { PublicSiteService } from '../../../core/services/public-site.service';
import { FeedbackRequest } from '../../admin/Feedback/feedback.model';

@Component({
  selector: 'app-public-feedback',
  standalone: true,
  imports: [TranslationPipe, CommonModule, ReactiveFormsModule],
  templateUrl: './public-feedback.component.html',
  styleUrl: './public-feedback.component.css',
})
export class PublicFeedbackComponent {
  readonly language = injectLanguage(LanguageService);
  feedbackForm: FormGroup;
  submitting: boolean = false;
  farmHouseName: string = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly feedbackService: FeedbackService,
    private readonly publicSiteService: PublicSiteService,
    private readonly route: ActivatedRoute,
  ) {
    this.farmHouseName = this.publicSiteService.currentFarmHouseName || '';

    this.feedbackForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      review: ['', [Validators.required, Validators.maxLength(500)]],
    });
  }

  get f() {
    return this.feedbackForm.controls;
  }

  // Rating stars
  getStars(): number[] {
    return [1, 2, 3, 4, 5];
  }

  // Select rating
  setRating(rating: number): void {
    this.feedbackForm.patchValue({
      rating: rating,
    });

    this.feedbackForm.get('rating')?.markAsTouched();
  }

  // Check selected rating
  isStarFilled(star: number): boolean {
    const rating = this.feedbackForm.get('rating')?.value || 0;

    return star <= rating;
  }

  // Submit feedback
  onSubmit(): void {
    this.feedbackForm.get('review')?.setValue(String(this.feedbackForm.get('review')?.value ?? '').trim());
    const bookingParam = this.route.snapshot.queryParamMap.get('bookingId');
    const bookingId = bookingParam === null ? undefined : Number(bookingParam);
    if (bookingId !== undefined && (!Number.isSafeInteger(bookingId) || bookingId < 1)) {
      void Swal.fire({ icon: 'error', text: this.language.translate('Invalid booking reference.') });
      return;
    }
    if (this.feedbackForm.invalid) {
      this.feedbackForm.markAllAsTouched();
      return;
    }

    const farmHouseId = this.publicSiteService.currentFarmHouseId;

    if (farmHouseId === null || farmHouseId === undefined) {
      Swal.fire({
        title: this.language.translate('Error'),
        text: this.language.translate('Farm house information is missing. Please try again.'),
        icon: 'error',
        confirmButtonText: this.language.translate('OK'),
        confirmButtonColor: '#dc3545',
      });

      return;
    }

    const dto: FeedbackRequest = {
      feedBackId: 0,
      farmHouseId: farmHouseId,
      review: this.feedbackForm.get('review')?.value,
      bookingId,
      rating: this.feedbackForm.get('rating')?.value,
    };

    this.submitting = true;

    this.feedbackService.saveFeedback(dto).subscribe({
      next: (response) => {
        this.submitting = false;

        if (response?.success === false) {
          Swal.fire({
            title: this.language.translate('Failed'),
            text: this.language.translate(response?.message || 'Unable to submit feedback.'),
            icon: 'error',
            confirmButtonText: this.language.translate('OK'),
          });

          return;
        }

        Swal.fire({
          title: this.language.translate('Thank You!'),
          text: this.language.translate('Your feedback has been submitted successfully.'),
          icon: 'success',
          confirmButtonText: this.language.translate('OK'),
        });

        this.feedbackForm.reset({
          rating: 0,
          review: '',
        });
      },

      error: (error) => {
        this.submitting = false;

        console.error('Failed to submit feedback:', error);

        Swal.fire({
          title: this.language.translate('Error'),
          text:
            this.language.translate(error?.error?.message ||
            'Something went wrong while submitting your feedback. Please try again.'),
          icon: 'error',
          confirmButtonText: this.language.translate('OK'),
        });
      },
    });
  }
}
