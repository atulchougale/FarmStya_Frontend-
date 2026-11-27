import { CustomerBookingDetailsComponent } from './customer-booking-details.component';

describe('Customer identity replacement policy', () => {
  let page: CustomerBookingDetailsComponent;
  beforeEach(() => {
    page = Object.create(CustomerBookingDetailsComponent.prototype);
    page.selectedBooking = { status: 'Approved', customerDeadline: new Date(Date.now() + 60000).toISOString() } as any;
    page.identity = null;
    page.identityLoading = false;
    page.identityError = '';
  });
  it('allows first upload when approved and within the confirmation deadline', () => {
    expect(page.canUploadIdentity).toBeTrue();
  });
  it('hides upload for existing documents while keeping confirmation available', () => {
    for (const status of ['Uploaded', 'Verified']) {
      page.identity = { status, uploadedByAdministration: true } as any;
      expect(page.canUploadIdentity).toBeFalse();
      expect(page.canConfirmBooking).toBeTrue();
    }
  });
  it('allows replacement only after an administration reupload request', () => {
    page.identity = { status: 'ReuploadRequested' } as any;
    expect(page.canUploadIdentity).toBeTrue();
    page.selectedBooking!.status = 'Confirmed';
    expect(page.canUploadIdentity).toBeTrue();
    page.selectedBooking!.status = 'CheckedOut';
    expect(page.canUploadIdentity).toBeFalse();
  });
  it('does not offer upload until document status is known', () => {
    page.identityLoading = true;
    expect(page.canUploadIdentity).toBeFalse();
    page.identityLoading = false;
    page.identityError = 'Could not load documents';
    expect(page.canUploadIdentity).toBeFalse();
  });
  it('enables advance payment for uploaded or verified identity without offering another upload', () => {
    page.selectedBookingId = 1;
    (page as any).receivedPayments = new Set<number>();
    page.uploadingIdentity = false;
    page.openingCheckout = false;
    page.verifyingAdvance = false;
    for (const status of ['Uploaded', 'Verified']) {
      page.identity = { status } as any;
      expect(page.canUploadIdentity).toBeFalse();
      expect(page.canPayAdvance).toBeTrue();
    }
    page.identity = { status: 'ReuploadRequested' } as any;
    expect(page.canPayAdvance).toBeFalse();
    page.identity = null;
    expect(page.canPayAdvance).toBeFalse();
  });

});
