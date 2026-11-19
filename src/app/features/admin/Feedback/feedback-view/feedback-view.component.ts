import { TranslationPipe, LocalDatePipe, LanguageService } from '../../../../core/i18n/language';
import { inject as injectLanguage } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import Swal from 'sweetalert2';

import { FeedbackService } from '../../../../core/services/feedback.service';
import { FeedbackResponse } from '../feedback.model';

@Component({
  selector: 'app-feedback-view',
  standalone: true,
  imports: [TranslationPipe, LocalDatePipe, CommonModule,
    MatTableModule
  ],
  templateUrl: './feedback-view.component.html',
  styleUrl: './feedback-view.component.css'
})
export class FeedbackViewComponent implements OnInit {
  readonly language = injectLanguage(LanguageService);

  feedbackItems: FeedbackResponse[] = [];

  displayedColumns: string[] = [
    'number',
    'guest',
    'rating',
    'review',
    'date',
    'action'
  ];

  loading: boolean = false;
  deleting: boolean = false;

  constructor(
    private readonly feedbackService: FeedbackService
  ) {}

  ngOnInit(): void {
    this.loadFeedback();
  }

  
  // GET ALL FEEDBACK
  
  private loadFeedback(): void {

    this.loading = true;

    this.feedbackService.getAllFeedback().subscribe({

      next: (response) => {

        console.log('Feedback API response:', response);

        if (response?.success && response?.data) {
          this.feedbackItems = response.data;
        } else {
          this.feedbackItems = [];
        }

        this.loading = false;
      },

      error: (error) => {

        console.error('Failed to load feedback:', error);

        this.feedbackItems = [];
        this.loading = false;

        Swal.fire({
          title: this.language.translate('Error'),
          text: this.language.translate(error?.error?.message || 'Unable to load feedback.'),
          icon: 'error',
          confirmButtonText: this.language.translate('OK')
        });
      }
    });
  }

  
  // REFRESH
  
  refreshFeedback(): void {
    this.loadFeedback();
  }

  
  // DELETE CONFIRMATION
  
  confirmDelete(feedback: FeedbackResponse): void {

    Swal.fire({

      title: this.language.translate('Delete this feedback?'),

      text: this.language.translate("Feedback from \"{p0}\" will be deleted.", {p0: (feedback.createdByName || 'Guest')}),

      icon: 'warning',

      showCancelButton: true,

      confirmButtonText: this.language.translate('Yes, delete it'),

      cancelButtonText: this.language.translate('Cancel'),

      confirmButtonColor: '#dc3545',

      cancelButtonColor: '#6c757d',

      reverseButtons: true

    }).then((result) => {

      if (result.isConfirmed) {
        this.deleteFeedback(feedback.feedbackId);
      }

    });
  }

  
  // DELETE API
  
  private deleteFeedback(feedbackId: number): void {

    this.deleting = true;

    this.feedbackService.deleteFeedback(feedbackId).subscribe({

      next: (response) => {

        this.deleting = false;

        if (response?.success === false) {

          Swal.fire({
            title: this.language.translate('Failed'),
            text: this.language.translate(response?.message || 'Unable to delete feedback.'),
            icon: 'error',
            confirmButtonText: this.language.translate('OK')
          });

          return;
        }

        Swal.fire({
          title: this.language.translate('Deleted!'),
          text: this.language.translate('Feedback has been deleted successfully.'),
          icon: 'success',
          confirmButtonText: this.language.translate('OK')
        });

        // Reload table
        this.loadFeedback();
      },

      error: (error) => {

        this.deleting = false;

        console.error('Failed to delete feedback:', error);

        Swal.fire({
          title: this.language.translate('Error'),
          text: this.language.translate(error?.error?.message ||
                'Something went wrong. Please try again.'),
          icon: 'error',
          confirmButtonText: this.language.translate('OK')
        });
      }
    });
  }

  
  // STAR ARRAY
  
  getStars(): number[] {
    return [1, 2, 3, 4, 5];
  }

  
  // CHECK STAR
  
  isStarFilled(star: number, rating: number): boolean {
    return star <= rating;
  }
}