
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';

import { BookingService } from '../../../../core/services/booking.service';
import { Booking } from '../models/booking.model';

@Component({
  selector: 'app-booking-view',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './booking-view.component.html',
  styleUrl: './booking-view.component.css'
})
export class BookingViewComponent implements OnInit {

  // Booking List
  bookingItems: Booking[] = [];
  filteredBookingItems: Booking[] = [];

  // Search
  searchText: string = '';

  // Table Columns
  displayedColumns: string[] = [
    'number',
    'bookingReference',
    'guest',
    'mobile',
    'checkIn',
    'checkOut',
    'persons',
    'status',
    'date',
    'action'
  ];

  // Loading
  loading: boolean = false;
  page = 1;
  readonly pageSize = 10;

  constructor(
    private readonly bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  // GET ALL BOOKINGS
  private loadBookings(): void {

    this.loading = true;

    this.bookingService.getAllBookings({
      page: this.page,
      pageSize: this.pageSize
    }).subscribe({

      next: (response) => {

        if (response?.success && response?.data) {

          this.bookingItems = response.data;
          this.filteredBookingItems = [...this.bookingItems];

        } else {

          this.bookingItems = [];
          this.filteredBookingItems = [];
        }

        this.loading = false;
      },

      error: (error) => {

        console.error('Failed to load bookings:', error);

        this.bookingItems = [];
        this.filteredBookingItems = [];

        this.loading = false;

        Swal.fire({
          title: 'Error',
          text: error?.error?.message ||
                'Unable to load bookings.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    });
  }

  // SEARCH BOOKINGS
  searchBookings(): void {

    const search = this.searchText.trim().toLowerCase();

    if (!search) {
      this.filteredBookingItems = [...this.bookingItems];
      return;
    }

    this.filteredBookingItems = this.bookingItems.filter(booking => {

      return (
        booking.bookingReference?.toLowerCase().includes(search) ||

        booking.fullName?.toLowerCase().includes(search) ||

        booking.email?.toLowerCase().includes(search) ||

        booking.mobileNumber?.toLowerCase().includes(search) ||

        booking.status?.toLowerCase().includes(search)
      );

    });
  }

  // CLEAR SEARCH
  clearSearch(): void {

    this.searchText = '';

    this.filteredBookingItems = [...this.bookingItems];
  }

  // REFRESH BOOKINGS
  refreshBookings(): void {

    this.searchText = '';

    this.loadBookings();
  }

  changePage(offset: number): void {
    if (this.loading || this.page + offset < 1) return;
    this.page += offset;
    this.refreshBookings();
  }

  // BOOKING STATUS CLASS
  getStatusClass(status: string | null): string {

    switch (status?.toLowerCase()) {

      case 'approved':
        return 'text-success';

      case 'pending':
        return 'text-warning';

      case 'rejected':
        return 'text-danger';

      case 'cancelled':
        return 'text-secondary';

      case 'completed':
        return 'text-primary';

      default:
        return 'text-dark';
    }
  }

}
