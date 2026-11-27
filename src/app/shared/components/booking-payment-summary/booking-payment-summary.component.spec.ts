import { bookingSettlementLabel } from './booking-payment-summary.component';

describe('Booking settlement display', () => {
  it('shows full discount before considering zero paid as fully paid', () => {
    expect(bookingSettlementLabel({ totalAmount: 5000, discountAmount: 5000, totalPaid: 0 })).toBe('Fully Discounted');
  });
  it('shows fully paid when the verified net amount covers the discounted total', () => {
    expect(bookingSettlementLabel({ totalAmount: 5000, discountAmount: 500, totalPaid: 4500 })).toBe('Fully Paid');
  });
  it('does not label an outstanding balance as paid', () => {
    expect(bookingSettlementLabel({ totalAmount: 5000, discountAmount: 500, totalPaid: 1000 })).toBeNull();
  });
  it('does not mistake zero booking total for full discount or payment', () => {
    expect(bookingSettlementLabel({ totalAmount: 0, discountAmount: 0, totalPaid: 0 })).toBeNull();
  });
  it('does not claim fully paid after a refund', () => {
    expect(bookingSettlementLabel({ totalAmount: 5000, discountAmount: 0, totalPaid: 5000, refundedAmount: 100 })).toBeNull();
  });
  it('compares INR amounts at paise precision', () => {
    expect(bookingSettlementLabel({ totalAmount: 0.3, discountAmount: 0.1, totalPaid: 0.2 })).toBe('Fully Paid');
  });
});
