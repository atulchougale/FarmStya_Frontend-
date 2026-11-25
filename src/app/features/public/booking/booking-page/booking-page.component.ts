import { AlertService } from '../../../../core/services/alert.service';
import { PublicSiteService } from '../../../../core/services/public-site.service';
import { VoucherIconComponent } from '../../../../shared/components/voucher-icon/voucher-icon.component';
import { ADMIN_BOOKING_CONTEXT } from '../../../../core/services/admin-booking-context';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslationPipe, LocalDatePipe, LanguageService } from '../../../../core/i18n/language';
import { inject as injectLanguage } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Component, OnInit, OnDestroy } from '@angular/core';
import Swal from 'sweetalert2';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { finalize, forkJoin, map, Observable, Subscription, throwError } from 'rxjs';

import { BookingCalendarService } from '../../../../core/services/booking-calendar.service';
import { BookingSubmissionService, SubmittedBooking } from '../../../../core/services/booking-submission.service';
import { BookingPricingService, BookingQuote, BookingRate } from '../../../../core/services/booking-pricing.service';

import { BookingCalendarMonthResponse } from '../models/booking-calendar-month-response.model';

import { CreateBookingDateReservationRequest } from '../models/create-booking-date-reservation-request.model';

import { CreateBookingDateReservationResponse } from '../models/create-booking-date-reservation-response.model';

import { ActiveBookingDateReservation } from '../models/active-booking-date-reservation.model';

type BookingType = 'BookingOnly' | 'NormalEvent' | 'DecorationEvent';

interface BookingSubmissionPayload {
  selectionId: string;
  reservationIds: number[];
  pricingVersion: string;
  pricing: BookingQuote;
  checkInDate: string;
  checkOutDate: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  adultCount: number;
  childrenCount: number;
  personCount: number;
  customerNotes: string;
  bookingType: BookingType;
  eventDates: string[];
  idempotencyKey: string;
}

interface BookingCalendarDay {
  date: Date;

  dateKey: string;

  dayNumber: number;

  isCurrentMonth: boolean;

  isPast: boolean;

  isToday: boolean;

  isCheckIn: boolean;

  isCheckOut: boolean;

  isInRange: boolean;

  isBooked: boolean;

  isReserved: boolean;

  isDisabled: boolean;

  status: string;
}

interface BookingCustomerDetails {
  fullName: string;

  mobileNumber: string;

  email: string;
}

interface BookingDraft {
  adultCount: number | null;
  childrenCount: number | null;
  bookingType: BookingType;
  eventDates: string[];
  currentStep: number;
  expiresAt: number;
}

@Component({
  selector: 'app-booking',

  standalone: true,

  imports: [VoucherIconComponent,TranslationPipe, LocalDatePipe, CommonModule, FormsModule, RouterLink],

  templateUrl: './booking-page.component.html',

  styleUrl: './booking-page.component.css',
})
export class BookingPageComponent implements OnInit, OnDestroy {
  private readonly admin = injectLanguage(ADMIN_BOOKING_CONTEXT, { optional: true });
  private readonly auth = injectLanguage(AuthService);
  readonly language = injectLanguage(LanguageService);
  private readonly alerts = injectLanguage(AlertService);
  private readonly publicSite = injectLanguage(PublicSiteService);
  get siteName(): string { return this.publicSite.currentFarmHouseName ?? 'FarmStay'; }
  get siteLocation(): string { return [this.publicSite.currentSite?.taluka,this.publicSite.currentSite?.district].filter(Boolean).join(' · '); }
  readonly summaryImage = '/assets/images/about/farmhouse-story.png';
  get selectedStayDays(): number {
    return this.checkInDate && this.checkOutDate ? Math.max(0,Math.round((this.parseDateKey(this.checkOutDate).getTime()-this.parseDateKey(this.checkInDate).getTime())/86400000)) : 0;
  }
  rateFor(key: string): BookingRate | undefined { return this.bookingRates.find(r => r.pricingKey === key); }
  get stepHeading(): string { return ['Your Details','Who is joining your stay?','Select Your Stay','Event Details','Review Your Booking','Review & Submit'][this.currentStep-1]; }
  nextCalendarDays: BookingCalendarDay[] = [];
  get calendarPanels() { return [
    { title: this.calendarMonth.toLocaleDateString(this.language.locale,{month:'long',year:'numeric'}), days:this.calendarDays },
    { title: new Date(this.calendarMonth.getFullYear(),this.calendarMonth.getMonth()+1,1).toLocaleDateString(this.language.locale,{month:'long',year:'numeric'}), days:this.nextCalendarDays }
  ]; }
  private getCalendarPair(month: number, year: number) {
    const next = new Date(year,month,1);
    return forkJoin([this.bookingCalendarService.getCalendarMonth(month,year),this.bookingCalendarService.getCalendarMonth(next.getMonth()+1,next.getFullYear())]).pipe(map(([first,second]) => {
      if (!first.success || !first.data || !second.success || !second.data) return { ...first,success:false,message:first.success?second.message:first.message,data:null };
      if (first.data.month !== month || first.data.year !== year || second.data.month !== next.getMonth()+1 || second.data.year !== next.getFullYear() || first.data.farmHouseId !== second.data.farmHouseId)
        return { ...first,success:false,message:'Unable to load calendar. Please try again.',data:null };
      return { ...first,data:{ ...first.data,bookedDates:[...first.data.bookedDates,...second.data.bookedDates],reservedDates:[...first.data.reservedDates,...second.data.reservedDates] } };
    }));
  }

  readonly bookingTypes = [
    { value: 'NormalEvent', label: 'Normal Event', rateKey: 'NORMAL_EVENT_DAILY' },
    { value: 'DecorationEvent', label: 'Event With Decoration', rateKey: 'DECORATION_EVENT_DAILY' },
  ] as const;

  bookingType: BookingType = 'BookingOnly';
  eventDates: string[] = [];
  bookingRates: BookingRate[] = [];
  loadingRates = false;
  pricingError = '';
  quote: BookingQuote | null = null;
  previousQuote: BookingQuote | null = null;
  submissionUncertain = false;
  loadingQuote = false;
  quoteError = '';
  submittedBookingPayload: BookingSubmissionPayload | null = null;
  submittingBooking = false;
  private readonly heldReservationIds = new Map<string, number>();
  private quoteRequest?: Subscription;

  get canSubmitBooking(): boolean {
    return this.currentStep === 6 && !this.submittingBooking &&
      this.heldReservationIds.size > 0 &&
      !!this.selectionId && !!this.checkInDate && !!this.checkOutDate &&
      !!this.reservationExpiresAt && !this.reservationExpired && !!this.quote &&
      new Date(this.reservationExpiresAt).getTime() > Date.now();
  }

  submitBooking(): void {
    if (!this.canSubmitBooking || !this.selectionId || !this.checkInDate || !this.checkOutDate || !this.quote) return;

    const payload = {
      selectionId: this.selectionId,
      reservationIds: this.availableEventDates.map(date => this.heldReservationIds.get(date) ?? 0),
      pricingVersion: this.quote.pricingVersion,
      pricing: { ...this.quote },
      checkInDate: this.checkInDate,
      checkOutDate: this.checkOutDate,
      ...this.customerDetails,
      adultCount: this.guestDetails.AdultCount ?? 0,
      childrenCount: this.guestDetails.ChildrenCount ?? 0,
      personCount: this.guestDetails.PersonCount ?? 0,
      customerNotes: this.guestDetails.CustomerNotes,
      bookingType: this.bookingType,
      eventDates: [...this.eventDates],
    };
    if (payload.reservationIds.length === 0 || payload.reservationIds.includes(0)) {
      this.errorMessage = 'Some reservation IDs are missing. Please select your dates again.';
      return;
    }
    let idempotencyKey: string | undefined;
    if (this.submittedBookingPayload) {
      const { idempotencyKey: previousKey, ...previousPayload } = this.submittedBookingPayload;
      if (JSON.stringify(payload) === JSON.stringify(previousPayload)) idempotencyKey = previousKey;
    }

    this.submittedBookingPayload = { ...payload, idempotencyKey: idempotencyKey ?? crypto.randomUUID() };
    this.errorMessage = '';
    this.submissionUncertain = false;
    this.submittingBooking = true;
    this.bookingSubmissionService.submit(this.submittedBookingPayload)
      .pipe(finalize(() => this.submittingBooking = false))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.completeBooking(response.data);
          } else {
            this.errorMessage = response.message || 'Could not submit your booking. Please try again.';
            void this.alerts.error('Booking could not be submitted',this.errorMessage);
          }
        },
        error: (error) => {
          if (error.error?.data?.code === 'PRICING_CHANGED' && error.error.data.quote) {
            this.previousQuote = this.quote;
            this.quote = error.error.data.quote;
          } else if (error.error?.data?.code === 'HOLD_EXPIRED') {
            this.expireReservation();
          }
          this.submissionUncertain = error.status === 0 || error.status >= 500;
          this.errorMessage = this.submissionUncertain
            ? 'We could not confirm whether your booking was saved. Check My Bookings before starting another request.'
            : error.error?.message ?? 'Could not submit your booking. Please try again.';
          const code=error.error?.data?.code;
          if (code === 'PRICING_CHANGED') void this.alerts.warning('Pricing has changed','Review the updated amounts before submitting your booking again.');
          else if (code !== 'HOLD_EXPIRED') {
            if (this.submissionUncertain) {
              void this.alerts.show({icon:'warning',title:'Check your booking status',text:this.errorMessage,
                confirmButtonText:'View My Bookings',showCancelButton:true}).then(result=>{
                  if(result.isConfirmed) void this.router.navigate([this.admin?'/admin/bookings':'/my-bookings']);
                });
            } else void this.alerts.error('Booking could not be submitted',this.errorMessage);
          }

        },
      });
  }

  private completeBooking(booking: SubmittedBooking): void {
    this.clearBookingDraft();
    this.stopReservationCountdown();
    this.quoteRequest?.unsubscribe();
    this.checkInDate = null;
    this.checkOutDate = null;
    this.selectionId = null;
    this.reservationExpiresAt = null;
    this.reservationRemainingSeconds = 0;
    this.reservationReminderVisible = false;
    this.reservationExpired = false;
    this.ownReservedDateKeys.clear();
    this.heldReservationIds.clear();
    this.bookingType = 'BookingOnly';
    this.eventDates = [];
    this.bookingRates = [];
    this.pricingError = '';
    this.quote = null;
    this.previousQuote = null;
    this.submissionUncertain = false;
    this.quoteError = '';
    this.submittedBookingPayload = null;
    this.guestDetails = { AdultCount: null, ChildrenCount: null, PersonCount: null, CustomerNotes: '' };
    this.guestDetailsError = { AdultCount: '', ChildrenCount: '' };
    this.successMessage = '';
    this.currentStep = 1;
    this.loadCustomerDetails();
    this.buildCalendarDays();
    this.loadCalendarMonth();

    void Swal.fire({
      icon: 'success',
      title: this.language.translate('Booking request received'),
      text: this.language.translate('Your request is awaiting farmhouse approval.'),
      input: 'text',
      inputLabel: this.language.translate('Booking reference'),
      inputValue: booking.bookingReference,
      inputAttributes: { readonly: 'readonly' },
      showDenyButton: true,
      showCloseButton: true,
      confirmButtonText: this.language.translate('View My Booking'),
      denyButtonText: this.language.translate('Copy reference'),
      confirmButtonColor: '#2e3b27',
      preDeny: async () => {
        try {
          await navigator.clipboard.writeText(booking.bookingReference);
          Swal.getDenyButton()!.textContent = this.language.translate('Copied');
        } catch {
          Swal.getInput()?.select();
          Swal.showValidationMessage(this.language.translate('Select and copy the booking reference shown above.'));
        }
        return false;
      },
    }).then((result) => {
      if (result.isConfirmed) {
        if (this.admin) void this.router.navigate(['/admin/booking',booking.bookingId]);
        else void this.router.navigate(['/my-bookings'], { queryParams: { reference: booking.bookingReference } });
      }
    });
  }

  get bookingTypeLabel(): string {
    return this.bookingTypes.find((type) => type.value === this.bookingType)?.label ?? 'Booking Only';
  }

  loadQuote(): void {
    if (!this.checkInDate || !this.checkOutDate || !this.availableEventDates.length) return;

    this.quoteRequest?.unsubscribe();
    this.quote = null;
    this.previousQuote = null;
    this.quoteError = '';
    this.loadingQuote = true;
    this.quoteRequest = this.bookingPricingService.getQuote({
      checkInDate: this.checkInDate,
      checkOutDate: this.checkOutDate,
      bookingType: this.bookingType,
      eventDates: this.eventDates,
    }).pipe(finalize(() => this.loadingQuote = false)).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.quote = response.data;
        } else {
          this.quoteError = response.message || 'Could not load the booking quote.';
        }
      },
      error: (error) => {
        this.quoteError = error.error?.message || 'Could not load the booking quote.';
      },
    });
  }

  readonly weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  calendarData: BookingCalendarMonthResponse | null = null;

  calendarDays: BookingCalendarDay[] = [];

  checkInDate: string | null = null;

  checkOutDate: string | null = null;

  selectionId: string | null = null;

  reservationExpiresAt: string | null = null;

  // Reservation Countdown
  reservationRemainingSeconds = 0;
  reservationReminderVisible = false;
  reservationExpired = false;

  private reservationCountdownTimer: ReturnType<typeof setInterval> | null =
    null;

  private ownReservedDateKeys = new Set<string>();

  private readonly draftLifetimeMs = 24 * 60 * 60 * 1000;

  private get bookingDraftKey(): string | null {
    const userId = this.registeredUser?.userId;
    const farmHouseId = this.registeredUser?.farmHouseId;
    return this.getStoredAccessToken() && Number.isInteger(userId) && Number.isInteger(farmHouseId)
      ? `farmstay_booking_draft_v2:${this.admin ? "admin:" : ""}${farmHouseId}:${userId}`
      : null;
  }

  loadingCalendar = false;

  reservingDates = false;

  private calendarRefreshTimer: ReturnType<typeof setInterval> | null = null;

  private readonly calendarRefreshInterval = 60 * 1000;

  errorMessage = '';

  successMessage = '';

  // Customer details are loaded from localStorage.

  customerDetails: BookingCustomerDetails = {
    fullName: '',

    mobileNumber: '',

    email: '',
  };

  customerDetailsLoading = false;

  customerDetailsError = {
    fullName: '',
    mobileNumber: '',
    email: '',
    general: '',
  };

  private registeredUser: {
    userId?: number;
    farmHouseId?: number;
    fullName?: string;
    mobileNumber?: string;
    email?: string;
    isMobileVerified?: boolean;
    isEmailVerified?: boolean;
  } | null = null;

  private getStoredAccessToken(): string | null {
    return (
      localStorage.getItem('farmstay_access_token') ||
      sessionStorage.getItem('farmstay_access_token')
    );
  }

  private getStoredUser(): string | null {
    return (
      localStorage.getItem('farmstay_user') ||
      sessionStorage.getItem('farmstay_user')
    );
  }

  private loadCustomerDetails(): void {
    this.clearCustomerDetailsErrors();

    try {
      const storedUser = this.getStoredUser();
      this.registeredUser = this.admin ? this.admin.customer : storedUser ? JSON.parse(storedUser) : null;

      this.customerDetails = {
        fullName: this.registeredUser?.fullName ?? '',
        mobileNumber: this.registeredUser?.mobileNumber ?? '',
        email: this.registeredUser?.email ?? '',
      };
    } catch (error) {
      console.error('Unable to load stored user details:', error);

      this.registeredUser = null;

      this.customerDetails = {
        fullName: '',
        mobileNumber: '',
        email: '',
      };

      this.customerDetailsError.general =
        'Unable to load your account details. Please log in again.';
    }
  }

  private clearCustomerDetailsErrors(): void {
    this.customerDetailsError = {
      fullName: '',
      mobileNumber: '',
      email: '',
      general: '',
    };
  }

  private validateCustomerDetails(): boolean {
    this.clearCustomerDetailsErrors();

    const accessToken = this.getStoredAccessToken();

    if (!accessToken) {
      this.customerDetailsError.general =
        'Please sign in to continue with your booking.';
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/booking' },
      });
      return false;
    }

    if (!this.registeredUser) {
      this.customerDetailsError.general =
        'Registered account details were not found. Please sign in again.';
      return false;
    }

    const enteredName = this.customerDetails.fullName.trim();
    const enteredMobile = this.customerDetails.mobileNumber.trim();
    const enteredEmail = this.customerDetails.email.trim().toLowerCase();
    const registeredMobile = String(
      this.registeredUser.mobileNumber ?? '',
    ).trim();
    const registeredEmail = String(this.registeredUser.email ?? '')
      .trim()
      .toLowerCase();

    if (!enteredName) {
      this.customerDetailsError.fullName = 'Full name is required.';
    }

    if (!enteredMobile) {
      this.customerDetailsError.mobileNumber = 'Mobile number is required.';
    } else if (!registeredMobile || enteredMobile !== registeredMobile) {
      this.customerDetailsError.mobileNumber =
        'This mobile number does not match your registered account.';
    }

    if (enteredEmail !== registeredEmail) {
      this.customerDetailsError.email =
        'This email address does not match your registered account.';
    }

    if (!this.registeredUser.isMobileVerified || (registeredEmail && !this.registeredUser.isEmailVerified))
      this.customerDetailsError.general = 'Verify your mobile and any supplied email before booking.';

    return !Object.values(this.customerDetailsError).some(
      (message) => !!message,
    );
  }

  private readonly todayKey = this.toDateKey(new Date());

  constructor(
    private readonly bookingCalendarService: BookingCalendarService,
    private readonly router: Router,
    private readonly bookingPricingService: BookingPricingService,
    private readonly bookingSubmissionService: BookingSubmissionService,
  ) {}

  ngOnInit(): void {
    this.loadCustomerDetails();
    if (this.admin || this.getStoredAccessToken()) this.loadBookingRates();
    if (!this.admin && this.getStoredAccessToken()) {
      this.auth.getProfile().subscribe({
        next: response => {
          if (response.data) {
            this.registeredUser = { ...this.registeredUser, ...response.data };
            this.customerDetails.mobileNumber = response.data.mobileNumber;
            this.customerDetails.email = response.data.email ?? '';
          }
        },
        error: () => { this.customerDetailsError.general = 'Could not load your registered account details.'; }
      });
    }

    // Restore previously saved form data.
    this.restoreBookingDraft();

    // Later steps depend on a currently held stay and an event selection.
    this.currentStep = Math.min(this.currentStep, 3);

    // Only an authenticated account can recover its existing hold.
    if (this.admin || this.getStoredAccessToken()) this.recoverActiveReservations();
    else this.loadCalendarMonth();

    this.startCalendarAutoRefresh();
  }

  private recoverActiveReservations(): void {
    this.bookingCalendarService.getActiveUserReservations().subscribe({
      next: (response) => {
        if (!response.success) {
          this.ownReservedDateKeys.clear();
          this.loadCalendarMonth();
          return;
        }

        const activeReservations = (response.data ?? []).filter(
          (reservation: ActiveBookingDateReservation) =>
            new Date(reservation.expiresAt).getTime() > Date.now(),
        );

        this.ownReservedDateKeys = new Set(
          activeReservations.flatMap((reservation) =>
            reservation.reservedDates.map((date) => date.substring(0, 10)),
          ),
        );

        if (activeReservations.length > 0) {
          // Restore the reservation with the latest expiry.
          const reservation = [...activeReservations].sort(
            (a, b) =>
              new Date(b.expiresAt).getTime() -
              new Date(a.expiresAt).getTime(),
          )[0];

          this.checkInDate = reservation.fromDate.substring(0, 10);
          this.checkOutDate = reservation.toDate.substring(0, 10);
          this.selectionId = reservation.selectionId;
          this.setHeldReservationIds(reservation.reservedDates, reservation.reservationIds);
          this.reservationExpiresAt = reservation.expiresAt;

          // Restore countdown using the original backend expiry time.
          this.startReservationCountdown();

          const checkIn = this.parseDateKey(this.checkInDate);

          this.calendarMonth = new Date(
            checkIn.getFullYear(),
            checkIn.getMonth(),
            1,
          );

          this.successMessage =
            'Your previous date reservation has been restored.';
        }

        this.loadCalendarMonth();
      },

      error: (error) => {
        console.error('Active reservation recovery failed:', error);

        this.ownReservedDateKeys.clear();
        this.loadCalendarMonth();
      },
    });
  }

  private startCalendarAutoRefresh(): void {
    // Prevent duplicate timers.
    if (this.calendarRefreshTimer) {
      return;
    }

    this.calendarRefreshTimer = setInterval(() => {
      this.refreshCalendarMonth();
    }, this.calendarRefreshInterval);
  }

  private refreshCalendarMonth(): void {
    // Refresh calendar only when Date Selection (Step 3) is active.
    if (this.currentStep !== 3) {
      return;
    }

    // Avoid overlapping API requests.
    if (this.loadingCalendar || this.reservingDates) {
      return;
    }

    const month = this.calendarMonth.getMonth() + 1;
    const year = this.calendarMonth.getFullYear();

    this.getCalendarPair(month, year).subscribe({
      next: (response) => {
        // Ignore response if user has navigated to another month or step.
        const currentMonth = this.calendarMonth.getMonth() + 1;
        const currentYear = this.calendarMonth.getFullYear();

        if (
          this.currentStep !== 3 ||
          currentMonth !== month ||
          currentYear !== year
        ) {
          return;
        }

        if (!response.success || !response.data) {
          return;
        }

        // Check whether customer's own reservation has expired.
        if (
          this.selectionId &&
          this.reservationExpiresAt &&
          new Date(this.reservationExpiresAt).getTime() <=
            Date.now()
        ) {
          this.expireReservation();
        }

        this.calendarData = response.data;

        // Rebuild calendar UI.
        this.buildCalendarDays();
      },

      error: (error) => {
        console.error('Calendar auto-refresh failed:', error);
      },
    });
  }

  ngOnDestroy(): void {
    this.quoteRequest?.unsubscribe();
    if (this.calendarRefreshTimer) {
      clearInterval(this.calendarRefreshTimer);
      this.calendarRefreshTimer = null;
    }

    this.stopReservationCountdown();
  }

  get monthLabel(): string {
    return this.calendarMonth.toLocaleDateString(this.language.locale, {
      month: 'long',

      year: 'numeric',
    });
  }

  // get canGoToPreviousMonth(): boolean {
  //   const currentMonth = new Date(
  //     new Date().getFullYear(),

  //     new Date().getMonth(),

  //     1,
  //   );

  //   return this.calendarMonth > currentMonth;
  // }

  get canGoToPreviousMonth(): boolean {
    const today = new Date();

    const currentMonth = new Date(
      this.calendarMonth.getFullYear(),
      this.calendarMonth.getMonth(),
      1,
    );

    const minimumMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    return currentMonth > minimumMonth;
  }

  loadCalendarMonth(): void {
    this.loadingCalendar = true;

    this.errorMessage = '';

    const month = this.calendarMonth.getMonth() + 1;

    const year = this.calendarMonth.getFullYear();

    this.getCalendarPair(month, year)

      .pipe(finalize(() => (this.loadingCalendar = false)))

      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.errorMessage = response.message || 'Unable to load calendar.';

            this.calendarData = null;

            this.buildCalendarDays();

            return;
          }

          this.calendarData = response.data;

          this.buildCalendarDays();
        },

        error: () => {
          this.calendarData = null;

          this.buildCalendarDays();

          this.errorMessage = 'Unable to load calendar. Please try again.';
        },
      });
  }

  previousMonth(): void {
    if (!this.canGoToPreviousMonth || this.loadingCalendar) {
      return;
    }

    this.calendarMonth = new Date(
      this.calendarMonth.getFullYear(),

      this.calendarMonth.getMonth() - 1,

      1,
    );

    this.loadCalendarMonth();
  }

  nextMonth(): void {
    if (this.loadingCalendar) {
      return;
    }

    this.calendarMonth = new Date(
      this.calendarMonth.getFullYear(),

      this.calendarMonth.getMonth() + 1,

      1,
    );

    this.loadCalendarMonth();
  }

  isOwnReservedDate(dateKey: string): boolean {
    return (
      !!this.selectionId &&
      !!this.checkInDate &&
      !!this.checkOutDate &&
      dateKey >= this.checkInDate &&
      dateKey < this.checkOutDate
    );
  }

  selectDate(day: BookingCalendarDay): void {
    const isOwnReservationDate = this.isOwnReservedDate(day.dateKey);

    // Check whether the clicked date is being selected as checkout.
    // Checkout date is exclusive, so it can be an unavailable boundary date.
    const isSelectingCheckOut =
      !!this.checkInDate &&
      !this.checkOutDate &&
      day.dateKey > this.checkInDate;

    const isUnavailableDate =
      day.isBooked || (day.isReserved && !isOwnReservationDate);

    if (
      !day.isCurrentMonth ||
      day.isPast ||
      (isUnavailableDate && !isSelectingCheckOut) ||
      this.loadingCalendar ||
      this.reservingDates
    ) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    // Existing temporary reservation is active.
    if (this.selectionId && this.checkInDate && this.checkOutDate) {
      const oldCheckIn = this.checkInDate;
      const oldCheckOut = this.checkOutDate;

      // Clicked Check-in: release complete reservation.
      if (day.dateKey === oldCheckIn) {
        this.releaseSelectedReservation(oldCheckIn, oldCheckOut, () => {
          this.checkInDate = day.dateKey;
          this.checkOutDate = null;
          this.selectionId = null;
          this.reservationExpiresAt = null;
        });

        return;
      }

      // Clicked a date inside the reserved range:
      // Release clicked date onwards and make it the new checkout.
      if (day.dateKey > oldCheckIn && day.dateKey < oldCheckOut) {
        this.releaseSelectedReservation(day.dateKey, oldCheckOut, () => {
          this.checkOutDate = day.dateKey;
        });

        return;
      }

      // Clicked outside the existing reservation:
      // Release the old reservation and start a new selection.
      this.releaseSelectedReservation(oldCheckIn, oldCheckOut, () => {
        this.checkInDate = day.dateKey;
        this.checkOutDate = null;
        this.selectionId = null;
        this.reservationExpiresAt = null;
        this.stopReservationCountdown();
        this.reservationRemainingSeconds = 0;
        this.reservationReminderVisible = false;
        this.reservationExpired = false;
      });

      return;
    }

    // Start a new date selection.
    if (
      !this.checkInDate ||
      this.checkOutDate ||
      day.dateKey <= this.checkInDate
    ) {
      this.checkInDate = day.dateKey;
      this.checkOutDate = null;
      this.selectionId = null;
      this.reservationExpiresAt = null;

      this.buildCalendarDays();
      return;
    }

    // Validate the complete date range using all required month APIs.
    this.reservingDates = true;

    this.checkDateRangeAvailability(this.checkInDate, day.dateKey).subscribe({
      next: (blockedDate) => {
        this.reservingDates = false;

        if (blockedDate) {
          this.errorMessage = `The selected stay includes an unavailable or reserved date: ${blockedDate}. Please select another range.`;

          return;
        }

        this.checkOutDate = day.dateKey;
        this.buildCalendarDays();

        // Backend reservation is attempted only after availability validation.
        this.reserveSelectedDates();
      },

      error: (error) => {
        this.reservingDates = false;

        this.errorMessage =
          error?.message ||
          'Unable to verify date availability. Please try again.';

        this.checkOutDate = null;
        this.buildCalendarDays();
      },
    });
  }

  private releaseSelectedReservation(
    fromDate: string,
    toDate: string,
    onSuccess: () => void,
  ): void {
    // If toDate is the next day, release only fromDate.
    const nextDate = this.parseDateKey(fromDate);
    nextDate.setDate(nextDate.getDate() + 1);

    const isSingleDate = this.toDateKey(nextDate) === toDate;

    const request = isSingleDate ? { fromDate } : { fromDate, toDate };

    this.reservingDates = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.bookingCalendarService
      .releaseDates(request)
      .pipe(finalize(() => (this.reservingDates = false)))
      .subscribe({
        next: (response) => {
          if (!response.success) {
            this.errorMessage =
              response.message || 'Unable to release selected dates.';
            return;
          }

          for (const date of this.heldReservationIds.keys()) {
            if (date >= fromDate && date < toDate) this.heldReservationIds.delete(date);
          }
          // Update the selection only after successful API response.
          onSuccess();

          this.successMessage =
            'Selected reservation dates released successfully.';

          this.buildCalendarDays();
          this.loadCalendarMonth();
        },

        error: (error) => {
          this.errorMessage =
            error?.error?.message ||
            'Unable to release selected dates. Please try again.';
        },
      });
  }

  private reserveSelectedDates(): void {
    if (!this.checkInDate || !this.checkOutDate) {
      return;
    }

    const request: CreateBookingDateReservationRequest = {
      fromDate: this.checkInDate,

      toDate: this.checkOutDate,
    };

    this.reservingDates = true;

    this.errorMessage = '';

    this.successMessage = '';

    this.bookingCalendarService

      .reserveDates(request)

      .pipe(finalize(() => (this.reservingDates = false)))

      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.selectionId = null;

            this.reservationExpiresAt = null;

            this.errorMessage =
              response.message || 'Unable to reserve these dates.';
            void this.alerts.error('Could not reserve dates',this.errorMessage);

            this.checkOutDate = null;

            this.buildCalendarDays();

            this.loadCalendarMonth();

            return;
          }

          const reservation: CreateBookingDateReservationResponse =
            response.data;

          this.selectionId = reservation.selectionId;
          this.setHeldReservationIds(reservation.reservedDates, reservation.reservationIds);

          this.reservationExpiresAt = reservation.expiresAt;

          // Start countdown using backend expiry time.
          this.startReservationCountdown();

          this.successMessage = 'Dates temporarily reserved successfully.';
          this.alerts.toast('Dates reserved for 10 minutes');

          // Refresh the calendar so other reservations are reflected.

          this.loadCalendarMonth();
        },

        error: (error) => {
          this.selectionId = null;

          this.reservationExpiresAt = null;

          this.checkOutDate = null;

          this.errorMessage =
            error?.error?.message ||
            'Reservation failed. Please select your dates again.';
          void this.alerts.error('Could not reserve dates',this.errorMessage);

          this.buildCalendarDays();

          this.loadCalendarMonth();
        },
      });
  }

  // private findBlockedDate(fromDate: string, toDate: string): string | null {
  //   if (!this.calendarData) {
  //     return null;
  //   }

  //   const bookedDates = new Set(
  //     this.calendarData.bookedDates.map((item) =>
  //       this.toDateKey(new Date(item.date)),
  //     ),
  //   );

  //   const reservedDates = new Set(
  //     this.calendarData.reservedDates

  //       .filter((item) => new Date(item.expiresAt).getTime() > Date.now())

  //       .map((item) => this.toDateKey(new Date(item.date))),
  //   );

  //   // Checkout is exclusive: don't test the checkout date itself.

  //   let cursor = this.parseDateKey(fromDate);

  //   const end = this.parseDateKey(toDate);

  //   while (cursor < end) {
  //     const key = this.toDateKey(cursor);

  //     if (bookedDates.has(key) || reservedDates.has(key)) {
  //       return key;
  //     }

  //     cursor.setDate(cursor.getDate() + 1);
  //   }

  //   return null;
  // }

  private checkDateRangeAvailability(
    fromDate: string,
    toDate: string,
  ): Observable<string | null> {
    const months: { month: number; year: number }[] = [];

    let cursor = this.parseDateKey(fromDate);
    const end = this.parseDateKey(toDate);

    // Validate date range
    if (cursor >= end) {
      return throwError(() => new Error('Invalid date range.'));
    }

    // Collect every month covered by the selected range.
    while (cursor < end) {
      const month = cursor.getMonth() + 1;
      const year = cursor.getFullYear();

      const alreadyAdded = months.some(
        (item) => item.month === month && item.year === year,
      );

      if (!alreadyAdded) {
        months.push({ month, year });
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    // Fetch availability for every required month.
    const requests = months.map((item) =>
      this.bookingCalendarService.getCalendarMonth(item.month, item.year),
    );

    return forkJoin(requests).pipe(
      map((responses) => {
        const bookedDates = new Set<string>();
        const reservedDates = new Set<string>();

        responses.forEach((response, index) => {
          const requestedMonth = months[index];

          // API failure or invalid response must stop validation.
          if (
            !response.success ||
            !response.data ||
            response.data.month !== requestedMonth.month ||
            response.data.year !== requestedMonth.year
          ) {
            throw new Error(
              response.message || 'Unable to verify calendar availability.',
            );
          }

          // Collect booked dates.
          response.data.bookedDates.forEach((item) => {
            bookedDates.add(item.date.substring(0, 10));
          });

          // Collect only active reservations.
          response.data.reservedDates.forEach((item) => {
            const expiryTime = new Date(item.expiresAt).getTime();

            if (expiryTime > Date.now()) {
              reservedDates.add(item.date.substring(0, 10));
            }
          });
        });

        // Checkout is exclusive. Check-in is inclusive.
        let currentDate = this.parseDateKey(fromDate);

        while (currentDate < end) {
          const dateKey = this.toDateKey(currentDate);

          if (bookedDates.has(dateKey) || reservedDates.has(dateKey)) {
            return dateKey;
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }

        return null;
      }),
    );
  }

  private startReservationCountdown(): void {
    // Prevent duplicate countdown timers.
    this.stopReservationCountdown();

    if (!this.reservationExpiresAt) {
      return;
    }

    this.reservationReminderVisible = false;
    this.reservationExpired = false;

    this.updateReservationCountdown();

    if (this.reservationExpired) {
      return;
    }

    this.reservationCountdownTimer = setInterval(() => {
      this.updateReservationCountdown();
    }, 1000);
  }

  private updateReservationCountdown(): void {
    if (!this.reservationExpiresAt) {
      this.stopReservationCountdown();
      return;
    }

    const expiryTime = new Date(
      this.reservationExpiresAt,
    ).getTime();

    const remainingMilliseconds = expiryTime - Date.now();

    if (remainingMilliseconds <= 0) {
      this.expireReservation();
      return;
    }

    this.reservationRemainingSeconds = Math.ceil(remainingMilliseconds / 1000);

    // Show the reminder only once when 2 minutes or less remain.
    if (this.reservationRemainingSeconds <= 120) {
      this.reservationReminderVisible = true;
    }
  }

  private expireReservation(): void {
    if (this.reservationExpired) return;
    const hadHold = !!this.selectionId || !!this.reservationExpiresAt;
    this.heldReservationIds.clear();
    this.submittedBookingPayload = null;
    this.stopReservationCountdown();
    this.reservationExpired = true;
    this.reservationRemainingSeconds = 0;
    this.reservationReminderVisible = false;
    this.checkInDate = null;
    this.checkOutDate = null;
    this.selectionId = null;
    this.reservationExpiresAt = null;
    this.ownReservedDateKeys.clear();
    this.eventDates = [];
    this.quoteRequest?.unsubscribe();
    this.quote = null;
    this.quoteError = '';
    this.successMessage = '';
    this.buildCalendarDays();
    this.loadCalendarMonth();
    if (hadHold) void this.alerts.warning('Reservation Expired','Your selected dates are no longer reserved. Please select your dates again.');
  }

  private setHeldReservationIds(dates: string[], ids: number[]): void {
    this.heldReservationIds.clear();
    dates.forEach((date, index) => {
      const id = ids?.[index];
      if (id) this.heldReservationIds.set(date.substring(0, 10), id);
    });
  }

  private stopReservationCountdown(): void {
    if (this.reservationCountdownTimer) {
      clearInterval(this.reservationCountdownTimer);
      this.reservationCountdownTimer = null;
    }
  }

  get reservationCountdownText(): string {
    const minutes = Math.floor(this.reservationRemainingSeconds / 60);

    const seconds = this.reservationRemainingSeconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  private buildCalendarDays(): void {
    this.calendarDays = this.daysForMonth(this.calendarMonth);
    this.nextCalendarDays = this.daysForMonth(new Date(this.calendarMonth.getFullYear(),this.calendarMonth.getMonth()+1,1));
  }

  private daysForMonth(monthDate: Date): BookingCalendarDay[] {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const bookedDates = new Set(
      (this.calendarData?.bookedDates ?? []).map((item) =>
        this.toDateKey(new Date(item.date)),
      ),
    );

    const reservedDates = new Set(
      (this.calendarData?.reservedDates ?? [])
        .filter(
          (item) => new Date(item.expiresAt).getTime() > Date.now(),
        )
        .map((item) => this.toDateKey(new Date(item.date))),
    );

    const days: BookingCalendarDay[] = [];

    // Leading empty cells align the first day of the month.
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(this.createEmptyDay());
    }

    // Current date (Today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let number = 1; number <= daysInMonth; number++) {
      const date = new Date(year, month, number);
      date.setHours(0, 0, 0, 0);

      const dateKey = this.toDateKey(date);

      const isBooked = bookedDates.has(dateKey);
      const isOwnReserved = this.ownReservedDateKeys.has(dateKey);

      const isReserved = reservedDates.has(dateKey) && !isOwnReserved;

      // Only dates before today are past dates.
      const isPast = (this.admin ? date < today : date <= today);

      const isCheckIn = dateKey === this.checkInDate;
      const isCheckOut = dateKey === this.checkOutDate;

      const isInRange =
        !!this.checkInDate &&
        !!this.checkOutDate &&
        dateKey > this.checkInDate &&
        dateKey < this.checkOutDate;

      let status = 'Available';

      if (isPast) {
        status = 'Past';
      } else if (isBooked) {
        status = 'Unavailable';
      } else if (isReserved) {
        status = 'Reserved';
      } else if (dateKey === this.todayKey) {
        status = 'Today';
      }

      days.push({
        date,
        dateKey,
        dayNumber: number,
        isCurrentMonth: true,
        isPast,
        isToday: dateKey === this.todayKey,
        isCheckIn,
        isCheckOut,
        isInRange,
        isBooked,
        isReserved,

        // Past, booked and reserved dates cannot be selected.
        isDisabled: isPast || isBooked || isReserved,

        status,
      });
    }

    return days;
  }

  private createEmptyDay(): BookingCalendarDay {
    return {
      date: new Date(0),

      dateKey: '',

      dayNumber: 0,

      isCurrentMonth: false,

      isPast: false,

      isToday: false,

      isCheckIn: false,

      isCheckOut: false,

      isInRange: false,

      isBooked: false,

      isReserved: false,

      isDisabled: true,

      status: '',
    };
  }

  private toDateKey(date: Date): string {
    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, '0');

    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private parseDateKey(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);

    return new Date(year, month - 1, day);
  }

  resetSelection(): void {
    // Prevent multiple reset requests.
    if (this.reservingDates) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.stopReservationCountdown();

    this.reservationRemainingSeconds = 0;
    this.reservationReminderVisible = false;
    this.reservationExpired = false;

    // If a temporary reservation exists,
    // release it from the backend first.
    if (this.selectionId && this.checkInDate && this.checkOutDate) {
      const fromDate = this.checkInDate;
      const toDate = this.checkOutDate;

      this.releaseSelectedReservation(fromDate, toDate, () => {
        this.stopReservationCountdown();
        this.reservationRemainingSeconds = 0;
        this.reservationReminderVisible = false;
        this.reservationExpired = false;

        // Clear local selection only after successful API response.
        this.checkInDate = null;
        this.checkOutDate = null;
        this.selectionId = null;
        this.reservationExpiresAt = null;
      });

      return;
    }

    // No backend reservation exists.
    // Only a check-in date may have been selected.
    this.checkInDate = null;
    this.checkOutDate = null;
    this.selectionId = null;
    this.reservationExpiresAt = null;

    this.buildCalendarDays();
  }

  readonly bookingSteps = [
    { title: 'Customer', subtitle: 'Your details' },

    { title: 'Guests', subtitle: 'People count' },

    { title: 'Dates', subtitle: 'Select your stay' },

    { title: 'Event', subtitle: 'Event details' },

    { title: 'Review', subtitle: 'Price summary' },

    { title: 'Confirm', subtitle: 'Submit booking' },
  ];

  currentStep = 1;

  get currentStepInfo() {
    return this.bookingSteps[this.currentStep - 1];
  }

  get availableEventDates(): string[] {
    if (!this.checkInDate || !this.checkOutDate || !this.selectionId || this.reservationExpired) {
      return [];
    }

    const dates: string[] = [];
    const day = this.parseDateKey(this.checkInDate);
    const checkout = this.parseDateKey(this.checkOutDate);
    while (day < checkout) {
      dates.push(this.toDateKey(day));
      day.setDate(day.getDate() + 1);
    }
    return dates;
  }

  get selectedEventRate(): BookingRate | undefined {
    const key = this.bookingTypes.find((type) => type.value === this.bookingType)?.rateKey;
    return this.bookingRates.find((rate) => rate.pricingKey === key);
  }

  get stayRate(): BookingRate | undefined {
    return this.bookingRates.find((rate) => rate.pricingKey === 'BOOKING_DAILY');
  }

  get stayCharge(): number {
    return (this.stayRate?.price ?? 0) * this.availableEventDates.length;
  }

  get eventCharge(): number {
    return (this.selectedEventRate?.price ?? 0) * this.eventDates.length;
  }

  get eventStepError(): string {
    if (!this.availableEventDates.length) return 'Select and reserve your stay dates first.';
    if (this.loadingRates) return 'Loading booking rates…';
    if (!this.stayRate) return 'The daily stay rate is unavailable.';
    if (this.bookingType === 'BookingOnly') return '';
    if (!this.eventDates.length) return 'Choose at least one event date.';
    if (!this.selectedEventRate) return 'Pricing is unavailable for this event type.';
    if (this.selectedEventRate.currencyCode !== this.stayRate.currencyCode) {
      return 'The stay and event rates use different currencies.';
    }
    return '';
  }

  selectBookingType(type: BookingType): void {
    this.bookingType = type;
    if (type === 'BookingOnly') this.eventDates = [];
  }

  toggleEventDate(date: string, selected: boolean): void {
    this.eventDates = selected
      ? [...new Set([...this.eventDates, date])].sort()
      : this.eventDates.filter((value) => value !== date);
  }

  loadBookingRates(): void {
    if (this.loadingRates) return;

    this.loadingRates = true;
    this.pricingError = '';
    this.bookingPricingService.getRates().pipe(
      finalize(() => this.loadingRates = false),
    ).subscribe({
      next: (response) => {
        this.bookingRates = (response.success ? response.data ?? [] : [])
          .filter((rate) => Number.isFinite(rate.price) && rate.price >= 0);
      },
      error: () => {
        this.bookingRates = [];
        this.pricingError = 'Could not load event pricing.';
      },
    });
  }

  async nextStep(): Promise<void> {
    if (this.submittingBooking) return;
    // Prevent moving forward when an existing reservation has expired.
    if (
      (this.currentStep >= 3 && this.reservationExpired) ||
      (this.reservationExpiresAt &&
        new Date(this.reservationExpiresAt).getTime() <= Date.now())
    ) {
      if (!this.reservationExpired) this.expireReservation();

      this.errorMessage =
        'Your date reservation has expired. Please select your dates again.';

      return;
    }

    if (this.currentStep === 1) {
      const accessToken = this.getStoredAccessToken();

      if (!accessToken) {
        await Swal.fire({
          icon: 'warning',
          title: this.language.translate('Login Required'),
          text: this.language.translate('You are not logged in. Please log in and try again.'),
          confirmButtonText: this.language.translate('OK'),
          confirmButtonColor: '#2e3b27',
          allowOutsideClick: false,
          allowEscapeKey: false,
        });

        //await this.router.navigate(['/login']);
        await this.router.navigate(['/login'], {
          queryParams: { returnUrl: '/booking' },
        });
        return;
      }

      if (!this.validateCustomerDetails()) {
        return;
      }
    }
    // Step 2: Guest Details Validation
    if (this.currentStep === 2) {
      if (!this.validateGuestDetails()) {
        return;
      }
    }

    // Step 3: Date Selection Validation
    if (this.currentStep === 3) {
      if (!this.checkInDate || !this.checkOutDate) {
        this.errorMessage = 'Please select both check-in and check-out dates.';

        return;
      }

      if (this.checkOutDate <= this.checkInDate) {
        this.errorMessage = 'Check-out date must be after check-in date.';

        return;
      }

      if (this.reservingDates) {
        this.errorMessage =
          'Please wait while your selected dates are being reserved.';

        return;
      }

      if (!this.selectionId) {
        this.errorMessage =
          'Your dates are not temporarily reserved. Please select your dates again.';

        return;
      }

      if (
        !this.reservationExpiresAt ||
        new Date(this.reservationExpiresAt).getTime() <= Date.now()
      ) {
        this.errorMessage =
          'Your date reservation has expired. Please select your dates again.';

        return;
      }

      this.errorMessage = '';
      const availableDates = this.availableEventDates;
      this.eventDates = this.eventDates.filter((date) => availableDates.includes(date));
      this.loadBookingRates();
    }

    if (this.currentStep === 4) {
      if (this.eventStepError) return;
      this.loadQuote();
    }

    if (this.currentStep === 5 && (!this.quote || !this.availableEventDates.length)) return;

    if (this.currentStep < this.bookingSteps.length) {
      this.currentStep++;
      this.saveBookingDraft();
    }
  }

  previousStep(): void {
    if (this.submittingBooking) return;
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    if (this.submittingBooking) return;
    // Validate step range
    if (step < 1 || step > this.bookingSteps.length) {
      return;
    }

    // Allow navigation only to the current or previously visited steps
    if (step <= this.currentStep) {
      this.currentStep = step;
      this.errorMessage = '';
    }
  }

  guestDetails = {
    AdultCount: null as number | null,
    ChildrenCount: null as number | null,
    PersonCount: null as number | null,
    CustomerNotes: '',
  };

  guestDetailsError = {
    AdultCount: '',
    ChildrenCount: '',
  };

  updatePersonCount(): void {
    const adults = Number(this.guestDetails.AdultCount) || 0;
    const children = Number(this.guestDetails.ChildrenCount) || 0;

    this.guestDetails.PersonCount =
      this.guestDetails.AdultCount == null && this.guestDetails.ChildrenCount == null
        ? null : adults + children;
  }

  private validateGuestDetails(): boolean {
    this.guestDetailsError = {
      AdultCount: '',
      ChildrenCount: '',
    };

    const adults = Number(this.guestDetails.AdultCount);
    const children = Number(this.guestDetails.ChildrenCount);

    if (!Number.isInteger(adults) || adults < 1) {
      this.guestDetailsError.AdultCount = 'At least one adult is required.';
    }

    if (!Number.isInteger(children) || children < 0) {
      this.guestDetailsError.ChildrenCount =
        'Children count cannot be negative.';
    }

    this.updatePersonCount();

    return (
      !this.guestDetailsError.AdultCount &&
      !this.guestDetailsError.ChildrenCount
    );
  }

  private saveBookingDraft(): void {
    const key = this.bookingDraftKey;
    if (!key) return;

    try {
      const draft: BookingDraft = {
        adultCount: this.guestDetails.AdultCount,
        childrenCount: this.guestDetails.ChildrenCount,
        bookingType: this.bookingType,
        eventDates: [...this.eventDates],
        currentStep: this.currentStep,
        expiresAt: Date.now() + this.draftLifetimeMs,
      };
      localStorage.setItem(key, JSON.stringify(draft));
    } catch {
      // Booking can continue when browser storage is unavailable.
    }
  }

  private restoreBookingDraft(): void {
    try {
      // Earlier drafts included contact information and notes.
      localStorage.removeItem('farmstay_booking_draft');
      const key = this.bookingDraftKey;
      if (!key) return;

      const storedDraft = localStorage.getItem(key);
      if (!storedDraft) return;

      const draft: BookingDraft = JSON.parse(storedDraft);
      if (!draft || !Number.isFinite(draft.expiresAt) || draft.expiresAt <= Date.now() ||
        (draft.adultCount !== null && (!Number.isSafeInteger(draft.adultCount) || draft.adultCount < 1)) ||
        (draft.childrenCount !== null && (!Number.isSafeInteger(draft.childrenCount) || draft.childrenCount < 0))) {
        localStorage.removeItem(key);
        return;
      }

      this.guestDetails.AdultCount = draft.adultCount;
      this.guestDetails.ChildrenCount = draft.childrenCount;
      this.updatePersonCount();

      if (draft.bookingType === 'NormalEvent' || draft.bookingType === 'DecorationEvent') {
        this.bookingType = draft.bookingType;
        if (Array.isArray(draft.eventDates)) {
          this.eventDates = [...new Set(draft.eventDates.filter(date =>
            typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date),
          ))].sort();
        }
      }

      if (Number.isInteger(draft.currentStep) && draft.currentStep >= 1) {
        this.currentStep = Math.min(draft.currentStep, 3);
      }
    } catch {
      // Ignore unavailable or malformed local drafts.
    }
  }

  private clearBookingDraft(): void {
    try {
      const key = this.bookingDraftKey;
      if (key) localStorage.removeItem(key);
    } catch {
      // A storage failure cannot undo a successful booking.
    }
  }
}
