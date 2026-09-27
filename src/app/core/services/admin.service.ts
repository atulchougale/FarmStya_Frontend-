import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AdminMenuData } from '../../features/admin/models/admin-menu.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private readonly apiUrl = `${environment.apiUrl}/admin`;

  constructor(
    private readonly http: HttpClient
  ) { }

  getAdminMenu(): Observable<{
    success: boolean;
      message: string;
      data: AdminMenuData;
  }> {
    return this.http.get<{
      success: boolean;
        message: string;
        data: AdminMenuData;
    }>(
      `${this.apiUrl}/menu`
    );
  }

}