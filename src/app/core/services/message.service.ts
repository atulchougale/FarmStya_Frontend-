import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { ContactResponseDto } from '../../features/admin/ContactUsMessage/models/message.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})


export class MessageService {

  constructor(private http: HttpClient) { }

  getContactAll(): Observable<ApiResponse<ContactResponseDto[]>> {
    return this.http.get<ApiResponse<ContactResponseDto[]>>(
      `${environment.apiUrl}/Contact/get-contact`
    );
  }

  deleteContact(contactId: number): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(
      `${environment.apiUrl}/Contact/delete-contact/${contactId}`
    );
  }
}