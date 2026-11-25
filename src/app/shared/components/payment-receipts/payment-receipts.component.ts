import { TranslationPipe } from '../../../core/i18n/language';
import { AlertService } from '../../../core/services/alert.service';
import { inject } from '@angular/core';
import { VoucherIconComponent } from '../voucher-icon/voucher-icon.component';
import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { finalize, Subscription } from 'rxjs';
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
  imports: [TranslationPipe, CommonModule, VoucherIconComponent],
  template: `
    <section *ngIf="loading || receipts.length || error" [class.mt-3]="!compact" [class.compact-receipts]="compact">
      <h3 *ngIf="!compact" class="h6">{{ 'Payment receipts' | t }}</h3>
      <p *ngIf="loading" role="status"><span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>{{ 'Loading receipts…' | t }}</p>
      <p *ngIf="error" class="text-danger" role="alert">{{ (error) | t }}</p>
      <div class="d-flex flex-wrap gap-2">
        <button *ngFor="let receipt of receipts" type="button" class="btn btn-outline-success"
          [disabled]="downloading !== null" (click)="download(receipt)">
<app-voucher-icon name="pdf"></app-voucher-icon> <ng-container *ngIf="compact; else standardReceiptLabel">{{ (downloading === receipt.receiptId ? 'Preparing PDF…' : receipt.paymentType === 'Advance' ? 'Advance Receipt PDF' : 'Final Receipt PDF') | t }}</ng-container>
          <ng-template #standardReceiptLabel>{{ '{p0} · PDF' | t:{p0: (downloading === receipt.receiptId ? 'Preparing PDF…' : receipt.paymentType === 'Advance' ? 'Advance receipt' : 'Final payment receipt')} }}</ng-template></button>
      </div>
    </section>
  `,
  styles: [`
    .compact-receipts { padding:var(--space-2); }
    .compact-receipts .btn { display:inline-flex; align-items:center; justify-content:center; gap:var(--space-1); flex:0 1 248px; min-height:44px; padding:var(--space-1) var(--space-2); font-size:13px; font-weight:700; border-color:var(--primary-500); color:var(--primary-700); background:var(--surface); border-radius:8px; }
    @media(min-width:1001px) {
      .compact-receipts { padding:0 var(--space-1) var(--space-1); }
      .compact-receipts .btn { min-height:40px; padding:var(--space-1) var(--space-2); font-size:13px; }
    }
    .compact-receipts>div { justify-content:center; }
    .compact-receipts app-voucher-icon { font-size:26px; }
    .compact-receipts .btn:hover { background:var(--primary-50); }
    .compact-receipts .btn:focus-visible { outline:3px solid var(--primary-400); outline-offset:2px; }
  `]
})
export class PaymentReceiptsComponent implements OnChanges, OnDestroy {
  private readonly alerts=inject(AlertService);
  @Input({ required: true }) bookingId!: number;
  @Input() customer = false;
  @Input() compact = false;
  @Input() bookingStatus = '';
  receipts: Receipt[] = [];
  downloading: number | null = null;
  error = '';
  loading = false;
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
    this.loading = true;
    this.error = '';
    this.downloading = null;
    this.requests.add(this.http.get<ApiResponse<Receipt[]>>(this.url).pipe(finalize(() => this.loading = false)).subscribe({
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
        void this.alerts.error('Receipt download failed',this.error);
        this.downloading = null;
      }
    }));
  }

  ngOnDestroy(): void { this.requests.unsubscribe(); }
}
