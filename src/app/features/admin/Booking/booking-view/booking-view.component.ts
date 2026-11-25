import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { Subscription, finalize } from 'rxjs';
import { AdminService } from '../../../../core/services/admin.service';
import { BookingService } from '../../../../core/services/booking.service';
import { TranslationPipe, LocalDatePipe } from '../../../../core/i18n/language';
import { Booking } from '../models/booking.model';

@Component({ selector: 'app-booking-view', standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatTableModule, MatMenuModule, TranslationPipe, LocalDatePipe],
  templateUrl: './booking-view.component.html', styleUrl: './booking-view.component.css' })
export class BookingViewComponent implements OnInit, OnDestroy {
  private readonly service = inject(BookingService);
  private readonly admin = inject(AdminService);
  private request?: Subscription;
  private menuRequest?: Subscription;
  canCreateBooking = false;
  canExport = false;
  loading = false;
  error = '';
  items: Booking[] = [];
  totalCount = 0;
  page = 1;
  pageSize = 5;
  search = ''; status = ''; source = ''; from = ''; to = '';
  private applied = { search: '', status: '', source: '', from: '', to: '' };
  summary = { total: 0, confirmed: 0, checkedIn: 0, checkedOut: 0, pending: 0 };
  readonly columns = ['reference', 'guest', 'dates', 'guests', 'source', 'amount', 'status', 'actions'];
  readonly statuses = ['Pending', 'Approved', 'Confirmed', 'CheckedIn', 'CheckedOut', 'Cancelled', 'Rejected', 'Completed'];
  get cards() { return [
    { label: 'Total Bookings', value: this.summary.total, icon: 'bi-calendar', tone: 'brand', note: 'All time bookings' },
    { label: 'Confirmed', value: this.summary.confirmed, icon: 'bi-calendar-check', tone: 'success', note: 'of total' },
    { label: 'Checked In', value: this.summary.checkedIn, icon: 'bi-box-arrow-in-right', tone: 'info', note: 'of total' },
    { label: 'Checked Out', value: this.summary.checkedOut, icon: 'bi-box-arrow-right', tone: 'purple', note: 'of total' },
    { label: 'Pending', value: this.summary.pending, icon: 'bi-clock', tone: 'warning', note: 'of total' }
  ]; }
  get pages(): number { return Math.max(1, Math.ceil(this.totalCount / this.pageSize)); }
  get pageNumbers(): number[] {
    const start = Math.max(1, Math.min(this.page - 2, this.pages - 4));
    return Array.from({ length: Math.min(5, this.pages) }, (_, i) => start + i);
  }
  get first(): number { return this.totalCount ? (this.page - 1) * this.pageSize + 1 : 0; }
  get last(): number { return Math.min(this.page * this.pageSize, this.totalCount); }
  ngOnInit(): void {
    this.load();
    this.menuRequest = this.admin.getAdminMenu().subscribe({ next: r => {
      this.canCreateBooking = !!r.data?.modules.some(m => m.subMenus?.some(s => s.permissions.includes('Bookings.Create')));
      this.canExport = !!r.data?.modules.some(m => m.subMenus?.some(s => s.permissions.includes('BookingReport.View') && s.permissions.includes('BookingReport.Export')));
    }, error: () => { this.canCreateBooking = false; } });
  }
  apply(): void {
    if (this.from && this.to && this.from > this.to) { this.error = 'Start date must be on or before end date.'; return; }
    this.applied = { search: this.search.trim(), status: this.status, source: this.source, from: this.from, to: this.to };
    this.page = 1; this.load();
  }
  reset(): void { this.search = this.status = this.source = this.from = this.to = ''; this.apply(); }
  refresh(): void { this.load(); }
  go(page: number): void { if (this.loading || page < 1 || page > this.pages) return; this.page = page; this.load(); }
  resize(): void { this.page = 1; this.load(); }
  private load(): void {
    this.request?.unsubscribe(); this.loading = true; this.error = '';
    this.request = this.service.getAdministrationBookings({ ...this.applied, page: this.page, pageSize: this.pageSize })
      .pipe(finalize(() => this.loading = false)).subscribe({ next: r => {
        if (!r.success) { this.items = []; this.totalCount = 0; this.error = r.message || 'Unable to load bookings.'; return; }
        this.items = r.data.items; this.totalCount = r.data.totalCount; this.summary = r.data.summary;
        if (this.page > this.pages) { this.page = this.pages; this.load(); }
      }, error: () => { this.items = []; this.totalCount = 0; this.error = 'Unable to load bookings.'; } });
  }
  statusLabel(status: string): string { return ({ CheckedIn: 'Checked In', CheckedOut: 'Checked Out' } as Record<string, string>)[status] ?? status; }
  sourceLabel(source: string): string { return ({ Online: 'Online', Phone: 'Phone enquiry', WalkIn: 'Walk-in' } as Record<string, string>)[source] ?? 'Other'; }
  sourceIcon(source: string): string { return source === 'Phone' ? 'bi-telephone' : source === 'WalkIn' ? 'bi-person-walking' : 'bi-laptop'; }
  statusClass(status: string): string { return 'status-' + status.toLowerCase().replace(/[^a-z]/g, ''); }
  ngOnDestroy(): void { this.request?.unsubscribe(); this.menuRequest?.unsubscribe(); }
}
