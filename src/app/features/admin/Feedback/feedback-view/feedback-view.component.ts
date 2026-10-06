import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import Swal from 'sweetalert2';

import { FeedbackService } from '../../../../core/services/feedback.service';
import { FeedbackResponse } from '../feedback.model';

@Component({
  selector: 'app-feedback-view',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule
  ],
  templateUrl: './feedback-view.component.html',
  styleUrl: './feedback-view.component.css'
})
export class FeedbackViewComponent implements OnInit {

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
          title: 'Error',
          text: error?.error?.message || 'Unable to load feedback.',
          icon: 'error',
          confirmButtonText: 'OK'
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

      title: 'Delete this feedback?',

      text: `Feedback from "${feedback.createdByName || 'Guest'}" will be deleted.`,

      icon: 'warning',

      showCancelButton: true,

      confirmButtonText: 'Yes, delete it',

      cancelButtonText: 'Cancel',

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
            title: 'Failed',
            text: response?.message || 'Unable to delete feedback.',
            icon: 'error',
            confirmButtonText: 'OK'
          });

          return;
        }

        Swal.fire({
          title: 'Deleted!',
          text: 'Feedback has been deleted successfully.',
          icon: 'success',
          confirmButtonText: 'OK'
        });

        // Reload table
        this.loadFeedback();
      },

      error: (error) => {

        this.deleting = false;

        console.error('Failed to delete feedback:', error);

        Swal.fire({
          title: 'Error',
          text: error?.error?.message ||
                'Something went wrong. Please try again.',
          icon: 'error',
          confirmButtonText: 'OK'
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