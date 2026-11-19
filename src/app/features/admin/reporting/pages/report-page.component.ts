import { Component, Input, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Subject, Subscription, debounceTime, finalize } from 'rxjs';
import { LocalDatePipe, TranslationPipe } from '../../../../core/i18n/language';
import { ReportingService } from '../services/reporting.service';
import { ReportDefinition, ReportFilter, ReportPage } from '../models/report.model';
@Component({ selector: 'app-report-page', standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatTableModule, MatPaginatorModule, LocalDatePipe, TranslationPipe],
  templateUrl: './report-page.component.html', styleUrl: '../reporting.css' })
export class ReportPageComponent implements OnInit, OnDestroy {
  @Input({ required: true }) reportKey!: string;
  private readonly service = inject(ReportingService);
  private readonly changes = new Subject<void>();
  private readonly subscriptions = new Subscription();
  private request?: Subscription;
  private exportRequest?: Subscription;
  readonly months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  definition?: ReportDefinition; data?: ReportPage; loading = false; downloading = ''; error = ''; searchText = ''; searchPending = false;
  filter: ReportFilter = { period: 'month', fromDate: '', toDate: '', month: new Date().getMonth()+1, year: new Date().getFullYear(),
    bookingType: 'all', source: 'all', search: '', page: 1, pageSize: 25 };
  applied: ReportFilter = { ...this.filter };
  get columns(): string[] { return this.data?.columns.map(c => c.key) ?? []; }
  ngOnInit(): void {
    this.subscriptions.add(this.changes.pipe(debounceTime(350)).subscribe(() => {
      this.applied.search = this.searchText.trim(); this.applied.page = 1; this.searchPending = false; this.load();
    }));
    this.loading = true;
    this.subscriptions.add(this.service.catalog().subscribe({ next: r => { this.definition = r.data.find(d => d.key === this.reportKey); this.load(); },
      error: () => { this.loading = false; this.error = 'Could not load reports.'; } }));
  }
  submit(): void {
    if (this.filter.period === 'range' && (!this.filter.fromDate || !this.filter.toDate || this.filter.fromDate > this.filter.toDate)) {
      this.error = 'Choose a valid From date and To date.'; return;
    }
    this.applied = { ...this.filter, page: 1, search: this.searchText.trim() }; this.load();
  }
  searchChanged(): void { this.searchPending = true; this.changes.next(); }
  page(event: PageEvent): void { this.applied.page = event.pageIndex + 1; this.applied.pageSize = event.pageSize; this.load(); }
  private load(): void {
    this.request?.unsubscribe(); this.loading = true; this.error = '';
    this.request = this.service.list(this.reportKey, { ...this.applied }).pipe(finalize(() => this.loading = false)).subscribe({
      next: r => { this.data = r.data; }, error: e => { this.data = undefined; this.error = e.error?.message ?? 'Could not load report data.'; } });
  }
  download(format: 'pdf' | 'excel'): void {
    if (this.downloading || this.loading || this.searchPending || !this.definition?.canExport) return;
    this.downloading = format; this.error = '';
    this.exportRequest = this.service.export(this.reportKey, { ...this.applied }, format).pipe(finalize(() => this.downloading = '')).subscribe({
      next: r => {
        if (!r.body) return;
        const url = URL.createObjectURL(r.body); const a = document.createElement('a'); a.href = url;
        a.download = r.headers.get('Content-Disposition')?.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)?.[1] ?? `${this.reportKey}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        a.click(); setTimeout(() => URL.revokeObjectURL(url), 10000);
      }, error: async e => { try { const details = JSON.parse(await e.error.text()); this.error = details.message; }
        catch { this.error = 'Could not export the report. Narrow the filters and try again.'; } }
    });
  }
  ngOnDestroy(): void { this.request?.unsubscribe(); this.exportRequest?.unsubscribe(); this.subscriptions.unsubscribe(); this.changes.complete(); }
}
