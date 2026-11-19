import { TranslationPipe, LocalDatePipe, LanguageService } from '../../../core/i18n/language';
import { inject as injectLanguage } from '@angular/core';
import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChildren,
  QueryList,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { PublicSiteService } from '../../../core/services/public-site.service';
import { BookingCalendarService } from '../../../core/services/booking-calendar.service';

import { BookingCalendarAvailabilityRequest } from '../home/models/booking-calendar-availability-request.model';
import { BookingCalendarAvailabilityResponse } from '../home/models/booking-calendar-availability-response.model';

import {
  AmenityResponseDto,
  CarouselResponseDto,
  FeedbackResponseDto,
} from '../home/models/home.model';

interface CalendarDay {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isPastDate: boolean;
  isCheckIn: boolean;
  isCheckOut: boolean;
  isInSelectedRange: boolean;
  isAvailable: boolean;
  isUnavailable: boolean;
  isToday: boolean;
  festivals: CalendarFestival[];
}

interface CalendarFestival {
  date: string;
  name: string;
  type: 'festival' | 'national-holiday';
}

interface CalendarMonth {
  year: number;
  month: number;
  label: string;
  days: CalendarDay[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TranslationPipe, LocalDatePipe, CommonModule, RouterModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  readonly language = injectLanguage(LanguageService);
  amenities: AmenityResponseDto[] = [];
  carouselImages: CarouselResponseDto[] = [];
  feedbacks: FeedbackResponseDto[] = [];

  isLoading = true;
  errorMessage = '';

  amenitiesLoading = true;
  feedbackLoading = true;

  paginatedFeedbacks: FeedbackResponseDto[] = [];
  currentFeedbackSlide = 0;
  feedbackSlideCount = 0;

  // Booking dates
  checkInDate = '';
  checkOutDate = '';

  // Availability API state
  availabilityLoading = false;
  availabilityMessage = '';
  availabilityError = '';
  availabilityData: BookingCalendarAvailabilityResponse | null = null;

  // Custom calendar state
  isCalendarOpen = false;
  activeCalendarField: 'checkIn' | 'checkOut' | null = null;

  calendarMonth = this.getFirstDayOfMonth(new Date());
  readonly weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  readonly todayDate = this.formatDate(new Date());
  readonly tomorrowDate = this.getTomorrowDate();

  private readonly feedbacksPerSlide = 6;
  private readonly feedbackSlideInterval = 30000;
  private feedbackAutoSlideTimer: ReturnType<typeof setInterval> | null = null;
  private destroy$ = new Subject<void>();

  @ViewChildren('availabilityFeedback')
  private availabilityFeedback!: QueryList<ElementRef<HTMLElement>>;

  /**
   * Festival data.
   *
   * Fixed-date holidays are reusable every year.
   * Variable festival dates must be added using verified year-specific dates.
   * This avoids incorrectly assigning a festival to the wrong date.
   */
  private readonly fixedDateFestivals: {
    month: number;
    day: number;
    name: string;
    type: CalendarFestival['type'];
  }[] = [
    {
      month: 0,
      day: 26,
      name: 'Republic Day',
      type: 'national-holiday',
    },
    {
      month: 7,
      day: 15,
      name: 'Independence Day',
      type: 'national-holiday',
    },
    {
      month: 9,
      day: 2,
      name: 'Gandhi Jayanti',
      type: 'national-holiday',
    },
  ];

  /**
   * Add verified, year-specific Indian festival dates here.
   * Month uses JavaScript month numbering: January = 0, December = 11.
   */
  private readonly yearlyFestivals: Record<number, CalendarFestival[]> = {
    2026: [],
    2027: [],
  };

  constructor(
    private publicSiteService: PublicSiteService,
    private bookingCalendarService: BookingCalendarService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadHomePageData();
  }

  // --------------------------------------------------
  // Home page data
  // --------------------------------------------------

  loadHomePageData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.loadCarousel();
    this.loadAmenities();
    this.loadFeedback();
  }

  loadCarousel(): void {
    this.publicSiteService
      .getCarousel()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.carouselImages =
            response.success && response.data ? response.data : [];
        },
        error: (error) => {
          console.error('Error loading carousel:', error);
          this.carouselImages = [];
        },
      });
  }

  loadAmenities(): void {
    this.amenitiesLoading = true;

    this.publicSiteService
      .getAmenities()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.amenities =
            response.success && response.data ? response.data : [];
          this.amenitiesLoading = false;
        },
        error: (error) => {
          console.error('Error loading amenities:', error);
          this.amenities = [];
          this.amenitiesLoading = false;
        },
      });
  }

  getAmenityIcon(title: string): string {
    const name = (title || '').toLowerCase();

    if (name.includes('pool') || name.includes('swim')) {
      return 'bi-water';
    }

    if (name.includes('kitchen') || name.includes('cook')) {
      return 'bi-cup-hot';
    }

    if (name.includes('garden') || name.includes('lawn')) {
      return 'bi-tree';
    }

    if (
      name.includes('room') ||
      name.includes('bed') ||
      name.includes('stay')
    ) {
      return 'bi-house';
    }

    return 'bi-stars';
  }

  loadFeedback(): void {
    this.feedbackLoading = true;

    this.publicSiteService
      .getFeedback()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.feedbacks =
            response.success && response.data ? response.data : [];

          this.feedbackLoading = false;
          this.setupFeedbackPagination();
        },
        error: (error) => {
          console.error('Error loading feedback:', error);
          this.feedbacks = [];
          this.feedbackLoading = false;
          this.resetFeedbackPagination();
        },
      });
  }

  private setupFeedbackPagination(): void {
    this.currentFeedbackSlide = 0;

    this.feedbackSlideCount = Math.ceil(
      this.feedbacks.length / this.feedbacksPerSlide,
    );

    this.updatePaginatedFeedbacks();
    this.startFeedbackAutoSlide();
  }

  private updatePaginatedFeedbacks(): void {
    const startIndex = this.currentFeedbackSlide * this.feedbacksPerSlide;
    const endIndex = startIndex + this.feedbacksPerSlide;

    this.paginatedFeedbacks = this.feedbacks.slice(startIndex, endIndex);
  }

  goToFeedbackSlide(slideIndex: number): void {
    if (
      slideIndex < 0 ||
      slideIndex >= this.feedbackSlideCount ||
      slideIndex === this.currentFeedbackSlide
    ) {
      return;
    }

    this.currentFeedbackSlide = slideIndex;
    this.updatePaginatedFeedbacks();
    this.restartFeedbackAutoSlide();
  }

  private goToNextFeedbackSlide(): void {
    if (this.feedbackSlideCount <= 1) {
      return;
    }

    this.currentFeedbackSlide =
      (this.currentFeedbackSlide + 1) % this.feedbackSlideCount;

    this.updatePaginatedFeedbacks();
  }

  private startFeedbackAutoSlide(): void {
    this.stopFeedbackAutoSlide();

    if (this.feedbackSlideCount <= 1) {
      return;
    }

    this.feedbackAutoSlideTimer = setInterval(() => {
      this.goToNextFeedbackSlide();
    }, this.feedbackSlideInterval);
  }

  private restartFeedbackAutoSlide(): void {
    this.startFeedbackAutoSlide();
  }

  private stopFeedbackAutoSlide(): void {
    if (this.feedbackAutoSlideTimer !== null) {
      clearInterval(this.feedbackAutoSlideTimer);
      this.feedbackAutoSlideTimer = null;
    }
  }

  private resetFeedbackPagination(): void {
    this.stopFeedbackAutoSlide();
    this.paginatedFeedbacks = [];
    this.currentFeedbackSlide = 0;
    this.feedbackSlideCount = 0;
  }

  // --------------------------------------------------
  // Custom calendar: opening and navigation
  // --------------------------------------------------

  openCalendar(field: 'checkIn' | 'checkOut'): void {
    this.activeCalendarField = field;
    this.isCalendarOpen = true;

    const selectedDate =
      field === 'checkIn' ? this.checkInDate : this.checkOutDate;

    this.calendarMonth = selectedDate
      ? this.getFirstDayOfMonth(this.parseDate(selectedDate))
      : this.getFirstDayOfMonth(new Date());
  }

  closeCalendar(): void {
    this.isCalendarOpen = false;
    this.activeCalendarField = null;
  }

  toggleCalendar(field: 'checkIn' | 'checkOut'): void {
    if (this.isCalendarOpen && this.activeCalendarField === field) {
      this.closeCalendar();
      return;
    }

    this.activeCalendarField = field;
    this.isCalendarOpen = true;

    setTimeout(() => {
      const popup = document.querySelector(
        '.booking-calendar-popup',
      ) as HTMLElement | null;

      if (!popup) {
        return;
      }

      const rect = popup.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const margin = 16;

      // Popup viewport च्या खाली जात असल्यास वरच्या बाजूला दाखवा
      if (rect.bottom > viewportHeight - margin) {
        const spaceAbove = rect.top;
        const spaceBelow = viewportHeight - rect.top;

        if (spaceAbove > rect.height || spaceAbove > spaceBelow) {
          popup.classList.add('calendar-popup-above');
        }
      }

      // Popup screen मध्ये आणा; संपूर्ण page scroll करण्याची गरज नाही
      const updatedRect = popup.getBoundingClientRect();

      if (updatedRect.bottom > viewportHeight - margin) {
        popup.style.maxHeight = `${Math.max(200, viewportHeight - updatedRect.top - margin)}px`;
      }

      if (updatedRect.top < margin) {
        popup.style.maxHeight = `${Math.max(200, viewportHeight - margin * 2)}px`;
        popup.style.top = `${margin}px`;
      }
    }, 0);
  }

  previousMonth(): void {
    const currentMonth = this.getFirstDayOfMonth(new Date());

    const candidate = new Date(
      this.calendarMonth.getFullYear(),
      this.calendarMonth.getMonth() - 1,
      1,
    );

    if (candidate < currentMonth) {
      return;
    }

    this.calendarMonth = candidate;
  }

  nextMonth(): void {
    this.calendarMonth = new Date(
      this.calendarMonth.getFullYear(),
      this.calendarMonth.getMonth() + 1,
      1,
    );
  }

  get secondCalendarMonth(): Date {
    return new Date(
      this.calendarMonth.getFullYear(),
      this.calendarMonth.getMonth() + 1,
      1,
    );
  }

  getCalendarMonths(): CalendarMonth[] {
    return [0, 1].map((offset) => {
      const month = new Date(
        this.calendarMonth.getFullYear(),
        this.calendarMonth.getMonth() + offset,
        1,
      );

      return {
        year: month.getFullYear(),
        month: month.getMonth(),
        label: month.toLocaleDateString(this.language.locale, {
          month: 'long',
          year: 'numeric',
        }),
        days: this.getCalendarDays(month),
      };
    });
  }

  getCalendarDays(monthDate: Date): CalendarDay[] {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: CalendarDay[] = [];

    // Fill the beginning of the month to align weekday columns.
    for (let i = 0; i < firstDay.getDay(); i++) {
      const date = new Date(year, month, i - firstDay.getDay() + 1);
      days.push(this.createCalendarDay(date, false));
    }

    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(this.createCalendarDay(new Date(year, month, day), true));
    }

    // Complete the final week.
    while (days.length % 7 !== 0) {
      const lastDate = days[days.length - 1].date;
      const date = new Date(
        lastDate.getFullYear(),
        lastDate.getMonth(),
        lastDate.getDate() + 1,
      );

      days.push(this.createCalendarDay(date, false));
    }

    return days;
  }

  private createCalendarDay(date: Date, isCurrentMonth: boolean): CalendarDay {
    const dateKey = this.formatDate(date);
    const checkIn = this.checkInDate ? this.parseDate(this.checkInDate) : null;
    const checkOut = this.checkOutDate
      ? this.parseDate(this.checkOutDate)
      : null;

    const isCheckIn = dateKey === this.checkInDate;
    const isCheckOut = dateKey === this.checkOutDate;

    const isInSelectedRange =
      !!checkIn &&
      !!checkOut &&
      date.getTime() > checkIn.getTime() &&
      date.getTime() < checkOut.getTime();

    return {
      date,
      dateKey,
      dayNumber: date.getDate(),
      isCurrentMonth,
      isPastDate: dateKey < this.tomorrowDate,
      isCheckIn,
      isCheckOut,
      isInSelectedRange,
      isAvailable: this.isDateAvailable(dateKey),
      isUnavailable: this.isDateUnavailable(dateKey),
      isToday: dateKey === this.todayDate,
      festivals: this.getFestivalsForDate(date),
    };
  }

  // --------------------------------------------------
  // Custom calendar: selecting dates
  // --------------------------------------------------

  selectCalendarDate(dateKey: string): void {
    const selectedDate = this.parseDate(dateKey);

    if (this.isDateDisabled(dateKey)) {
      return;
    }

    if (
      this.activeCalendarField === 'checkIn' ||
      !this.checkInDate ||
      (this.checkInDate && this.checkOutDate)
    ) {
      this.checkInDate = dateKey;
      this.checkOutDate = '';

      this.clearAvailabilityResult();

      this.activeCalendarField = 'checkOut';
      this.calendarMonth = this.getFirstDayOfMonth(selectedDate);
      return;
    }

    if (dateKey <= this.checkInDate) {
      return;
    }

    this.checkOutDate = dateKey;
    this.clearAvailabilityResult();
    this.closeCalendar();
  }

  isDateDisabled(dateKey: string): boolean {
    if (dateKey < this.tomorrowDate) {
      return true;
    }

    if (
      this.activeCalendarField === 'checkOut' &&
      this.checkInDate &&
      dateKey <= this.checkInDate
    ) {
      return true;
    }

    // Availability colors are only meaningful after a successful API call.
    // Once returned, unavailable dates cannot be selected as check-in.
    if (
      this.availabilityData &&
      this.activeCalendarField === 'checkIn' &&
      this.isDateUnavailable(dateKey)
    ) {
      return true;
    }

    return false;
  }

  private clearAvailabilityResult(): void {
    this.availabilityData = null;
    this.availabilityMessage = '';
    this.availabilityError = '';
  }

  get isPreviousMonthDisabled(): boolean {
    const today = new Date();
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const displayedMonth = new Date(
      this.calendarMonth.getFullYear(),
      this.calendarMonth.getMonth(),
      1,
    );

    return displayedMonth <= currentMonth;
  }
  // --------------------------------------------------
  // Availability result colors
  // --------------------------------------------------

  isDateAvailable(dateKey: string): boolean {
    if (!this.availabilityData) {
      return false;
    }

    return (this.availabilityData.availableDates || []).some(
      (date) => this.normalizeDate(date) === dateKey,
    );
  }

  isDateUnavailable(dateKey: string): boolean {
    if (!this.availabilityData) {
      return false;
    }

    return (this.availabilityData.unavailableDates || []).some(
      (date) => this.normalizeDate(date) === dateKey,
    );
  }

  hasAvailabilityResult(): boolean {
    return this.availabilityData !== null;
  }

  private normalizeDate(value: string): string {
    // Supports both yyyy-MM-dd and ISO date-time strings.
    return value ? value.substring(0, 10) : '';
  }

  // --------------------------------------------------
  // Indian festivals and holidays
  // --------------------------------------------------

  getFestivalsForDate(date: Date): CalendarFestival[] {
    const month = date.getMonth();
    const day = date.getDate();
    const dateKey = this.formatDate(date);

    const fixedFestivals = this.fixedDateFestivals
      .filter((festival) => festival.month === month && festival.day === day)
      .map((festival) => ({
        date: dateKey,
        name: festival.name,
        type: festival.type,
      }));

    const yearlyFestivals = (
      this.yearlyFestivals[date.getFullYear()] || []
    ).filter((festival) => festival.date === dateKey);

    return [...fixedFestivals, ...yearlyFestivals];
  }

  getFestivalListForVisibleMonths(): CalendarFestival[] {
    const months = this.getCalendarMonths();
    const firstDate = new Date(months[0].year, months[0].month, 1);
    const lastMonth = months[months.length - 1];
    const lastDate = new Date(lastMonth.year, lastMonth.month + 1, 0);

    const results: CalendarFestival[] = [];
    const current = new Date(firstDate);

    while (current <= lastDate) {
      results.push(...this.getFestivalsForDate(current));
      current.setDate(current.getDate() + 1);
    }

    return results.sort((a, b) => a.date.localeCompare(b.date));
  }

  // --------------------------------------------------
  // Availability API
  // --------------------------------------------------

  checkAvailability(): void {
    this.availabilityMessage = '';
    this.availabilityError = '';
    this.availabilityData = null;

    if (!this.checkInDate || !this.checkOutDate) {
      this.availabilityError =
        'Please select both check-in and check-out dates.';
      this.focusAvailabilityMessage();
      return;
    }

    if (this.checkInDate < this.tomorrowDate) {
      this.availabilityError = 'Check-in date must be from tomorrow onwards.';
      this.focusAvailabilityMessage();
      return;
    }

    if (this.checkOutDate <= this.checkInDate) {
      this.availabilityError = 'Check-out date must be after check-in date.';
      this.focusAvailabilityMessage();
      return;
    }

    const request: BookingCalendarAvailabilityRequest = {
      fromDate: this.checkInDate,
      toDate: this.checkOutDate,
    };

    this.availabilityLoading = true;

    this.bookingCalendarService
      .getAvailability(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.availabilityLoading = false;

          if (response.success && response.data) {
            this.availabilityData = response.data;

            if (response.data.isAvailable) {
              this.availabilityMessage =
                'Great! Your selected dates are available.';
            } else {
              this.availabilityError =
                'Your selected dates are not available. Please choose other dates.';
            }
          } else {
            this.availabilityData = null;
            this.availabilityError =
              response.message || 'Unable to check availability.';
          }

          this.focusAvailabilityMessage();
        },
        error: (error) => {
          this.availabilityLoading = false;
          this.availabilityData = null;

          this.availabilityError =
            error?.error?.message ||
            'An error occurred while checking availability. Please try again.';

          console.error('Error checking availability:', error);
          this.focusAvailabilityMessage();
        },
      });
  }

  onCheckInDateChange(): void {
    if (this.checkOutDate && this.checkOutDate <= this.checkInDate) {
      this.checkOutDate = '';
    }

    this.clearAvailabilityResult();
  }

  // --------------------------------------------------
  // Date helpers
  // --------------------------------------------------

  private getTomorrowDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return this.formatDate(date);
  }

  private getFirstDayOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private parseDate(value: string): Date {
    const [year, month, day] = value.substring(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  // --------------------------------------------------
  // Accessibility: focus availability feedback
  // --------------------------------------------------

  private focusAvailabilityMessage(): void {
    this.cdr.detectChanges();

    requestAnimationFrame(() => {
      const message = this.availabilityFeedback?.first?.nativeElement;

      if (message) {
        message.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });

        message.focus({ preventScroll: true });
      }
    });
  }

  // --------------------------------------------------
  // Cleanup
  // --------------------------------------------------

  ngOnDestroy(): void {
    this.stopFeedbackAutoSlide();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
