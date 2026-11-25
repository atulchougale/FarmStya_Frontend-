import { TranslationPipe, LocalDatePipe } from '../../../../core/i18n/language';
import { PaymentReceiptsComponent } from '../../../../shared/components/payment-receipts/payment-receipts.component';

import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { BookingIdentityDocument, BookingService, CheckoutBalance, IDENTITY_DOCUMENT_TYPES } from '../../../../core/services/booking.service';
import { AlertService } from '../../../../core/services/alert.service';
import { PublicSiteService } from '../../../../core/services/public-site.service';
import { VoucherIconComponent } from '../../../../shared/components/voucher-icon/voucher-icon.component';
import { TokenService } from '../../../../core/services/token.service';
import { inject } from '@angular/core';
import { Booking } from '../../../admin/Booking/models/booking.model';
import { RazorpayCheckoutService } from '../../../../core/services/razorpay-checkout.service';

@Component({
  selector: 'app-customer-booking-details',
  standalone: true,
  imports: [FormsModule, TranslationPipe, LocalDatePipe, CommonModule, RouterLink, PaymentReceiptsComponent, VoucherIconComponent],
  templateUrl: './customer-booking-details.component.html',
  styleUrl: './customer-booking-details.component.css'
})
export class CustomerBookingDetailsComponent implements OnInit, OnDestroy {
  private readonly alerts = inject(AlertService);
  private readonly site = inject(PublicSiteService);
  private readonly tokens = inject(TokenService);
  get farmHouseName(): string { return this.site.currentFarmHouseName ?? this.tokens.getCurrentUser()?.farmHouseName ?? ''; }
  get farmHouseLocation(): string { return [this.site.currentSite?.taluka,this.site.currentSite?.district].filter(Boolean).join(' · '); }
  bookingTypeLabel(type: string): string {
    return ({ BookingOnly: 'Booking Only', NormalEvent: 'Normal Event', DecorationEvent: 'Decoration Event' } as Record<string,string>)[type] ?? type;
  }
  get bookingJourney() { return [...(this.selectedBooking?.statusHistory ?? [])].sort((a,b) => a.createdDate.localeCompare(b.createdDate)); }
  statusLabel(status: string): string { return status === 'CheckedIn' ? 'Checked In' : status === 'CheckedOut' ? 'Checked Out' : status; }
  @ViewChild('documentDialog', { static: true }) private documentDialog!: ElementRef<HTMLDialogElement>;
  readonly documentTypes = IDENTITY_DOCUMENT_TYPES;
  documentType = '';
  otherDocumentType = '';
  selectedFiles: File[] = [];
  previewIndex = 0;
  previewImage: string | null = null;
  previewPdf: SafeResourceUrl | null = null;
  previewLoading = false;
  previewError = '';
  private previewUrl: string | null = null;
  private previewSession = 0;

  async viewDocument(index = 0): Promise<void> {
    const bookingId = this.selectedBookingId;
    const document = this.identity;
    if (!bookingId || !document) return;
    this.clearPreview();
    this.previewIndex = index;
    const selected = document.files?.[index] ?? document;
    const session = this.previewSession;
    if (!this.documentDialog.nativeElement.open) this.documentDialog.nativeElement.showModal();
    this.previewLoading = true;
    try {
      const file = await firstValueFrom(this.bookingService.getIdentityContent(bookingId, selected.id, true));
      if (session !== this.previewSession) return;
      this.previewUrl = URL.createObjectURL(file);
      if (file.type.startsWith('image/')) this.previewImage = this.previewUrl;
      else this.previewPdf = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewUrl);
    } catch {
      if (session === this.previewSession) this.previewError = 'Could not load your document. Close and try again.';
    } finally {
      if (session === this.previewSession) this.previewLoading = false;
    }
  }

  closeDocument(): void {
    this.documentDialog.nativeElement.close();
  }

  clearPreview(): void {
    this.previewSession++;
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
    this.previewImage = null;
    this.previewPdf = null;
    this.previewError = '';
    this.previewLoading = false;
  }

  // View Details
  selectedBooking: Booking | null = null;
  selectedBookingId: number | null = null;

  detailsLoading = false;
  detailsError = '';
  identity: BookingIdentityDocument | null = null;
  identityLoading = false;
  uploadingIdentity = false;
  identityError = '';
  confirmView = false;
  openingCheckout = false;
  verifyingAdvance = false;
  paymentMessage = '';
  paymentError = '';
  checkoutBalance?: CheckoutBalance;
  checkoutNotice = '';

  async payCheckout(verifyOnly = false): Promise<void> {
    const booking = this.selectedBooking;
    if (!booking || this.openingCheckout || this.checkoutBalance?.paymentStatus !== 'Pending') return;
    const session = this.detailSession;
    this.openingCheckout = true;
    this.checkoutNotice = '';
    try {
      if (!verifyOnly) {
        const order = await firstValueFrom(this.bookingService.checkoutOrder(booking.bookingId));
        const open = await this.razorpayCheckout.prepare(order.data, booking.bookingReference);
        if (session !== this.detailSession) return;
        const result = await open();
        if (session !== this.detailSession) return;
        if (result.status !== 'received') {
          this.checkoutNotice = result.status === 'failed' ? 'Payment failed. Please retry.' : 'Payment window closed.';
          return;
        }
      }
      const result = await firstValueFrom(this.bookingService.verifyCheckout(booking.bookingId));
      if (session !== this.detailSession) return;
      this.checkoutNotice = result.message;
      if (result.success) {
        this.selectedBooking = { ...booking, status: 'CheckedOut' };
        void this.alerts.success('Checkout completed','Your payment is verified and checkout is complete. You can download your receipts and share your feedback.');
        this.checkoutBalance = undefined;
        this.bookingService.getMyBookingById(booking.bookingId).subscribe({
          next: details => {
            if (session === this.detailSession && details.data) this.selectedBooking = details.data;
          },
          error: () => {
            if (session === this.detailSession) this.checkoutNotice = 'Checkout completed. Reopen booking details to refresh the dates.';
          }
        });
      } else {
        void this.alerts.warning('Checkout could not be confirmed',this.checkoutNotice || 'Payment verification pending');
      }
    } catch (error) {
      if (session === this.detailSession) {
        this.checkoutNotice = error instanceof HttpErrorResponse
          ? error.error?.message ?? 'Could not complete checkout.'
          : error instanceof Error ? error.message : 'Could not complete checkout.';
        void this.alerts.warning('Checkout could not be confirmed',this.checkoutNotice);
      }
    } finally {
      if (session === this.detailSession) {
        this.openingCheckout = false;
      }
    }
  }
  private detailSession = 0;
  private readonly receivedPayments = new Set<number>();

  constructor(
    private readonly bookingService: BookingService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer,
    private readonly razorpayCheckout: RazorpayCheckoutService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('bookingId'));
    if (!Number.isSafeInteger(id) || id < 1) {
      this.detailsError = 'Invalid booking reference.';
      return;
    }
    this.viewBookingDetails(id);
  }

  ngOnDestroy(): void {
    this.clearPreview();
    this.detailSession++;
  }

  // View Complete Booking Details
  viewBookingDetails(bookingId: number, confirmView = false): void {
    const session = ++this.detailSession;
    this.confirmView = confirmView;
    this.paymentMessage = '';
    this.paymentError = '';
    this.checkoutBalance = undefined;
    this.checkoutNotice = '';
    this.openingCheckout = false;
    this.verifyingAdvance = false;
    this.identity = null;
    this.identityError = '';
    this.identityLoading = false;
    this.uploadingIdentity = false;
    this.selectedBookingId = bookingId;
    this.selectedBooking = null;
    this.detailsError = '';
    this.detailsLoading = true;

    this.bookingService
      .getMyBookingById(bookingId)
      .subscribe({

        next: (response) => {

          if (
            this.detailSession !== session
          ) {
            return;
          }

          if (response.success && response.data) {
            this.selectedBooking = response.data;
            this.confirmView = response.data.status === 'Approved';
            if (response.data.status === 'CheckedIn') {
              const session = this.detailSession;
              this.bookingService.checkoutBalance(response.data.bookingId, true).subscribe({
                next: result => {
                  if (session === this.detailSession) this.checkoutBalance = result.data;
                },
                error: () => {
                  if (session === this.detailSession) this.checkoutNotice = 'Could not load the checkout balance.';
                }
              });
            }
            this.loadIdentity(bookingId, session);
          } else {
            this.detailsError =
              response.message || 'Unable to load booking details.';
          }

          this.detailsLoading = false;
        },

        error: (error: HttpErrorResponse) => {

          if (this.detailSession !== session) {
            return;
          }

          this.detailsError =
            error.error?.message ||
            'Unable to load booking details.';

          this.detailsLoading = false;
        }
      });
  }

  get canUploadIdentity(): boolean {
    const booking = this.selectedBooking;
    return (booking?.status === 'Approved' && Date.parse(booking.customerDeadline ?? '') > Date.now())
      || (booking?.status === 'Confirmed' && this.identity?.status === 'ReuploadRequested');
  }

  get paymentReceived(): boolean {
    return this.selectedBookingId !== null && this.receivedPayments.has(this.selectedBookingId);
  }

  async payAdvance(): Promise<void> {
    const booking = this.selectedBooking;
    if (!booking || booking.status !== 'Approved' || !this.canUploadIdentity ||
        this.identity?.status !== 'Uploaded' || this.selectedFiles.length > 0 || this.uploadingIdentity || this.openingCheckout || this.paymentReceived) return;

    const session = this.detailSession;
    this.openingCheckout = true;
    this.paymentMessage = '';
    this.paymentError = '';
    try {
      const response = await firstValueFrom(this.bookingService.createAdvanceOrder(booking.bookingId));
      if (!response.success || !response.data) throw new Error(response.message || 'Could not prepare the test order.');
      const openCheckout = await this.razorpayCheckout.prepare(response.data, booking.bookingReference);
      if (this.detailSession !== session) return;

      if (this.detailSession !== session) return;

      const result = await openCheckout();
      if (this.detailSession !== session) return;
      if (result.status === 'received') {
        this.receivedPayments.add(booking.bookingId);
        await this.verifyAdvance();
      } else if (result.status === 'failed') {
        this.paymentError = 'The test payment failed. You can try again.';
        void this.alerts.error('Payment failed',this.paymentError);
      } else {
        this.paymentMessage = 'Checkout closed. You can open it again to try the test payment.';
      }
    } catch (error) {
      if (this.detailSession !== session) return;
      this.paymentError = error instanceof HttpErrorResponse
        ? error.error?.message ?? 'Could not prepare the test order.'
        : error instanceof Error ? error.message : 'Could not open Razorpay Checkout.';
      void this.alerts.error('Could not start payment',this.paymentError);
    } finally {
      if (this.detailSession === session) {
        this.openingCheckout = false;
      }
    }
  }

  async verifyAdvance(): Promise<void> {
    const booking = this.selectedBooking;
    if (!booking || this.verifyingAdvance) return;
    const session = this.detailSession;
    this.verifyingAdvance = true;
    this.paymentError = '';
    this.paymentMessage = '';
    try {
      const response = await firstValueFrom(this.bookingService.verifyAdvance(booking.bookingId));
      if (this.detailSession !== session) return;
      if (!response.success) throw new Error(response.message);
      this.selectedBooking = { ...booking, status: 'Confirmed' };
      this.paymentMessage = 'Test advance verified. Your booking is confirmed.';
      void this.alerts.success('Booking confirmed','Your advance payment is verified. Bring the original ID documents you uploaded when checking in.');
    } catch (error) {
      if (this.detailSession !== session) return;
      this.paymentError = error instanceof HttpErrorResponse
        ? error.error?.message ?? 'Could not verify the test advance.'
        : error instanceof Error ? error.message : 'Could not verify the test advance.';
      void this.alerts.warning('Payment verification pending',this.paymentError);
    } finally {
      if (this.detailSession === session) this.verifyingAdvance = false;
    }
  }

  private loadIdentity(bookingId: number, session: number): void {
    this.identityLoading = true;
    this.bookingService.getIdentity(bookingId, true).subscribe({
      next: (response) => {
        if (this.detailSession !== session) return;
        this.identity = response.data;
        this.documentType = response.data?.documentType === 'ID proof' ? '' : response.data?.documentType ?? '';
        this.otherDocumentType = response.data?.otherDocumentType ?? '';
        this.identityLoading = false;
      },
      error: () => {
        if (this.detailSession !== session) return;
        this.identityError = 'Could not load your ID proof status.';
        this.identityLoading = false;
      },
    });
  }

  selectIdentityFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';
    this.identityError = '';
    if (this.selectedFiles.length + files.length > 2) {
      this.identityError = 'Upload a maximum of two files for the same document type.';
      return;
    }
    if (files.some(file => file.size <= 0 || file.size > 5 * 1024 * 1024 ||
        !['application/pdf', 'image/jpeg', 'image/png'].includes(file.type))) {
      this.identityError = 'Each file must be a PDF, JPG or PNG up to 5 MB.';
      return;
    }
    this.selectedFiles = [...this.selectedFiles, ...files];
  }

  uploadIdentity(): void {
    if (!this.selectedBookingId || !this.canUploadIdentity || this.uploadingIdentity ||
        !this.selectedFiles.length || !this.documentType) return;
    if (this.documentType === 'Other' && !this.otherDocumentType.trim()) {
      this.identityError = 'Enter the document type.';
      return;
    }
    const session = this.detailSession;
    this.identityError = '';
    this.uploadingIdentity = true;
    this.bookingService.uploadIdentity(this.selectedBookingId, this.selectedFiles, this.documentType, this.otherDocumentType).subscribe({
      next: response => {
        if (session !== this.detailSession) return;
        if (!response.success || !response.data) {
          this.uploadingIdentity=false;
          this.identityError=response.message || 'Could not upload the ID proof.';
          void this.alerts.error('Document upload failed',this.identityError);
          return;
        }
        this.identity = response.data;
        this.selectedFiles = [];
        this.alerts.toast('Documents uploaded successfully');
        this.uploadingIdentity = false;
      },
      error: error => {
        if (session !== this.detailSession) return;
        this.identityError = error.error?.message ?? 'Could not upload the ID proof.';
        void this.alerts.error('Document upload failed',this.identityError);
        this.uploadingIdentity = false;
      }
    });
  }

  closeDetails(): void {
    void this.router.navigate(['/my-bookings']);
  }
}
