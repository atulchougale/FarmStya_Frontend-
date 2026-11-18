import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import { BookingService, CheckoutBalance } from '../../../../core/services/booking.service';
import { Booking } from '../models/booking.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './checkout.component.html'
})
export class CheckoutComponent implements OnInit {
  private readonly service = inject(BookingService);
  readonly id = Number(inject(ActivatedRoute).snapshot.paramMap.get('bookingId'));
  booking?: Booking;
  balance?: CheckoutBalance;
  method = 'Cash';
  applyDiscount = false;
  discount: number | null = null;
  reason = '';
  busy = false;
  error = '';
  notice = '';

  get payable(): number {
    return Math.max(0, (this.balance?.payable ?? 0) - (this.applyDiscount ? this.discount ?? 0 : 0));
  }

  ngOnInit(): void {
    forkJoin([this.service.getBookingById(this.id), this.service.checkoutBalance(this.id)]).subscribe({
      next: ([booking, balance]) => { this.booking = booking.data; this.balance = balance.data; },
      error: error => { this.error = error.error?.message ?? 'Could not load checkout.'; }
    });
  }

  submit(): void {
    if (this.busy || !this.balance || this.balance.paymentStatus || this.booking?.status !== 'CheckedIn') return;
    const discount = this.applyDiscount ? this.discount ?? 0 : 0;
    if (this.applyDiscount && (discount <= 0 || discount > this.balance.payable || !this.reason.trim())) return;
    this.error = '';
    this.busy = true;
    this.service.submitCheckout(this.id, this.method, discount, this.applyDiscount ? this.reason.trim() : '')
      .pipe(finalize(() => this.busy = false)).subscribe({
        next: response => { this.notice = response.message; this.ngOnInit(); },
        error: error => { this.error = error.error?.message ?? 'Could not submit checkout.'; }
      });
  }
}
