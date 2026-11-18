import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';

interface Receipt {
  receiptId: number;
  receiptNumber: string;
  paymentType: string;
  amount: number;
  issuedAt: string;
}

@Component({
  selector: 'app-payment-receipts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section *ngIf="receipts.length || error" class="mt-3">
      <h3 class="h6">Payment receipts</h3>
      <p *ngIf="error" class="text-danger" role="alert">{{ error }}</p>
      <div class="d-flex flex-wrap gap-2">
        <button *ngFor="let receipt of receipts" type="button" class="btn btn-outline-success"
          [disabled]="downloading !== null" (click)="download(receipt)">
          {{ downloading === receipt.receiptId ? 'Preparing PDF…' : receipt.paymentType === 'Advance' ? 'Advance receipt' : 'Final payment receipt' }} · PDF
        </button>
      </div>
    </section>
  `
})
export class PaymentReceiptsComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) bookingId!: number;
  @Input() customer = false;
  @Input() bookingStatus = '';
  receipts: Receipt[] = [];
  downloading: number | null = null;
  error = '';
  private requests = new Subscription();
  constructor(private readonly http: HttpClient) {}

  private get url(): string {
    const path = this.customer ? 'my-bookings/' : '';
    return `${environment.apiUrl}/booking/${path}${this.bookingId}/receipts`;
  }

  ngOnChanges(): void {
    this.requests.unsubscribe();
    this.requests = new Subscription();
    this.receipts = [];
    this.error = '';
    this.downloading = null;
    this.requests.add(this.http.get<ApiResponse<Receipt[]>>(this.url).subscribe({
      next: response => { this.receipts = response.data ?? []; },
      error: () => { this.error = 'Could not load payment receipts. Reopen booking details to retry.'; }
    }));
  }

  download(receipt: Receipt): void {
    if (this.downloading !== null) return;
    this.error = '';
    this.downloading = receipt.receiptId;
    this.requests.add(this.http.get(`${this.url}/${receipt.receiptId}/pdf`, { responseType: 'blob' }).subscribe({
      next: file => {
        const url = URL.createObjectURL(file);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${receipt.receiptNumber}.pdf`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        this.downloading = null;
      },
      error: (error: HttpErrorResponse) => {
        this.error = error.status === 401 ? 'Your session has expired. Please sign in to download the receipt.'
          : 'Could not download the receipt. Please try again.';
        this.downloading = null;
      }
    }));
  }

  ngOnDestroy(): void { this.requests.unsubscribe(); }
}
