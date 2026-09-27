import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { FileUploadResponse } from '../models/file-upload-response.model';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  constructor(private http: HttpClient) {}

  // Simple upload (no progress tracking)
  uploadFile(
    file: File,
    folder: string,
  ): Observable<ApiResponse<FileUploadResponse>> {
    const formData = new FormData();

    formData.append('File', file);
    formData.append('Folder', folder);

    return this.http.post<ApiResponse<FileUploadResponse>>(
      `${environment.apiUrl}/FileUpload/upload`,
      formData,
    );
  }

  // Upload with real-time progress events
  uploadFileWithProgress(
    file: File,
    folder: string,
  ): Observable<HttpEvent<ApiResponse<FileUploadResponse>>> {
    const formData = new FormData();

    formData.append('File', file);
    formData.append('Folder', folder);

    const request = new HttpRequest<FormData>(
      'POST',
      `${environment.apiUrl}/FileUpload/upload`,
      formData,
      {
        reportProgress: true,
      },
    );

    return this.http.request<ApiResponse<FileUploadResponse>>(request);
  }
}
