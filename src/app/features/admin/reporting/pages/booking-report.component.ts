import { Component } from '@angular/core';
import { ReportPageComponent } from './report-page.component';
@Component({standalone:true,imports:[ReportPageComponent],template:'<app-report-page reportKey="bookings" />'})
export class BookingReportComponent {}
