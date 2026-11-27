import { BookingPaymentSummaryComponent } from '../../../../shared/components/booking-payment-summary/booking-payment-summary.component';
import {
  TranslationPipe,
  LocalDatePipe,
  LanguageService,
} from '../../../../core/i18n/language';
import { inject as injectLanguage } from '@angular/core';
import { PaymentReceiptsComponent } from '../../../../shared/components/payment-receipts/payment-receipts.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, Subscription, switchMap, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import {
  BookingIdentityDocument,
  BookingService,
  IDENTITY_DOCUMENT_TYPES,
} from '../../../../core/services/booking.service';
import { Booking } from '../models/booking.model';

@Component({
  standalone: true,
  imports: [BookingPaymentSummaryComponent,
    TranslationPipe,
    LocalDatePipe,
    CommonModule,
    FormsModule,
    RouterLink,
    PaymentReceiptsComponent,
  ],
  templateUrl: './booking-details.component.html',
  styleUrl: './booking-details.component.css',
})
export class BookingDetailsComponent implements OnInit, OnDestroy {
  readonly language = injectLanguage(LanguageService);
  @ViewChild('identityDialog', { static: true })
  private identityDialog!: ElementRef<HTMLDialogElement>;
  private readonly service = inject(BookingService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly bookingId = Number(
    inject(ActivatedRoute).snapshot.paramMap.get('bookingId'),
  );
  booking: Booking | null = null;
  readonly documentTypes = IDENTITY_DOCUMENT_TYPES;
  documentType = '';
  otherDocumentType = '';
  selectedFiles: File[] = [];
  confirmationIdentity: BookingIdentityDocument | null = null;
  confirmationLoading = false;
  savingConfirmation = false;
  advanceMethod = 'Cash';
  cashReceived = false;
  get canUploadIdentity(): boolean {
    return (
      !!this.booking?.canManageConfirmation &&
      !this.confirmationLoading &&
      (!this.confirmationIdentity || this.confirmationIdentity.status === 'ReuploadRequested') &&
      (this.booking.status === 'Approved' ||
        (this.booking.status === 'Confirmed' &&
          this.confirmationIdentity?.status === 'ReuploadRequested'))
    );
  }

  chooseFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const incoming = Array.from(input.files ?? []);
    const combined = [...this.selectedFiles];
    for (const file of incoming) {
      if (!combined.some(existing => existing.name === file.name && existing.size === file.size && existing.lastModified === file.lastModified)) combined.push(file);
    }
    if (combined.length > 2) this.error = 'Upload a maximum of two files for the same document type.';
    else { this.selectedFiles = combined; this.error = ''; }
    input.value = '';
  }

  removeSelectedFile(index: number): void { this.selectedFiles.splice(index, 1); }

  uploadCustomerIdentity(): void {
    if (!this.canUploadIdentity || this.savingConfirmation) return;
    this.error = '';
    if (
      !this.documentType ||
      (this.documentType === 'Other' && !this.otherDocumentType.trim()) ||
      this.selectedFiles.length < 1 ||
      this.selectedFiles.length > 2 ||
      this.selectedFiles.some((f) => f.size === 0 || f.size > 5 * 1024 * 1024)
    ) {
      this.error =
        'Select a document type and one or two PDF, JPG or PNG files up to 5 MB each.';
      return;
    }
    this.savingConfirmation = true;
    this.service
      .uploadIdentity(
        this.bookingId,
        this.selectedFiles,
        this.documentType,
        this.otherDocumentType,
        true,
      )
      .pipe(finalize(() => (this.savingConfirmation = false)))
      .subscribe({
        next: (r) => {
          this.confirmationIdentity = r.data;
          this.selectedFiles = [];
          this.notice = 'Customer ID proof uploaded successfully.';
          this.load();
        },
        error: (e) => {
          this.error = e.error?.message ?? 'Could not upload ID proof.';
        },
      });
  }

  async collectAdvance(): Promise<void> {
    if (
      !this.booking?.canManageConfirmation ||
      this.booking.status !== 'Approved' ||
      !this.confirmationIdentity ||
      this.confirmationIdentity.status === 'ReuploadRequested' ||
      this.savingConfirmation
    )
      return;
    const amount = this.booking.advanceAmount;
    if (this.advanceMethod === 'Cash' && !this.cashReceived) return;
    if (this.advanceMethod === 'Cash' && this.booking.hasPendingAdvanceOrder)
      return;
    this.savingConfirmation = true;
    if (this.advanceMethod === 'Cash') {
      const result = await Swal.fire({
        title: this.language.translate('Record cash advance?'),
        text:
          this.language.translate(
            'Confirm only after physically receiving the full advance amount.',
          ) +
          ' ₹' +
          amount.toLocaleString('en-IN'),
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: this.language.translate(
          'Cash received — confirm booking',
        ),
      });
      if (!result.isConfirmed) {
        this.savingConfirmation = false;
        return;
      }
    }
    this.error = '';
    const request =
      this.advanceMethod === 'Cash'
        ? this.service.collectCashAdvance(this.bookingId, amount)
        : this.service.sendAdvanceReminder(this.bookingId);
    request.pipe(finalize(() => (this.savingConfirmation = false))).subscribe({
      next: (r) => {
        this.notice = r.message;
        this.cashReceived = false;
        this.load();
      },
      error: (e) => {
        this.error = e.error?.message ?? 'Could not process the advance.';
        this.load();
      },
    });
  }
  get canCheckIn(): boolean {
    return this.booking?.canCheckIn === true;
  }

  checkIn(): void {
    if (!this.canCheckIn || this.deciding) return;
    this.deciding = true;
    this.error = '';
    this.service
      .checkIn(this.bookingId)
      .pipe(finalize(() => (this.deciding = false)))
      .subscribe({
        next: (response) => {
          this.notice = response.message;
          this.load();
        },
        error: (error) => {
          this.error = error.error?.message ?? 'Could not check in.';
        },
      });
  }
  loading = false;
  deciding = false;
  error = '';
  notice = '';
  identity: BookingIdentityDocument | null = null;
  identityIndex = 0;
  identityPreview: SafeResourceUrl | null = null;
  identityImage: string | null = null;
  identityLoading = false;
  downloadingIdentity = false;
  identityError = '';
  reviewingIdentity = false;
  reuploadReason = '';
  showReuploadReason = false;
  private previewUrl: string | null = null;
  private identityRequest?: Subscription;

  ngOnDestroy(): void {
    this.clearIdentity();
  }

  downloadIdentity(index = 0): void {
    if (!this.booking?.hasIdentityDocument || this.downloadingIdentity) return;

    this.downloadingIdentity = true;
    let downloadFileName = 'identity-document';

    this.service
      .getIdentity(this.bookingId, false)
      .pipe(
        switchMap((response) => {
          const document = response.data;
          if (!document) {
            return throwError(
              () => new Error('No ID proof has been uploaded.'),
            );
          }

          const selectedFile =
            document.files[index] ??
            (index === 0
              ? {
                  id: document.id,
                  fileName: document.fileName,
                  contentType: document.contentType,
                }
              : null);

          if (!selectedFile) {
            return throwError(
              () => new Error('The selected document file is unavailable.'),
            );
          }

          downloadFileName = selectedFile.fileName || 'identity-document';
          return this.service.getIdentityContent(
            this.bookingId,
            selectedFile.id,
          );
        }),
        finalize(() => (this.downloadingIdentity = false)),
      )
      .subscribe({
        next: (file) => {
          const safeFileName =
            downloadFileName.replace(/[\\/:*?"<>|]/g, '_').trim() ||
            'identity-document';
          const objectUrl = URL.createObjectURL(file);
          const link = document.createElement('a');

          link.href = objectUrl;
          link.download = safeFileName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          link.remove();

          window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        },
        error: (error) => {
          this.error =
            error.error?.message ??
            error.message ??
            'Could not download the ID proof.';
        },
      });
  }

  openIdentity(index = 0): void {
    this.clearIdentity();
    this.identityIndex = index;
    if (!this.identityDialog.nativeElement.open)
      this.identityDialog.nativeElement.showModal();
    this.identityLoading = true;
    this.identityRequest = this.service
      .getIdentity(this.bookingId, false)
      .pipe(
        switchMap((response) => {
          this.identity = response.data;
          return this.identity
            ? this.service.getIdentityContent(
                this.bookingId,
                this.identity.files[index]?.id ?? this.identity.id,
              )
            : throwError(() => new Error('No ID proof has been uploaded.'));
        }),
        finalize(() => (this.identityLoading = false)),
      )
      .subscribe({
        next: (file) => {
          this.previewUrl = URL.createObjectURL(file);
          if (file.type.startsWith('image/'))
            this.identityImage = this.previewUrl;
          else
            this.identityPreview =
              this.sanitizer.bypassSecurityTrustResourceUrl(this.previewUrl);
        },
        error: () => {
          this.identityError = this.identity
            ? 'Could not load the ID proof.'
            : 'No ID proof is available.';
        },
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
    this.service
      .reviewIdentity(
        this.bookingId,
        this.identity.id,
        verified,
        verified ? undefined : reason,
      )
      .pipe(finalize(() => (this.reviewingIdentity = false)))
      .subscribe({
        next: (response) => {
          this.notice = response.message;
          this.closeIdentity();
        },
        error: (error) => {
          this.identityError =
            error.error?.message ?? 'Could not save the ID review.';
        },
      });
  }

  get canDecide(): boolean {
    return (
      !!this.booking?.canDecide &&
      this.booking.status === 'Pending' &&
      Date.parse(this.booking.ownerDeadline) > Date.now()
    );
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
    this.service
      .getBookingById(this.bookingId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.booking = response.data;
          if (this.booking.hasPendingAdvanceOrder)
            this.advanceMethod = 'Online';
          this.confirmationIdentity = null;
          this.confirmationLoading = true;
          this.service
            .getIdentity(this.bookingId, false)
            .pipe(finalize(() => (this.confirmationLoading = false)))
            .subscribe({
              next: (r) => {
                this.confirmationIdentity = r.data;
              },
              error: () => {
                this.error =
                  'Could not load ID proof status. Refresh before collecting payment.';
              },
            });
        },
        error: (error) => {
          this.booking = null;
          this.error =
            error.status === 403
              ? 'You do not have access to this booking.'
              : (error.error?.message ?? 'Could not load this booking.');
        },
      });
  }

  async decide(approve: boolean): Promise<void> {
    if (!this.canDecide || this.deciding) return;
    this.deciding = true;
    const dialog = approve
      ? await Swal.fire({
          title: this.language.translate('Approve booking?'),
          text: this.language.translate(
            'The guest will have 24 hours to confirm.',
          ),
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: this.language.translate('Approve booking'),
        })
      : await Swal.fire({
          title: this.language.translate('Reject booking?'),
          input: 'textarea',
          inputLabel: this.language.translate('Reason shared with the guest'),
          inputAttributes: { maxlength: '1000' },
          showCancelButton: true,
          confirmButtonText: this.language.translate('Reject booking'),
          inputValidator: (value: string) =>
            value.trim() ? '' : 'Enter a rejection reason.',
        });
    if (!dialog.isConfirmed || !this.canDecide) {
      this.deciding = false;
      return;
    }
    this.error = '';
    this.notice = '';
    const request = approve
      ? this.service.approveBooking(this.bookingId)
      : this.service.rejectBooking(this.bookingId, String(dialog.value).trim());
    request.pipe(finalize(() => (this.deciding = false))).subscribe({
      next: (response) => {
        this.notice = response.message;
        this.load();
      },
      error: (error) => {
        this.error =
          error.status === 403
            ? 'You do not have permission to decide this booking.'
            : (error.error?.message ?? 'Could not save the booking decision.');
        if (error.status === 409 || error.status === 0 || error.status >= 500)
          this.load();
      },
    });
  }
}
