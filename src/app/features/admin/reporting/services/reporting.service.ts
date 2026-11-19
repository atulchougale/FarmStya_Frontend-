import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { ReportDefinition, ReportFilter, ReportPage } from '../models/report.model';
interface Response<T> { success: boolean; data: T; message: string; }
@Injectable({ providedIn: 'root' })
export class ReportingService {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl + '/administration/reports';
  catalog() { return this.http.get<Response<ReportDefinition[]>>(this.url); }
  private params(filter: ReportFilter): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filter)) if (value !== '' && value !== null && value !== undefined) params = params.set(key, String(value));
    return params;
  }
  list(key: string, filter: ReportFilter) { return this.http.get<Response<ReportPage>>(this.url + '/' + key, { params: this.params(filter) }); }
  export(key: string, filter: ReportFilter, format: 'pdf' | 'excel') {
    return this.http.get(this.url + '/' + key + '/export/' + format, { params: this.params(filter), responseType: 'blob', observe: 'response' });
  }
}
