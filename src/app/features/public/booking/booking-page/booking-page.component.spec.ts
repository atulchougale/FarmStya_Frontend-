import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { Subject } from 'rxjs';
import { AlertService } from '../../../../core/services/alert.service';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { BookingSubmissionService, SubmittedBooking } from '../../../../core/services/booking-submission.service';

import { BookingPageComponent } from './booking-page.component';

describe('BookingPageComponent', () => {
  let component: BookingPageComponent;
  let fixture: ComponentFixture<BookingPageComponent>;
  let submission: jasmine.SpyObj<BookingSubmissionService>;

  beforeEach(async () => {
    submission = jasmine.createSpyObj<BookingSubmissionService>('BookingSubmissionService', ['submit']);
    const alerts=jasmine.createSpyObj<AlertService>('AlertService',['show','error','warning','success','toast']);
    alerts.show.and.returnValue(Promise.resolve({isConfirmed:false,isDenied:false,isDismissed:true}));
    await TestBed.configureTestingModule({
      imports: [BookingPageComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: BookingSubmissionService, useValue: submission }, {provide:AlertService,useValue:alerts}],
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
  it('loads December and January availability into their respective calendar panels', () => {
    const http = TestBed.inject(HttpTestingController);
    component.calendarMonth = new Date(2028, 11, 1);
    component.loadCalendarMonth();
    const first = http.expectOne(r => r.url.endsWith('/month') && r.params.get('month') === '12' && r.params.get('year') === '2028');
    const second = http.expectOne(r => r.url.endsWith('/month') && r.params.get('month') === '1' && r.params.get('year') === '2029');
    first.flush({success:true,data:{farmHouseId:1,month:12,year:2028,bookedDates:[{date:'2028-12-20',status:'Booked'}],reservedDates:[]}});
    expect(component.loadingCalendar).toBeTrue();
    second.flush({success:true,data:{farmHouseId:1,month:1,year:2029,bookedDates:[],reservedDates:[{date:'2029-01-03',status:'Reserved',expiresAt:new Date(Date.now()+60000).toISOString()}]}});
    expect(component.loadingCalendar).toBeFalse();
    expect(component.calendarDays.find(d=>d.dateKey==='2028-12-20')?.isBooked).toBeTrue();
    expect(component.nextCalendarDays.find(d=>d.dateKey==='2029-01-03')?.isReserved).toBeTrue();
    expect(component.calendarDays.filter(d=>d.isCurrentMonth).length).toBe(31);
    expect(component.nextCalendarDays.filter(d=>d.isCurrentMonth).length).toBe(31);
    http.verify();
  });

  it('does not expose an available calendar when the second month fails', () => {
    const http=TestBed.inject(HttpTestingController);
    component.calendarMonth=new Date(2028,11,1);
    component.loadCalendarMonth();
    http.expectOne(r=>r.url.endsWith('/month')&&r.params.get('month')==='12').flush({success:true,data:{farmHouseId:1,month:12,year:2028,bookedDates:[],reservedDates:[]}});
    http.expectOne(r=>r.url.endsWith('/month')&&r.params.get('month')==='1').flush('Unavailable',{status:503,statusText:'Unavailable'});
    expect(component.calendarData).toBeNull();
    expect(component.errorMessage).toContain('Unable to load calendar');
    http.verify();
  });

  it('shows selected range boundaries in both months with own reserved dates usable', () => {
    component.calendarMonth=new Date(2028,11,1);
    component.checkInDate='2028-12-30';component.checkOutDate='2029-01-03';component.selectionId='own';
    component['ownReservedDateKeys'].add('2029-01-01');
    component.calendarData={farmHouseId:1,month:12,year:2028,bookedDates:[],reservedDates:[{date:'2029-01-01',status:'Reserved',expiresAt:new Date(Date.now()+60000).toISOString()}]};
    component['buildCalendarDays']();
    expect(component.calendarDays.find(d=>d.dateKey==='2028-12-30')?.isCheckIn).toBeTrue();
    expect(component.nextCalendarDays.find(d=>d.dateKey==='2029-01-03')?.isCheckOut).toBeTrue();
    expect(component.nextCalendarDays.find(d=>d.dateKey==='2029-01-01')?.isReserved).toBeFalse();
    expect(component.nextCalendarDays.find(d=>d.dateKey==='2029-01-01')?.isInRange).toBeTrue();
    expect(component.selectedStayDays).toBe(4);
  });

  it('does not request authenticated prices or holds before the customer signs in', () => {
    const http=TestBed.inject(HttpTestingController);
    spyOn(component as any,'getStoredAccessToken').and.returnValue(null);
    spyOn(component as any,'loadCustomerDetails').and.stub();
    spyOn(component as any,'restoreBookingDraft').and.stub();
    component.ngOnInit();
    const requests=http.match(()=>true);
    expect(requests.length).toBe(2);
    expect(requests.every(r=>r.request.url.endsWith('/booking-calendar/month'))).toBeTrue();
    requests.forEach(r=>r.flush({success:true,data:{farmHouseId:1,month:Number(r.request.params.get('month')),year:Number(r.request.params.get('year')),bookedDates:[],reservedDates:[]}}));
    http.verify();
  });

});
