// import { Injectable } from '@angular/core';
// import { HttpClient, HttpHeaders } from '@angular/common/http';

// import { BehaviorSubject, Observable, tap } from 'rxjs';

// import { environment } from '../../../environments/environment';

// import { PublicSite } from '../../features/auth/models/public-site.model';

// interface ApiResponse<T> {
//   success: boolean;
//   message: string;
//   data: T;
// }

// @Injectable({
//   providedIn: 'root',
// })
// export class PublicSiteService {
//   private readonly apiUrl = `${environment.apiUrl}/public/site`;

//   private readonly publicSiteSubject = new BehaviorSubject<PublicSite | null>(
//     null,
//   );

//   public publicSite$ = this.publicSiteSubject.asObservable();

//   constructor(private http: HttpClient) {}

//   /**
//    * Load Public Site Data
//    */
//   loadSite(): Observable<ApiResponse<PublicSite>> {
//     //const domain = window.location.hostname;
//     const domain ='greenvalley.com'
//     alert(domain);

//     const headers = new HttpHeaders({
//       'X-Domain': domain,
//     });

//     return this.http
//       .get<ApiResponse<PublicSite>>(this.apiUrl, { headers })
//       .pipe(
//         tap((response) => {
//           if (response.success) {
//             this.publicSiteSubject.next(response.data);
//           }
//         }),
//       );
//   }

//   /**
//    * Current Site
//    */
//   get currentSite(): PublicSite | null {
//     return this.publicSiteSubject.value;
//   }

//   /**
//    * Refresh Site
//    */
//   refresh(): void {
//     this.loadSite().subscribe();
//   }
// }

import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders } from '@angular/common/http';

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
    //const domain = window.location.hostname;
    const domain = 'greenvalley.com';
    //const domain = 'riversidefarm.com';
    alert(domain);

    const headers = new HttpHeaders({
      'X-Domain': domain,
    });

    return this.http
      .get<ApiResponse<PublicSite>>(this.apiUrl, { headers })
      .pipe(
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
}
