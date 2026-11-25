import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { TranslationPipe, LocalDatePipe } from '../../../core/i18n/language';
import { Booking } from '../Booking/models/booking.model';
import {
  DashboardService,
  DashboardSummary,
  CalendarBooking,
  RevenueMonth,
  BookingSourceTotal,
} from './dashboard.service';
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslationPipe, LocalDatePipe],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private readonly service = inject(DashboardService);
  private summaryRequest?: Subscription;
  private calendarRequest?: Subscription;
  today = new Date();
  calendarDate = new Date();
  selectedDate = new Date();
  summary?: DashboardSummary;
  latestBookings: Booking[] = [];
  loading = false;
  calendarLoading = false;
  error = '';
  calendarError = '';
  revenueTrend: RevenueMonth[] = [];
  bookingSources: BookingSourceTotal[] = [];
  get trendTotal(): number {
    return this.revenueTrend.reduce((sum, item) => sum + item.amount, 0);
  }
  get revenueScale(): number {
    const max = Math.max(0, ...this.revenueTrend.map((m) => m.amount));
    if (!max) return 100;
    const target = max / 4,
      power = 10 ** Math.floor(Math.log10(target));
    return ([1, 2, 5, 10].find((n) => n * power >= target) ?? 10) * power * 4;
  }
  get revenueTicks(): number[] {
    return [4, 3, 2, 1, 0].map((n) => (this.revenueScale * n) / 4);
  }
  revenueY(amount: number): number {
    return 170 - (150 * amount) / this.revenueScale;
  }
  get sourceTotal(): number {
    return this.bookingSources.reduce(
      (sum, item) => sum + item.bookingCount,
      0,
    );
  }
  sourceLabel(source: string): string {
    return (
      (
        {
          Online: 'Online',
          Phone: 'Phone enquiry',
          WalkIn: 'Walk-in',
          Other: 'Other',
        } as Record<string, string>
      )[source] ?? source
    );
  }
  sourceColor(source: string): string {
    return (
      (
        {
          Online: 'var(--primary-500, #ff7a12)',
          Phone: 'var(--primary-300, #ffb17a)',
          WalkIn: 'var(--primary-100, #ffe3ce)',
          Other: 'var(--dash-muted, #64717e)',
        } as Record<string, string>
      )[source] ?? 'var(--dash-muted)'
    );
  }
  sourcePercent(count: number): number {
    return this.sourceTotal ? (count * 100) / this.sourceTotal : 0;
  }
  get sourceGradient(): string {
    if (!this.sourceTotal) return 'var(--dash-border)';
    let start = 0;
    return (
      'conic-gradient(' +
      this.bookingSources
        .filter((item) => item.bookingCount > 0)
        .map((item) => {
          const end = start + this.sourcePercent(item.bookingCount);
          const stop = `${this.sourceColor(item.source)} ${start}% ${end}%`;
          start = end;
          return stop;
        })
        .join(',') +
      ')'
    );
  }
  readonly weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  readonly calendarStatuses = [
    'Pending',
    'Approved',
    'Confirmed',
    'CheckedIn',
    'CheckedOut',
  ];
  calendarDays: { date: Date; currentMonth: boolean; isToday: boolean }[] = [];
  private readonly bookingsByDate = new Map<string, CalendarBooking[]>();
  ngOnInit(): void {
    this.generateCalendar();
    this.refresh();
  }
  refresh(): void {
    this.loadSummary();
    this.loadCalendar();
  }
  private dateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  private parseDate(value: string): Date {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  statusClass(status: string | undefined): string {
    const key = (status ?? 'unknown').toLowerCase().replace(/[\s_-]/g, '');
    return (
      'status-' +
      ([
        'pending',
        'approved',
        'confirmed',
        'checkedin',
        'checkedout',
        'rejected',
        'cancelled',
        'completed',
      ].includes(key)
        ? key
        : 'unknown')
    );
  }
  bookingsForDate(date: Date): CalendarBooking[] {
    return this.bookingsByDate.get(this.dateKey(date)) ?? [];
  }
  get selectedBookings(): CalendarBooking[] {
    return this.bookingsForDate(this.selectedDate);
  }
  private loadSummary(): void {
    this.summaryRequest?.unsubscribe();
    this.loading = true;
    this.error = '';
    this.summaryRequest = this.service
      .get()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (r) => {
          this.summary = r.data.summary;
          this.latestBookings = r.data.latestBookings;
          this.revenueTrend = r.data.revenueTrend ?? [];
          this.bookingSources = r.data.bookingSources ?? [];
          this.today = this.parseDate(r.data.summary.serverToday);
          this.generateCalendar();
        },
        error: (e) => {
          this.summary = undefined;
          this.latestBookings = [];
          this.revenueTrend = [];
          this.bookingSources = [];
          this.error = e.error?.message ?? 'Could not load dashboard.';
        },
      });
  }
  private loadCalendar(): void {
    this.calendarRequest?.unsubscribe();
    this.calendarLoading = true;
    this.calendarError = '';
    this.bookingsByDate.clear();
    const year = this.calendarDate.getFullYear(),
      month = this.calendarDate.getMonth() + 1;
    this.calendarRequest = this.service
      .calendar(year, month)
      .pipe(finalize(() => (this.calendarLoading = false)))
      .subscribe({
        next: (r) => {
          for (const booking of r.data) {
            const key = booking.stayDate.slice(0, 10);
            this.bookingsByDate.set(key, [
              ...(this.bookingsByDate.get(key) ?? []),
              booking,
            ]);
          }
          if (
            !this.bookingsForDate(this.selectedDate).length ||
            this.selectedDate.getMonth() !== month - 1 ||
            this.selectedDate.getFullYear() !== year
          )
            this.selectedDate = r.data.length
              ? this.parseDate(r.data[0].stayDate)
              : new Date(year, month - 1, 1);
        },
        error: (e) => {
          this.calendarError =
            e.error?.message ?? 'Could not load booked dates.';
        },
      });
  }
  generateCalendar(): void {
    const year = this.calendarDate.getFullYear(),
      month = this.calendarDate.getMonth(),
      start = new Date(year, month, 1);
    start.setDate(1 - start.getDay());
    this.calendarDays = Array.from({ length: 42 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return {
        date,
        currentMonth: date.getMonth() === month,
        isToday: this.dateKey(date) === this.dateKey(this.today),
      };
    });
  }
  changeMonth(offset: number): void {
    this.calendarDate = new Date(
      this.calendarDate.getFullYear(),
      this.calendarDate.getMonth() + offset,
      1,
    );
    this.generateCalendar();
    this.loadCalendar();
  }
  selectDate(date: Date): void {
    if (this.bookingsForDate(date).length) this.selectedDate = new Date(date);
  }
  isSelectedDate(date: Date): boolean {
    return (
      this.dateKey(date) === this.dateKey(this.selectedDate) &&
      this.selectedBookings.length > 0
    );
  }
  ngOnDestroy(): void {
    this.summaryRequest?.unsubscribe();
    this.calendarRequest?.unsubscribe();
  }
}
