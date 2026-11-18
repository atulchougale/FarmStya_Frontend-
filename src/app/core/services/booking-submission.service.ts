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

  submit(payload: object) {
    return this.http.post<ApiResponse<SubmittedBooking>>(`${environment.apiUrl}/bookings`, payload);
  }

  getMine() {
    return this.http.get<ApiResponse<SubmittedBooking[]>>(`${environment.apiUrl}/bookings/mine`);
  }
}
