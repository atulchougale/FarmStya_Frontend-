import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface PricingRates {
  bookingDaily: number;
  normalEventDaily: number;
  decorationEventDaily: number;
  advanceDaily: number;
}

export interface PricingEntry {
  pricingId: number;
  pricingKey: string;
  pricingName: string;
  price: number;
  currencyCode: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class PricingManagementService {
  private readonly url = environment.apiUrl + '/administration/website-settings/pricing';
  constructor(private readonly http: HttpClient) {}
  list() { return this.http.get<ApiResponse<PricingEntry[]>>(this.url + '/entries'); }
  create(entry: PricingEntry) { return this.http.post<ApiResponse<PricingEntry>>(this.url + '/entries', entry); }
  update(entry: PricingEntry) { return this.http.put<ApiResponse<PricingEntry>>(this.url + '/entries/' + entry.pricingId, entry); }
  delete(id: number) { return this.http.delete<ApiResponse<unknown>>(this.url + '/entries/' + id); }
}
