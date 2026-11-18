import { Injectable } from '@angular/core';

export interface BookingDraft {
  farmHouseId: number;
  userId: number;
  currentStep: number;

  customerDetails: {
    fullName: string;
    mobileNumber: string;
    email: string;
  };

  guestDetails: {
    AdultCount: number;
    ChildrenCount: number;
    PersonCount: number;
    CustomerNotes: string;
  };

  dateDetails: {
    checkInDate: string | null;
    checkOutDate: string | null;
    selectionId: string | null;
    reservationExpiresAt: string | null;
  };

  eventDetails: Record<string, unknown>;
  bookingDetails: Record<string, unknown>;

  savedAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class BookingDraftService {
  private readonly storageKey = 'farmstay_booking_draft';

  // CREATE
  createDraft(draft: BookingDraft): boolean {
    try {
      const newDraft: BookingDraft = {
        ...draft,
        savedAt: Date.now(),
      };

      localStorage.setItem(this.storageKey, JSON.stringify(newDraft));

      return true;
    } catch (error) {
      console.error('Unable to create booking draft:', error);
      return false;
    }
  }

  // READ
  getDraft(): BookingDraft | null {
    try {
      const storedDraft = localStorage.getItem(this.storageKey);

      if (!storedDraft) {
        return null;
      }

      return JSON.parse(storedDraft) as BookingDraft;
    } catch (error) {
      console.error('Unable to read booking draft:', error);
      return null;
    }
  }

  // UPDATE
  updateDraft(updates: Partial<BookingDraft>): boolean {
    try {
      const existingDraft = this.getDraft();

      if (!existingDraft) {
        return false;
      }

      const updatedDraft: BookingDraft = {
        ...existingDraft,
        ...updates,

        customerDetails: {
          ...existingDraft.customerDetails,
          ...updates.customerDetails,
        },

        guestDetails: {
          ...existingDraft.guestDetails,
          ...updates.guestDetails,
        },

        dateDetails: {
          ...existingDraft.dateDetails,
          ...updates.dateDetails,
        },

        eventDetails: {
          ...existingDraft.eventDetails,
          ...updates.eventDetails,
        },

        bookingDetails: {
          ...existingDraft.bookingDetails,
          ...updates.bookingDetails,
        },

        savedAt: Date.now(),
      };

      localStorage.setItem(this.storageKey, JSON.stringify(updatedDraft));

      return true;
    } catch (error) {
      console.error('Unable to update booking draft:', error);
      return false;
    }
  }

  // DELETE
  deleteDraft(): boolean {
    try {
      localStorage.removeItem(this.storageKey);
      return true;
    } catch (error) {
      console.error('Unable to delete booking draft:', error);
      return false;
    }
  }
}
