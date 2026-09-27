import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';

import {
  GalleryRequest,
  GalleryResponse,
  GalleryCategory,
} from '../../features/admin/gallery/models/gallery.model';

@Injectable({
  providedIn: 'root',
})
export class GalleryService {
  private readonly apiUrl = `${environment.apiUrl}/Gallery`;

  constructor(private readonly http: HttpClient) {}

  // =========================================
  // Save Gallery
  // =========================================

  saveGallery(dto: GalleryRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/savegallery`, dto);
  }

  // =========================================
  // Get Gallery By Id
  // =========================================

  getGalleryById(imageId: number): Observable<GalleryResponse> {
    return this.http.get<GalleryResponse>(
      `${this.apiUrl}/get-byid-gallery/${imageId}`,
    );
  }

  // =========================================
  // Get All Gallery
  // =========================================

  getAllGallery(): Observable<{
    success: boolean;
    message: string;
    data: GalleryResponse[];
  }> {
    return this.http.get<{
      success: boolean;
      message: string;
      data: GalleryResponse[];
    }>(`${this.apiUrl}/get-all-gallery`);
  }

  // =========================================
  // Update Gallery
  // =========================================

  updateGallery(dto: GalleryRequest): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/update-gallery`, dto);
  }

  // =========================================
  // Delete Gallery
  // =========================================

  deleteGallery(imageId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/delete-gallery/${imageId}`);
  }

  // =========================================
  // Get Gallery Categories
  // =========================================

  getGalleryCategories(): Observable<GalleryCategory[]> {
    return this.http
      .get<{
        success: boolean;
        message: string;
        data: string[];
      }>(`${this.apiUrl}/gallery-categories`)
      .pipe(
        map((response) =>
          response.data.map((category: string) => ({
            label: category,
            value: category,
          })),
        ),
      );

    // getGalleryCategories(): Observable<{
    //     success: boolean;
    //       message: string;
    //       data: GalleryCategory;
    //   }> {
    //     return this.http.get<{
    //       success: boolean;
    //         message: string;
    //         data: GalleryCategory;
    //     }>(
    //       `${this.apiUrl}/gallery-categories`
    //     ).pipe(
    //     map((categories: GalleryCategory[]) =>
    //       categories.map((category: string) => ({
    //         label: category,
    //         value: category,
    //       })),
    //     ),
    //   );
  }
}
