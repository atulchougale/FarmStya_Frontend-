import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { BookingSubmissionService, SubmittedBooking } from '../../../core/services/booking-submission.service';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <main>
      <header><h1>My Bookings</h1><a routerLink="/booking">Start a booking</a></header>
      <p *ngIf="loading" role="status">Loading bookings…</p>
      <p *ngIf="error" role="alert">{{ error }} <button type="button" (click)="load()">Retry</button></p>
      <p *ngIf="!loading && !error && !bookings.length">Your booking requests will appear here.</p>
      <article *ngFor="let booking of bookings" [class.selected]="booking.bookingReference === selectedReference">
        <h2>{{ booking.bookingReference }}</h2>
        <p>{{ booking.status === 'Pending' ? 'Awaiting farmhouse approval' : booking.status }}</p>
        <p>{{ booking.checkInDate | date:'d MMM yyyy' }} to {{ booking.checkOutDate | date:'d MMM yyyy' }}</p>
        <p>Total {{ booking.totalAmount | currency:booking.currencyCode }} · Advance {{ booking.advanceAmount | currency:booking.currencyCode }}</p>
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
