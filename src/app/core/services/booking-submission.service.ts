import { ADMIN_BOOKING_CONTEXT } from './admin-booking-context';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface SubmittedBooking {
  bookingId: number;
  bookingReference: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  bookingType: string;
  totalAmount: number;
  advanceAmount: number;
  currencyCode: string;
}

@Injectable({ providedIn: 'root' })
export class BookingSubmissionService {
  private readonly http = inject(HttpClient);
  private readonly admin = inject(ADMIN_BOOKING_CONTEXT, { optional: true });

  submit(payload: object) {
    const url = this.admin ? '/administration/bookings' : '/bookings';
    const body = this.admin ? { customerUserId: this.admin.customer?.userId, bookingSource: this.admin.source, booking: payload } : payload;
    return this.http.post<ApiResponse<SubmittedBooking>>(`${environment.apiUrl}${url}`, body);
  }

  getMine() {
    return this.http.get<ApiResponse<SubmittedBooking[]>>(`${environment.apiUrl}/bookings/mine`);
  }
}
