import { TestBed } from '@angular/core/testing';

import { PublicSiteService } from './public-site.service';

describe('PublicSiteService', () => {
  let service: PublicSiteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PublicSiteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
