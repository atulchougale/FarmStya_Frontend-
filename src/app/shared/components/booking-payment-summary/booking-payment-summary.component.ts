import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslationPipe, LocalDatePipe } from '../../../core/i18n/language';
import { Booking } from '../../../features/admin/Booking/models/booking.model';

export function bookingSettlementLabel(booking: Pick<Booking, 'totalAmount' | 'discountAmount' | 'totalPaid' | 'refundedAmount'>): string | null {
  const total = Math.round(booking.totalAmount * 100);
  const discount = Math.round((booking.discountAmount || 0) * 100);
  const paid = Math.round((booking.totalPaid || 0) * 100);
  if (total > 0 && discount >= total) return 'Fully Discounted';
  // A closed booking alone does not prove payment: refunds can reduce net paid.
  if (total > discount && paid >= total - discount && (booking.refundedAmount || 0) === 0) return 'Fully Paid';
  return null;
}

@Component({
  selector: 'app-booking-payment-summary', standalone: true,
  imports: [CommonModule, TranslationPipe, LocalDatePipe],
  template: `
    <section class="settlement" *ngIf="booking as item" aria-label="Payment summary">
      <strong class="settlement-badge" *ngIf="label">{{ label | t }}</strong>
      <p *ngIf="label === 'Fully Discounted'">{{ 'No payment required — Fully discounted' | t }}</p>
      <div class="settlement-row" *ngIf="item.discountAmount > 0"><span>{{ 'Final amount after discount' | t }}</span><strong>{{ finalAmount | currency:item.currencyCode }}</strong></div>
      <article *ngFor="let discount of item.discounts" class="discount-audit">
        <div class="settlement-row"><strong>{{ 'Discount' | t }}</strong><strong>{{ discount.amount | currency:item.currencyCode }}</strong></div>
        <p><span>{{ 'Discount reason' | t }}:</span> {{ discount.reason }}</p>
        <p><span>{{ 'Recorded by' | t }}:</span> {{ discount.enteredByName || ('User' | t) }} <span>(#{{ discount.enteredBy }})</span></p>
        <p><span>{{ 'Recorded on' | t }}:</span> {{ discount.createdDate | localDate:'d MMM yyyy, h:mm a' }}</p>
      </article>
    </section>`,
  styles: [`:host{display:block}.settlement{display:grid;gap:8px;margin-top:8px;font-size:13px;color:var(--bs-body-color,inherit)}.settlement:empty{display:none}.settlement-badge{justify-self:start;padding:4px 8px;border:1px solid currentColor;border-radius:8px;color:var(--bs-success,#198754)}.settlement p{margin:0;overflow-wrap:anywhere}.settlement-row{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}.discount-audit{display:grid;gap:8px;border-top:1px solid var(--bs-border-color,#dee2e6);padding-top:8px}.discount-audit p span{font-weight:600}`]
})
export class BookingPaymentSummaryComponent {
  @Input({required: true}) booking!: Booking;
  get label() { return bookingSettlementLabel(this.booking); }
  get finalAmount() { return Math.max(0, this.booking.totalAmount - (this.booking.discountAmount || 0)); }
}
