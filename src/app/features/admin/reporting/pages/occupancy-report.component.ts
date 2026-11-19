import { Component } from '@angular/core';
import { ReportPageComponent } from './report-page.component';
@Component({standalone:true,imports:[ReportPageComponent],template:'<app-report-page reportKey="occupancy" />'})
export class OccupancyReportComponent {}
