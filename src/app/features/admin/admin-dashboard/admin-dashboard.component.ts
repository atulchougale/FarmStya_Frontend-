import { TranslationPipe, LocalDatePipe } from '../../../core/i18n/language';

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { BookingService } from '../../../core/services/booking.service';
import { Booking } from '../Booking/models/booking.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [TranslationPipe, LocalDatePipe, CommonModule,
    RouterLink
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {

  today: Date = new Date();

  latestBookings: Booking[] = [];

  loadingBookings = false;
  bookingLoadError = '';

  calendarDate: Date = new Date();

  selectedDate: Date = new Date();

  weekDays: string[] = [
    'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'
  ];

  calendarDays: {
    date: Date;
    currentMonth: boolean;
    isToday: boolean;
  }[] = [];

  constructor(
    private readonly bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.loadLatestBookings();
    this.generateCalendar();
  }

  loadLatestBookings(): void {

    this.loadingBookings = true;
    this.bookingLoadError = '';

    this.bookingService.getLatestBookings(5).subscribe({

      next: (response) => {

        if (response?.success && response?.data) {
          this.latestBookings = response.data;
        } else {
          this.latestBookings = [];
          this.bookingLoadError = response.message || 'Could not load latest bookings.';
        }

        this.loadingBookings = false;
      },

      error: (error) => {

        this.latestBookings = [];
        this.bookingLoadError = error.status === 403
          ? 'You do not have access to this farmhouse’s bookings.'
          : 'Could not load latest bookings.';

        this.loadingBookings = false;
      }
    });
  }

  generateCalendar(): void {

    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();

    const firstDay = new Date(year, month, 1);

    const firstDate = new Date(
      year,
      month,
      1 - firstDay.getDay()
    );

    this.calendarDays = [];

    for (let i = 0; i < 42; i++) {

      const date = new Date(firstDate);

      date.setDate(firstDate.getDate() + i);

      this.calendarDays.push({
        date,
        currentMonth: date.getMonth() === month,
        isToday: date.toDateString() === this.today.toDateString()
      });
    }
  }

  previousMonth(): void {

    this.calendarDate = new Date(
      this.calendarDate.getFullYear(),
      this.calendarDate.getMonth() - 1,
      1
    );

    this.generateCalendar();
  }

  nextMonth(): void {

    this.calendarDate = new Date(
      this.calendarDate.getFullYear(),
      this.calendarDate.getMonth() + 1,
      1
    );

    this.generateCalendar();
  }

  selectDate(date: Date): void {

    this.selectedDate = new Date(date);

    if (
      date.getMonth() !== this.calendarDate.getMonth() ||
      date.getFullYear() !== this.calendarDate.getFullYear()
    ) {

      this.calendarDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      );

      this.generateCalendar();
    }
  }

  isSelectedDate(date: Date): boolean {

    return date.toDateString() ===
      this.selectedDate.toDateString();
  }
}
