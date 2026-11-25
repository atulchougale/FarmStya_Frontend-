import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Booking } from '../Booking/models/booking.model';
export interface DashboardSummary { serverToday:string;bookingsThisWeek:number;bookingsThisMonth:number;totalRevenue:number;revenueThisMonth:number;occupiedDays:number;daysInMonth:number;occupancyPercent:number; }
export interface CalendarBooking { stayDate:string;bookingId:number;bookingReference:string;fullName:string;status:string; }
export interface RevenueMonth { monthStart:string;amount:number; }
export interface BookingSourceTotal { source:string;bookingCount:number; }
interface Response<T>{success:boolean;message:string;data:T;}
@Injectable({providedIn:'root'})
export class DashboardService {
 private readonly http=inject(HttpClient);private readonly url=environment.apiUrl+'/administration/dashboard';
 get(){return this.http.get<Response<{summary:DashboardSummary;latestBookings:Booking[];revenueTrend:RevenueMonth[];bookingSources:BookingSourceTotal[]}>>(this.url);}
 calendar(year:number,month:number){return this.http.get<Response<CalendarBooking[]>>(this.url+'/calendar',{params:{year,month}});}
}
