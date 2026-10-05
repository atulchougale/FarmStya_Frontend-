import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders } from '@angular/common/http';

import { BehaviorSubject, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

import { PublicSite } from '../models/public-site.model';
import { LoaderService } from './loader.service';
import {
  AmenityResponseDto,
  CarouselResponseDto,
  FeedbackResponseDto,
} from '../../features/public/home/models/home.model';
import { GalleryResponseDto } from '../../features/public/gallery-public/gallery.model';
import { AboutUsResponseDto } from '../../features/public/about-us/about-us.model';
import { ContactUsRequest } from '../../features/public/contact-us/contact-us.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class PublicSiteService {
  private readonly apiUrl = `${environment.apiUrl}/public/site`;

  private readonly publicSiteSubject = new BehaviorSubject<PublicSite | null>(
    null,
  );

  public publicSite$ = this.publicSiteSubject.asObservable();

  constructor(
    private http: HttpClient,
    private loaderService: LoaderService,
  ) {}

  /**
   * Load Public Site Data
   */
  loadSite(): Observable<ApiResponse<PublicSite>> {
    //const domain = window.location.hostname;
    const domain = 'greenvalley.com';
    //const domain = 'riversidefarm.com';
    //const domain ='chougalefarm.com';
    //alert(domain);

    const headers = new HttpHeaders({
      'X-Domain': domain,
    });

    return this.http
      .get<ApiResponse<PublicSite>>(this.apiUrl, { headers })
      .pipe(
        tap((response) => {
          if (response.success) {
            this.publicSiteSubject.next(response.data);

            // Update global loader with the current farmhouse name
            this.loaderService.setFarmhouseName(response.data.farmHouseName);
          }
        }),
      );
  }

  /**
   * Current Site
   */
  get currentSite(): PublicSite | null {
    return this.publicSiteSubject.value;
  }

  /**
   * Current FarmHouse ID
   */
  get currentFarmHouseId(): number | null {
    return this.publicSiteSubject.value?.farmHouseId ?? null;
  }

  /**
   * Refresh Site
   */
  refresh(): void {
    this.loadSite().subscribe();
  }

  /**
   * Get Amenities
   */
  getAmenities(): Observable<ApiResponse<AmenityResponseDto[]>> {
    return this.http.get<ApiResponse<AmenityResponseDto[]>>(
      `${environment.apiUrl}/public/PublicPage/amenities`,
    );
  }

  /**
   * Get Carousel
   */
  getCarousel(): Observable<ApiResponse<CarouselResponseDto[]>> {
    return this.http.get<ApiResponse<CarouselResponseDto[]>>(
      `${environment.apiUrl}/public/PublicPage/carousel`,
    );
  }

  /**
   * Get Top Feedback
   */
  getFeedback(): Observable<ApiResponse<FeedbackResponseDto[]>> {
    return this.http.get<ApiResponse<FeedbackResponseDto[]>>(
      `${environment.apiUrl}/public/PublicPage/top-feedback`,
    );
  }

  /**
   * Get Gallery
   */
  getGallery(): Observable<ApiResponse<GalleryResponseDto[]>> {
    return this.http.get<ApiResponse<GalleryResponseDto[]>>(
      `${environment.apiUrl}/public/PublicPage/gallery`,
    );
  }

  getAboutUs(): Observable<ApiResponse<AboutUsResponseDto>> {
    return this.http.get<ApiResponse<AboutUsResponseDto>>(
      `${environment.apiUrl}/public/PublicPage/aboutus`,
    );
  }

  getContactInfo(): Observable<ApiResponse<PublicSite>> {
    return this.http.get<ApiResponse<PublicSite>>(
      `${environment.apiUrl}/public/PublicPage/contactInfo`,
    );
  }

  saveContactData(
    dto: ContactUsRequest,
  ): Observable<ApiResponse<ContactUsRequest[]>> {
    return this.http.post<ApiResponse<ContactUsRequest[]>>(
      `${environment.apiUrl}/Contact/save-contact`,
      dto,
    );
  }
}
