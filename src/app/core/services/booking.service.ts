
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { Booking } from '../../features/admin/Booking/models/booking.model';
import { ApiResponse } from '../models/api-response.model';

export interface BookingIdentityDocument {
  id: number;
  fileName: string;
  contentType: string;
  status: 'Uploaded' | 'Verified' | 'ReuploadRequested';
  reason?: string;
}

export interface AdvancePaymentOrder {
  paymentTransactionId: number;
  orderId: string;
  amountInPaise: number;
  currency: string;
  keyId: string;
}

export interface CheckoutBalance {
  total: number;
  advancePaid: number;
  discount: number;
  payable: number;
  currency: string;
  paymentStatus?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {

  private readonly apiUrl = `${environment.apiUrl}/booking`;

  checkIn(id: number) {
    return this.http.post<ApiResponse<unknown>>(`${this.apiUrl}/${id}/check-in`, {});
  }

  checkoutBalance(id: number, customer = false) {
    const path = customer ? `my-bookings/${id}` : String(id);
    return this.http.get<ApiResponse<CheckoutBalance>>(`${this.apiUrl}/${path}/checkout`);
  }

  submitCheckout(id: number, method: string, discount: number, reason: string) {
    return this.http.post<ApiResponse<unknown>>(`${this.apiUrl}/${id}/checkout`, { method, discount, reason });
  }

  checkoutOrder(id: number) {
    return this.http.post<ApiResponse<AdvancePaymentOrder>>(`${this.apiUrl}/my-bookings/${id}/checkout-order`, {});
  }

  verifyCheckout(id: number) {
    return this.http.post<ApiResponse<unknown>>(`${this.apiUrl}/my-bookings/${id}/verify-checkout`, {});
  }

  constructor(
    private readonly http: HttpClient
  ) {}

  // Admin - Get All Bookings

  getAllBookings(params: {
    page: number;
    pageSize: number;
  }): Observable<ApiResponse<Booking[]>> {

    const httpParams = new HttpParams()
      .set('page', params.page)
      .set('pageSize', params.pageSize);

    return this.http.get<ApiResponse<Booking[]>>(
      `${this.apiUrl}/list`,
      { params: httpParams }
    );
  }


  // Admin - Get Booking By ID

  getBookingById(
    bookingId: number
  ): Observable<ApiResponse<Booking>> {

    return this.http.get<ApiResponse<Booking>>(
      `${this.apiUrl}/${bookingId}`
    );
  }

  approveBooking(bookingId: number): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.apiUrl}/${bookingId}/approve`, {});
  }

  rejectBooking(bookingId: number, reason: string): Observable<ApiResponse<unknown>> {
    return this.http.post<ApiResponse<unknown>>(`${this.apiUrl}/${bookingId}/reject`, { reason });
  }

  getIdentity(bookingId: number, customer: boolean) {
    const path = customer ? `my-bookings/${bookingId}` : String(bookingId);
    return this.http.get<ApiResponse<BookingIdentityDocument | null>>(`${this.apiUrl}/${path}/id-proof`);
  }

  uploadIdentity(bookingId: number, file: File) {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<ApiResponse<BookingIdentityDocument>>(
      `${this.apiUrl}/my-bookings/${bookingId}/id-proof`, body);
  }

  createAdvanceOrder(bookingId: number) {
    return this.http.post<ApiResponse<AdvancePaymentOrder>>(
      `${this.apiUrl}/my-bookings/${bookingId}/advance-order`, {});
  }

  verifyAdvance(bookingId: number) {
    return this.http.post<ApiResponse<unknown>>(
      `${this.apiUrl}/my-bookings/${bookingId}/verify-advance`, {});
  }

  getIdentityContent(bookingId: number, documentId: number, customer = false) {
    const path = customer ? `my-bookings/${bookingId}` : String(bookingId);
    return this.http.get(`${this.apiUrl}/${path}/id-proof/${documentId}/content`, { responseType: 'blob' });
  }

  reviewIdentity(bookingId: number, documentId: number, verified: boolean, reason?: string) {
    return this.http.post<ApiResponse<unknown>>(
      `${this.apiUrl}/${bookingId}/id-proof/${documentId}/review`, { verified, reason });
  }


  // Admin - Get Latest Bookings

  getLatestBookings(
    count: number = 5
  ): Observable<ApiResponse<Booking[]>> {

    const params = new HttpParams()
      .set('count', count);

    return this.http.get<ApiResponse<Booking[]>>(
      `${this.apiUrl}/latest`,
      { params }
    );
  }


 getMyBookings(
    page: number = 1,
    pageSize: number = 10
  ): Observable<ApiResponse<Booking[]>> {

    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    return this.http.get<ApiResponse<Booking[]>>(
      `${this.apiUrl}/my-bookings`,
      { params }
    );
  }

  // Customer - Get My Booking Details By ID
  getMyBookingById(
    bookingId: number
  ): Observable<ApiResponse<Booking>> {

    return this.http.get<ApiResponse<Booking>>(
      `${this.apiUrl}/my-bookings/${bookingId}`
    );
  }
}
