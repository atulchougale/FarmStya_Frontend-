
export interface CalendarPermanentDate {
  date: string;
  status: string;
}

export interface CalendarActiveHold {
  date: string;
  status: string;
  expiresAt: string;
}

export interface BookingCalendarAvailabilityResponse {
  farmHouseId: number;
  fromDate: string;
  toDate: string;
  isAvailable: boolean;
  availableDates: string[];
  unavailableDates: string[];
  permanentDates: CalendarPermanentDate[];
  activeHolds: CalendarActiveHold[];
}
