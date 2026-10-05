import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  AmenityRequest,
  AmenityResponse,
} from '../../features/admin/amenity/models/amenity.model';

@Injectable({
  providedIn: 'root',
})
export class AmenityService {
  private readonly apiUrl = `${environment.apiUrl}/Amenity`;

  constructor(private readonly http: HttpClient) {}

  saveAmenity(dto: AmenityRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/save-amenity`, dto);
  }

  getAmenityById(imageId: number): Observable<AmenityResponse> {
    return this.http.get<AmenityResponse>(
      `${this.apiUrl}/get-byid-amenity/${imageId}`,
    );
  }

  getAllAmenity(): Observable<{
    success: boolean;
    message: string;
    data: AmenityResponse[];
  }> {
    return this.http.get<{
      success: boolean;
      message: string;
      data: AmenityResponse[];
    }>(`${this.apiUrl}/get-all-amenity`);
  }

  updateAmenity(dto: AmenityRequest): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update-amenity`, dto);
  }

  deleteAmenity(imageId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete-amenity/${imageId}`);
  }
}
