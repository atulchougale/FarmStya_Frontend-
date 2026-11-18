import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface BookingRate {
  pricingKey: string;
  price: number;
  currencyCode: string;
}

export interface BookingQuote {
  stayDays: number;
  eventDays: number;
  stayRate: number;
  eventRate: number;
  advanceRate: number;
  stayAmount: number;
  eventAmount: number;
  totalAmount: number;
  advanceAmount: number;
  remainingAmount: number;
  currencyCode: string;
  pricingVersion: string;
}

@Injectable({ providedIn: 'root' })
export class BookingPricingService {
  private readonly http = inject(HttpClient);

  getRates() {
    return this.http.get<ApiResponse<BookingRate[]>>(
      `${environment.apiUrl}/booking-pricing`,
    );
  }

  getQuote(request: {
    checkInDate: string;
    checkOutDate: string;
    bookingType: string;
    eventDates: string[];
  }) {
    return this.http.post<ApiResponse<BookingQuote>>(
      `${environment.apiUrl}/booking-pricing/quote`, request,
    );
  }
}
