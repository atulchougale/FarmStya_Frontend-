import { TranslationPipe, LocalDatePipe } from '../../../core/i18n/language';
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { BookingSubmissionService, SubmittedBooking } from '../../../core/services/booking-submission.service';

@Component({
  standalone: true,
  imports: [TranslationPipe, LocalDatePipe, CommonModule, RouterLink],
  template: `
    <main>
      <header><h1>{{ 'My Bookings' | t }}</h1><a routerLink="/booking">{{ 'Start a booking' | t }}</a></header>
      <p *ngIf="loading" role="status">{{ 'Loading bookings…' | t }}</p>
      <p *ngIf="error" role="alert">{{ (error) | t }} <button type="button" (click)="load()">{{ 'Retry' | t }}</button></p>
      <p *ngIf="!loading && !error && !bookings.length">{{ 'Your booking requests will appear here.' | t }}</p>
      <article *ngFor="let booking of bookings" [class.selected]="booking.bookingReference === selectedReference">
        <h2>{{ booking.bookingReference }}</h2>
        <p>{{ (booking.status === 'Pending' ? 'Awaiting farmhouse approval' : booking.status) | t }}</p>
        <p>{{ '{p0} to {p1}' | t:{p0: (booking.checkInDate | localDate:'d MMM yyyy'), p1: (booking.checkOutDate | localDate:'d MMM yyyy')} }}</p>
        <p>{{ 'Total {p0} · Advance {p1}' | t:{p0: (booking.totalAmount | currency:booking.currencyCode), p1: (booking.advanceAmount | currency:booking.currencyCode)} }}</p>
      </article>
    </main>
  `,
  styles: [`
    main { max-width: 52rem; margin: auto; padding: 2rem 1rem; }
    header { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    article { border: 1px solid #d9dfd4; border-radius: 10px; padding: 1rem; margin-top: 1rem; }
    article.selected { border-color: #344b2f; background: #f3f7f0; }
    h2 { font-size: 1.2rem; }
    article p:last-child { margin-bottom: 0; }
  `],
})
export class MyBookingsComponent implements OnInit {
  private readonly service = inject(BookingSubmissionService);
  readonly selectedReference = inject(ActivatedRoute).snapshot.queryParamMap.get('reference');
  bookings: SubmittedBooking[] = [];
  loading = false;
  error = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.service.getMine().pipe(finalize(() => this.loading = false)).subscribe({
      next: (response) => {
        this.bookings = response.data ?? [];
        this.error = response.success ? '' : response.message;
      },
      error: () => { this.error = 'Could not load your bookings. Please try again.'; },
    });
  }
}
