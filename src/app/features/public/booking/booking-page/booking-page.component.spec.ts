import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { BookingSubmissionService, SubmittedBooking } from '../../../../core/services/booking-submission.service';

import { BookingPageComponent } from './booking-page.component';

describe('BookingPageComponent', () => {
  let component: BookingPageComponent;
  let fixture: ComponentFixture<BookingPageComponent>;
  let submission: jasmine.SpyObj<BookingSubmissionService>;

  beforeEach(async () => {
    submission = jasmine.createSpyObj<BookingSubmissionService>('BookingSubmissionService', ['submit']);
    await TestBed.configureTestingModule({
      imports: [BookingPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: BookingSubmissionService, useValue: submission }],
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingPageComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  function prepareSubmission(): void {
    component.currentStep = 6;
    component.selectionId = 'selected-hold';
    component.checkInDate = '2026-12-10';
    component.checkOutDate = '2026-12-11';
    component.reservationExpiresAt = new Date(Date.now() + 60_000).toISOString();
    component['heldReservationIds'].set('2026-12-10', 1);
    component.quote = {
      stayDays: 1, eventDays: 0, stayRate: 5000, eventRate: 0, advanceRate: 1000,
      stayAmount: 5000, eventAmount: 0, totalAmount: 5000, advanceAmount: 1000,
      remainingAmount: 4000, currencyCode: 'INR', pricingVersion: 'initial-quote',
    };
  }

  it('sends one request when Submit is clicked twice', () => {
    prepareSubmission();
    submission.submit.and.returnValue(new Subject<ApiResponse<SubmittedBooking>>());

    component.submitBooking();
    component.submitBooking();

    expect(submission.submit).toHaveBeenCalledTimes(1);
  });

  it('does not submit a hold whose deadline has elapsed before the countdown rerenders', () => {
    prepareSubmission();
    component.reservationExpiresAt = new Date(Date.now() - 1).toISOString();

    component.submitBooking();

    expect(submission.submit).not.toHaveBeenCalled();
  });

  it('shows the date conflict when another customer books the dates', () => {
    prepareSubmission();
    const request = new Subject<ApiResponse<SubmittedBooking>>();
    submission.submit.and.returnValue(request);
    component.submitBooking();
    request.error({ status: 409, error: { message: 'One or more selected dates are no longer available.',
      data: { code: 'DATE_UNAVAILABLE' } } });

    expect(component.errorMessage).toContain('no longer available');
    expect(component.submissionUncertain).toBeFalse();
  });

  it('points to My Bookings and reuses the same key when a response is lost', () => {
    prepareSubmission();
    const request = new Subject<ApiResponse<SubmittedBooking>>();
    submission.submit.and.returnValues(request, new Subject<ApiResponse<SubmittedBooking>>());
    component.submitBooking();
    const key = component.submittedBookingPayload?.idempotencyKey;
    request.error({ status: 0 });

    expect(component.submissionUncertain).toBeTrue();
    expect(component.errorMessage).toContain('My Bookings');
    component.submitBooking();
    expect(component.submittedBookingPayload?.idempotencyKey).toBe(key);
  });
});
