
export interface Booking {
  bookingId: number;
  bookingSource: 'Online' | 'WalkIn' | 'Phone';
  createdBy: number;
  canManageConfirmation?: boolean;
  hasPendingAdvanceOrder?: boolean;
  bookingReference: string;
  fullName: string;
  email: string;
  mobileNumber: string;

  adultCount: number;
  childrenCount: number;
  personCount: number;

  checkInDate: string;
  checkOutDate: string;
  actualCheckInAt?: string | null;
  actualCheckOutAt?: string | null;
  checkoutPaidAt?: string | null;
  stayDays: number;
  bookingType: string;

  baseAmount?: number;
  eventAmount?: number;
  totalAmount: number;
  currencyCode: string;
  ownerDeadline: string;
  customerDeadline?: string;
  canDecide: boolean;
  canCheckIn?: boolean;
  canCheckout?: boolean;
  totalPaid: number;
  refundedAmount?: number;
  advancePaid: number;
  discountAmount: number;
  discounts?: { amount: number; reason: string; enteredBy: number; enteredByName?: string | null; createdDate: string }[];
  remainingAmount: number;
  hasIdentityDocument?: boolean;
  identityDocumentType?: string;
  otherIdentityDocumentType?: string;
  identityFileCount?: number;

  advanceDailyRateSnapshot?: number;
  advanceAmount: number;
  bookingDailyRateSnapshot?: number;
  eventDailyRateSnapshot?: number;

  customerNotes?: string;

  status: string;
  createdDate: string;

  rejectionReason?: string;
  cancellationReason?: string;

  eventDates?: BookingEventDate[];
  statusHistory?: BookingStatusHistory[];
}

export interface BookingEventDate {
  bookingEventDateId: number;
  eventDate: string;
  eventType: string;
  dailyRateSnapshot: number;
}

export interface BookingStatusHistory {
  oldStatus?: string;
  newStatus: string;
  reason?: string;
  actorType: string;
  createdDate: string;
}

export interface BookingListParams {
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
