import { PaymentReceiptsComponent } from '../../../../shared/components/payment-receipts/payment-receipts.component';

import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { BookingIdentityDocument, BookingService, CheckoutBalance } from '../../../../core/services/booking.service';
import { Booking } from '../../../admin/Booking/models/booking.model';
import { RazorpayCheckoutService } from '../../../../core/services/razorpay-checkout.service';

@Component({
  selector: 'app-customer-booking-details',
  standalone: true,
  imports: [CommonModule, RouterLink, PaymentReceiptsComponent],
  templateUrl: './customer-booking-details.component.html',
  styleUrl: './customer-booking-details.component.css'
})
export class CustomerBookingDetailsComponent implements OnInit, OnDestroy {
  @ViewChild('documentDialog', { static: true }) private documentDialog!: ElementRef<HTMLDialogElement>;
  previewImage: string | null = null;
  previewPdf: SafeResourceUrl | null = null;
  previewLoading = false;
  previewError = '';
  private previewUrl: string | null = null;
  private previewSession = 0;

  async viewDocument(): Promise<void> {
    const bookingId = this.selectedBookingId;
    const document = this.identity;
    if (!bookingId || !document) return;
    this.clearPreview();
    const session = this.previewSession;
    this.documentDialog.nativeElement.showModal();
    this.previewLoading = true;
    try {
      const file = await firstValueFrom(this.bookingService.getIdentityContent(bookingId, document.id, true));
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
        this.checkoutBalance = undefined;
        this.bookingService.getMyBookingById(booking.bookingId).subscribe({
          next: details => {
            if (session === this.detailSession && details.data) this.selectedBooking = details.data;
          },
          error: () => {
            if (session === this.detailSession) this.checkoutNotice = 'Checkout completed. Reopen booking details to refresh the dates.';
          }
        });
      }
    } catch (error) {
      if (session === this.detailSession) {
        this.checkoutNotice = error instanceof HttpErrorResponse
          ? error.error?.message ?? 'Could not complete checkout.'
          : error instanceof Error ? error.message : 'Could not complete checkout.';
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
        this.identity?.status !== 'Uploaded' || this.uploadingIdentity || this.openingCheckout || this.paymentReceived) return;

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
      } else {
        this.paymentMessage = 'Checkout closed. You can open it again to try the test payment.';
      }
    } catch (error) {
      if (this.detailSession !== session) return;
      this.paymentError = error instanceof HttpErrorResponse
        ? error.error?.message ?? 'Could not prepare the test order.'
        : error instanceof Error ? error.message : 'Could not open Razorpay Checkout.';
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
    } catch (error) {
      if (this.detailSession !== session) return;
      this.paymentError = error instanceof HttpErrorResponse
        ? error.error?.message ?? 'Could not verify the test advance.'
        : error instanceof Error ? error.message : 'Could not verify the test advance.';
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
        this.identityLoading = false;
      },
      error: () => {
        if (this.detailSession !== session) return;
        this.identityError = 'Could not load your ID proof status.';
        this.identityLoading = false;
      },
    });
  }

  uploadIdentity(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.selectedBookingId || !this.canUploadIdentity || this.uploadingIdentity) return;
    const session = this.detailSession;
    this.identityError = '';
    this.uploadingIdentity = true;
    this.bookingService.uploadIdentity(this.selectedBookingId, file).subscribe({
      next: (response) => {
        if (this.detailSession !== session) return;
        this.identity = response.data;
        this.uploadingIdentity = false;
      },
      error: (error) => {
        if (this.detailSession !== session) return;
        this.identityError = error.error?.message ?? 'Could not upload the ID proof.';
        this.uploadingIdentity = false;
      },
    });
  }

  closeDetails(): void {
    void this.router.navigate(['/my-bookings']);
  }
}
