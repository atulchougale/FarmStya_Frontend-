import { BookingDetailsComponent } from './booking-details.component';

describe('Administration identity upload selection', () => {
  let component: BookingDetailsComponent;
  beforeEach(() => {
    component = Object.create(BookingDetailsComponent.prototype);
    component.selectedFiles = [];
    component.confirmationIdentity = null;
    component.confirmationLoading = false;
    component.booking = { canManageConfirmation: true, status: 'Approved' } as any;
  });
  function choose(...files: File[]): void {
    component.chooseFiles({ target: { files, value: 'selected' } } as unknown as Event);
  }
  it('keeps front and back when selected in separate file dialogs', () => {
    choose(new File(['front'], 'front.jpg'));
    choose(new File(['back'], 'back.jpg'));
    expect(component.selectedFiles.map(f => f.name)).toEqual(['front.jpg', 'back.jpg']);
  });
  it('rejects a third file and keeps the existing two', () => {
    choose(new File(['front'], 'front.jpg'), new File(['back'], 'back.jpg'));
    choose(new File(['third'], 'third.jpg'));
    expect(component.selectedFiles.length).toBe(2);
    expect(component.error).toContain('maximum of two');
  });
  it('hides upload after success and permits requested replacement', () => {
    expect(component.canUploadIdentity).toBeTrue();
    component.confirmationIdentity = { status: 'Uploaded' } as any;
    expect(component.canUploadIdentity).toBeFalse();
    component.confirmationIdentity = { status: 'ReuploadRequested' } as any;
    expect(component.canUploadIdentity).toBeTrue();
    component.confirmationLoading = true;
    expect(component.canUploadIdentity).toBeFalse();
  });
});
