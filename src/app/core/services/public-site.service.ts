import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { BehaviorSubject, Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

import { PublicSite } from '../models/public-site.model';

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

  constructor(private http: HttpClient) {}

  /**
   * Load Public Site Data
   */
  loadSite(): Observable<ApiResponse<PublicSite>> {
    return this.http.get<ApiResponse<PublicSite>>(this.apiUrl).pipe(
      tap((response) => {
        if (response.success) {
          this.publicSiteSubject.next(response.data);
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
   * Refresh Site
   */
  refresh(): void {
    this.loadSite().subscribe();
  }
}
