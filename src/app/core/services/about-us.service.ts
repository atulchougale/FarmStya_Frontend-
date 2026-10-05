import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../models/api-response.model';
import {AboutUsRequestDto,AboutUsResponseDto} from '../../features/admin/aboutus/models/about-us.model';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AboutUsService {

  private readonly apiUrl = `${environment.apiUrl}/AboutUs`;


  constructor(private readonly http: HttpClient) {}

  saveAboutUs(
    request: AboutUsRequestDto
  ): Observable<ApiResponse<AboutUsResponseDto>> {
    return this.http.post<ApiResponse<AboutUsResponseDto>>(
      `${this.apiUrl}/save-aboutus`,
      request
    );
  }

  getAboutUs(): Observable<ApiResponse<AboutUsResponseDto>> {
    return this.http.get<ApiResponse<AboutUsResponseDto>>(
      `${this.apiUrl}/get-aboutus`
    );
  }

  updateAboutUs(
    request: AboutUsRequestDto
  ): Observable<ApiResponse<AboutUsResponseDto>> {
    return this.http.put<ApiResponse<AboutUsResponseDto>>(
      `${this.apiUrl}/update-aboutus`,
      request
    );
  }
}