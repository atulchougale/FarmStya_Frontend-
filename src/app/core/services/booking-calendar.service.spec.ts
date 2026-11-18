import { TestBed } from '@angular/core/testing';

import { BookingCalendarService } from './booking-calendar.service';

describe('BookingCalendarService', () => {
  let service: BookingCalendarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BookingCalendarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
