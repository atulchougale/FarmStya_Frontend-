export interface DeleteBookingDateReservationRequest {
  // Start date (or the single date when toDate is not provided). Format: yyyy-MM-dd
  fromDate: string;

  // Optional. When provided, the range is [fromDate, toDate) - toDate is exclusive.
  toDate?: string;
}

export interface DeleteBookingDateReservationResponse {
  farmHouseId: number;
  fromDate: string;
  toDate: string;
  deletedCount: number;
  releasedDates: string[];
}