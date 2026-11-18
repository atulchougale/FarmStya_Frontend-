import { PaymentReceiptsComponent } from '../../../../shared/components/payment-receipts/payment-receipts.component';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, Subscription, switchMap, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { BookingIdentityDocument, BookingService } from '../../../../core/services/booking.service';
import { Booking } from '../models/booking.model';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, PaymentReceiptsComponent],
  templateUrl: './booking-details.component.html',
  styleUrl: './booking-details.component.css',
})
export class BookingDetailsComponent implements OnInit, OnDestroy {
  @ViewChild('identityDialog', { static: true }) private identityDialog!: ElementRef<HTMLDialogElement>;
  private readonly service = inject(BookingService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly bookingId = Number(inject(ActivatedRoute).snapshot.paramMap.get('bookingId'));
  booking: Booking | null = null;
  get canCheckIn(): boolean {
    return this.booking?.canCheckIn === true;
  }

  checkIn(): void {
    if (!this.canCheckIn || this.deciding) return;
    this.deciding = true;
    this.error = '';
    this.service.checkIn(this.bookingId).pipe(finalize(() => this.deciding = false)).subscribe({
      next: response => { this.notice = response.message; this.load(); },
      error: error => { this.error = error.error?.message ?? 'Could not check in.'; }
    });
  }
  loading = false;
  deciding = false;
  error = '';
  notice = '';
  identity: BookingIdentityDocument | null = null;
  identityPreview: SafeResourceUrl | null = null;
  identityImage: string | null = null;
  identityLoading = false;
  identityError = '';
  reviewingIdentity = false;
  reuploadReason = '';
  showReuploadReason = false;
  private previewUrl: string | null = null;
  private identityRequest?: Subscription;

  ngOnDestroy(): void {
    this.clearIdentity();
  }

  openIdentity(): void {
    this.clearIdentity();
    this.identityDialog.nativeElement.showModal();
    this.identityLoading = true;
    this.identityRequest = this.service.getIdentity(this.bookingId, false).pipe(
      switchMap(response => {
        this.identity = response.data;
        return this.identity
          ? this.service.getIdentityContent(this.bookingId, this.identity.id)
          : throwError(() => new Error('No ID proof has been uploaded.'));
      }),
      finalize(() => this.identityLoading = false),
    ).subscribe({
      next: (file) => {
        this.previewUrl = URL.createObjectURL(file);
        if (file.type.startsWith('image/')) this.identityImage = this.previewUrl;
        else this.identityPreview = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewUrl);
      },
      error: () => { this.identityError = this.identity ? 'Could not load the ID proof.' : 'No ID proof is available.'; },
    });
  }

  closeIdentity(): void {
    this.identityDialog.nativeElement.close();
  }

  clearIdentity(): void {
    this.identityRequest?.unsubscribe();
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = null;
    this.identityPreview = null;
    this.identityImage = null;
    this.identity = null;
    this.identityError = '';
    this.reuploadReason = '';
    this.showReuploadReason = false;
  }

  reviewIdentity(verified: boolean): void {
    if (this.identity?.status !== 'Uploaded' || this.reviewingIdentity) return;
    const reason = this.reuploadReason.trim();
    if (!verified && !reason) return;
    this.reviewingIdentity = true;
    this.identityError = '';
    this.service.reviewIdentity(this.bookingId, this.identity.id, verified, verified ? undefined : reason)
      .pipe(finalize(() => this.reviewingIdentity = false)).subscribe({
        next: (response) => { this.notice = response.message; this.closeIdentity(); },
        error: (error) => { this.identityError = error.error?.message ?? 'Could not save the ID review.'; },
      });
  }

  get canDecide(): boolean {
    return !!this.booking?.canDecide && this.booking.status === 'Pending' &&
      Date.parse(this.booking.ownerDeadline) > Date.now();
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (!Number.isSafeInteger(this.bookingId) || this.bookingId < 1) {
      this.error = 'Invalid booking reference.';
      return;
    }
    this.loading = true;
    this.service.getBookingById(this.bookingId).pipe(finalize(() => this.loading = false)).subscribe({
      next: (response) => { this.booking = response.data; },
      error: (error) => {
        this.booking = null;
        this.error = error.status === 403 ? 'You do not have access to this booking.'
          : error.error?.message ?? 'Could not load this booking.';
      },
    });
  }

  async decide(approve: boolean): Promise<void> {
    if (!this.canDecide || this.deciding) return;
    this.deciding = true;
    const dialog = approve
      ? await Swal.fire({ title: 'Approve booking?', text: 'The guest will have 24 hours to confirm.',
          icon: 'question', showCancelButton: true, confirmButtonText: 'Approve booking' })
      : await Swal.fire({ title: 'Reject booking?', input: 'textarea', inputLabel: 'Reason shared with the guest',
          inputAttributes: { maxlength: '1000' }, showCancelButton: true, confirmButtonText: 'Reject booking',
          inputValidator: (value: string) => value.trim() ? '' : 'Enter a rejection reason.' });
    if (!dialog.isConfirmed || !this.canDecide) {
      this.deciding = false;
      return;
    }
    this.error = '';
    this.notice = '';
    const request = approve ? this.service.approveBooking(this.bookingId)
      : this.service.rejectBooking(this.bookingId, String(dialog.value).trim());
    request.pipe(finalize(() => this.deciding = false)).subscribe({
      next: (response) => {
        this.notice = response.message;
        this.load();
      },
      error: (error) => {
        this.error = error.status === 403 ? 'You do not have permission to decide this booking.'
          : error.error?.message ?? 'Could not save the booking decision.';
        if (error.status === 409 || error.status === 0 || error.status >= 500) this.load();
      },
    });
  }
}
