
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

import { BookingService } from '../../../../core/services/booking.service';
import { Booking } from '../../../admin/Booking/models/booking.model';

@Component({
  selector: 'app-my-booking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-booking.component.html',
  styleUrl: './my-booking.component.css'
})
export class MyBookingComponent implements OnInit {

  bookings: Booking[] = [];

  loading = false;
  errorMessage = '';

  page = 1;
  pageSize = 10;

  constructor(
    private readonly bookingService: BookingService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadMyBookings();
  }


  get selectedReference(): string | null {
    return this.route.snapshot.queryParamMap.get('reference');
  }

  // Load Customer Bookings
  loadMyBookings(): void {

    this.loading = true;
    this.errorMessage = '';

    this.bookingService
      .getMyBookings(this.page, this.pageSize)
      .subscribe({

        next: (response) => {

          if (response.success) {
            this.bookings = response.data || [];
          } else {
            this.bookings = [];
            this.errorMessage =
              response.message || 'Unable to load bookings.';
          }

          this.loading = false;
        },

        error: (error: HttpErrorResponse) => {

          this.bookings = [];

          this.errorMessage =
            error.error?.message ||
            'Something went wrong while loading your bookings.';

          this.loading = false;
        }
      });
  }

  // Refresh Bookings
  refreshBookings(): void {
    this.loadMyBookings();
  }

  changePage(offset: number): void {
    if (this.loading || this.page + offset < 1) return;
    this.page += offset;
    this.refreshBookings();
  }

  viewBookingDetails(bookingId: number): void {
    void this.router.navigate(['/my-bookings', bookingId]);
  }

  // Status CSS Class
  getStatusClass(status: string | null | undefined): string {

    switch (status?.toLowerCase()) {

      case 'pending':
        return 'status-pending';

      case 'approved':
        return 'status-approved';

      case 'confirmed':
        return 'status-confirmed';

      case 'rejected':
        return 'status-rejected';

      case 'cancelled':
        return 'status-cancelled';

      case 'completed':
        return 'status-completed';

      default:
        return 'status-default';
    }
  }
}
