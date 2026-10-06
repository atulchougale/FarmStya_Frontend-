import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

import { FeedbackResponse } from '../../features/admin/Feedback/feedback.model'
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {

  private readonly apiUrl = `${environment.apiUrl}/Feedback`;

  constructor(
    private readonly http: HttpClient
  ) {}

 
  // Admin - Get All Feedback
  

  getAllFeedback(): Observable<ApiResponse<FeedbackResponse[]>> {
    return this.http.get<ApiResponse<FeedbackResponse[]>>(
      `${this.apiUrl}/get-all-feedback`
    );
  }

  
  // Admin - Get Feedback By ID
  

  getFeedbackById(feedbackId: number): Observable<ApiResponse<FeedbackResponse[]>> {
    return this.http.get<ApiResponse<FeedbackResponse[]>>(
      `${this.apiUrl}/get-byid-feedback/${feedbackId}`
    );
  }

 
  // Admin - Delete Feedback
 

  deleteFeedback(feedbackId: number): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/delete-feedback/${feedbackId}`
    );
  }
}