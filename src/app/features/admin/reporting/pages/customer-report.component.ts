import { Component } from '@angular/core';
import { ReportPageComponent } from './report-page.component';
@Component({standalone:true,imports:[ReportPageComponent],template:'<app-report-page reportKey="customers" />'})
export class CustomerReportComponent {}
