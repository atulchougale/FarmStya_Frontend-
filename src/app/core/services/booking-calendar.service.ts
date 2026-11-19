import { ADMIN_BOOKING_CONTEXT } from './admin-booking-context';
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

import { BookingCalendarAvailabilityRequest } from '../../features/public/home/models/booking-calendar-availability-request.model';
import { BookingCalendarAvailabilityResponse } from '../../features/public/home/models/booking-calendar-availability-response.model';

import { BookingCalendarMonthResponse } from '../../features/public/booking/models/booking-calendar-month-response.model';

import { CreateBookingDateReservationRequest } from '../../features/public/booking/models/create-booking-date-reservation-request.model';

import { CreateBookingDateReservationResponse } from '../../features/public/booking/models/create-booking-date-reservation-response.model';

import {
  DeleteBookingDateReservationRequest,
  DeleteBookingDateReservationResponse,
} from '../../features/public/booking/models/delete-booking-date-reservation-request.model';

import { ActiveBookingDateReservation } from '../../features/public/booking/models/active-booking-date-reservation.model';

@Injectable({
  providedIn: 'root',
})
export class BookingCalendarService {
  private readonly admin = inject(ADMIN_BOOKING_CONTEXT, { optional: true });
  private readonly apiUrl = `${environment.apiUrl}/booking-calendar`;

  constructor(private readonly http: HttpClient) {}

  private get reservationUrl(): string {
    return this.admin ? environment.apiUrl + '/administration/bookings' : this.apiUrl;
  }

  // Existing API: Get date availability
  getAvailability(
    request: BookingCalendarAvailabilityRequest,
  ): Observable<ApiResponse<BookingCalendarAvailabilityResponse>> {
    const params = new HttpParams()
      .set('fromDate', request.fromDate)
      .set('toDate', request.toDate);

    return this.http.get<ApiResponse<BookingCalendarAvailabilityResponse>>(
      `${this.apiUrl}/availability`,
      { params },
    );
  }

  // New API: Get calendar for a specific month
  getCalendarMonth(
    month: number,
    year: number,
  ): Observable<ApiResponse<BookingCalendarMonthResponse>> {
    const params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString());

    return this.http.get<ApiResponse<BookingCalendarMonthResponse>>(
      `${this.apiUrl}/month`,
      { params },
    );
  }

  // New API: Reserve dates temporarily
  reserveDates(
    request: CreateBookingDateReservationRequest,
  ): Observable<ApiResponse<CreateBookingDateReservationResponse>> {
    return this.http.post<ApiResponse<CreateBookingDateReservationResponse>>(
      `${this.reservationUrl}/reserve`,
      request,
    );
  }

  // New API: Release (permanently delete) temporarily reserved dates.
  // Supports a single date (only fromDate) or a range (fromDate + toDate).
  releaseDates(
    request: DeleteBookingDateReservationRequest,
  ): Observable<ApiResponse<DeleteBookingDateReservationResponse>> {
    let params = new HttpParams().set('fromDate', request.fromDate);

    // Add toDate only for range release.
    if (request.toDate) {
      params = params.set('toDate', request.toDate);
    }

    return this.http.delete<ApiResponse<DeleteBookingDateReservationResponse>>(
      `${this.reservationUrl}/reserve`,
      { params },
    );
  }

  // Recover current user's active date reservations
  getActiveUserReservations(): Observable<
    ApiResponse<ActiveBookingDateReservation[]>
  > {
    return this.http.get<ApiResponse<ActiveBookingDateReservation[]>>(
      `${this.reservationUrl}/reserve/active`,
    );
  }
}
