import { TestBed } from '@angular/core/testing';

import { BookingDraftService } from './booking-draft.service';

describe('BookingDraftService', () => {
  let service: BookingDraftService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BookingDraftService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
