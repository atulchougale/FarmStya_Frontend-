import { InjectionToken } from '@angular/core';
export interface AdminCustomer {
  userId: number; farmHouseId: number; fullName: string; mobileNumber: string; email?: string;
  isMobileVerified: boolean; isEmailVerified: boolean; hasMembership: boolean; canBook: boolean;
}
export interface AdminBookingContext { customer: AdminCustomer | null; source: 'WalkIn' | 'Phone'; }
export const ADMIN_BOOKING_CONTEXT = new InjectionToken<AdminBookingContext>('AdminBookingContext');
