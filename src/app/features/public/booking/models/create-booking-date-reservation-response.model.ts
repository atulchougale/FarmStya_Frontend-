export interface CreateBookingDateReservationResponse {
  farmHouseId: number;
  selectionId: string;
  reservationIds: number[];
  fromDate: string;
  toDate: string;
  reservedDates: string[];
  expiresAt: string;
}
