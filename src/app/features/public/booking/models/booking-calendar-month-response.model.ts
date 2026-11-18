export interface CalendarBookedDate {
  date: string;
  status: string;
}

export interface CalendarReservedDate {
  date: string;
  status: string;
  expiresAt: string;
}

export interface BookingCalendarMonthResponse {
  farmHouseId: number;
  month: number;
  year: number;
  bookedDates: CalendarBookedDate[];
  reservedDates: CalendarReservedDate[];
}