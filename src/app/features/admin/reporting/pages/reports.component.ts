import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslationPipe } from '../../../../core/i18n/language';
import { ReportingService } from '../services/reporting.service';
import { ReportDefinition } from '../models/report.model';
@Component({ standalone: true, imports: [CommonModule, RouterLink, TranslationPipe], styleUrl: '../reporting.css',
  template: `<main class="reporting-page admin-records"><h1><i class="bi bi-bar-chart-line admin-page-icon" aria-hidden="true"></i>{{ 'Reports' | t }}</h1>
    <p class="subtitle">{{ 'Choose a report to filter, review and download as PDF or Excel.' | t }}</p>
    <p *ngIf="loading" role="status">{{ 'Loading reports…' | t }}</p><p *ngIf="error" class="alert alert-danger">{{ error | t }}</p>
    <div class="report-cards"><section *ngFor="let report of reports" class="report-card">
      <i class="bi report-icon" [ngClass]="report.key === 'bookings' ? 'bi-calendar-check' : report.key === 'revenue' ? 'bi-cash-stack' : report.key === 'customers' ? 'bi-people' : 'bi-house-check'" aria-hidden="true"></i><div><h2>{{ report.title | t }}</h2>
      <p>{{ report.description | t }}</p><a class="btn btn-success" [routerLink]="'/admin/reports/' + report.key">{{ 'Open report' | t }} →</a></div>
    </section></div></main>` })
export class ReportsComponent implements OnInit {
  private readonly service = inject(ReportingService); reports: ReportDefinition[] = []; loading = false; error = '';
  ngOnInit(): void { this.loading = true; this.service.catalog().pipe(finalize(() => this.loading = false)).subscribe({
    next: r => this.reports = r.data, error: () => this.error = 'Could not load reports.' }); }
}
