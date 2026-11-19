import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { finalize } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { TranslationPipe } from '../../../../core/i18n/language';
import { ADMIN_BOOKING_CONTEXT, AdminBookingContext, AdminCustomer } from '../../../../core/services/admin-booking-context';
import { BookingCalendarService } from '../../../../core/services/booking-calendar.service';
import { BookingPricingService } from '../../../../core/services/booking-pricing.service';
import { BookingSubmissionService } from '../../../../core/services/booking-submission.service';
import { BookingPageComponent } from '../../../public/booking/booking-page/booking-page.component';

interface Response<T> { success:boolean;message:string;data:T; }
@Component({
  standalone:true,
  imports:[CommonModule,FormsModule,TranslationPipe,BookingPageComponent],
  providers:[
    {provide:ADMIN_BOOKING_CONTEXT,useFactory:():AdminBookingContext=>({customer:null,source:'WalkIn'})},
    BookingCalendarService,BookingPricingService,BookingSubmissionService
  ],
  templateUrl:'./admin-create-booking.component.html'
})
export class AdminCreateBookingComponent {
  readonly context=inject(ADMIN_BOOKING_CONTEXT);
  private readonly http=inject(HttpClient);
  private readonly url=environment.apiUrl+'/administration/bookings';
  mobile='';
  fullName='';
  email='';
  otp='';
  searched=false;
  busy=false;
  bookingOpen=false;
  message='';
  error='';
  lookup():void {
    if(this.busy || !/^[0-9]{10}$/.test(this.mobile))return;
    this.busy=true;this.error='';this.message='';
    this.http.get<Response<AdminCustomer|null>>(this.url+'/customers',{params:{mobileNumber:this.mobile}})
      .pipe(finalize(()=>this.busy=false)).subscribe({
        next:r=>{this.context.customer=r.data;this.searched=true;},
        error:e=>{this.error=e.error?.message??'Could not find customer.';}
      });
  }
  register():void {
    if(this.busy || !this.fullName.trim())return;
    this.busy=true;this.error='';
    this.http.post<Response<AdminCustomer>>(this.url+'/customers',{fullName:this.fullName,mobileNumber:this.mobile,email:this.email.trim()||null})
      .pipe(finalize(()=>this.busy=false)).subscribe({
        next:r=>{this.context.customer=r.data;this.message=r.message;},
        error:e=>{this.error=e.error?.message??'Could not register customer.';}
      });
  }
  verify():void {
    if(this.busy || !this.context.customer || !/^[0-9]{6}$/.test(this.otp))return;
    this.busy=true;this.error='';
    this.http.post<Response<AdminCustomer>>(this.url+'/customers/'+this.context.customer.userId+'/verify-mobile',{otp:this.otp})
      .pipe(finalize(()=>this.busy=false)).subscribe({
        next:r=>{this.context.customer=r.data;this.message=r.message;this.otp='';},
        error:e=>{this.error=e.error?.message??'Could not verify mobile.';}
      });
  }
  resend():void {
    if(this.busy || !this.context.customer)return;
    this.busy=true;this.error='';
    this.http.post<Response<boolean>>(this.url+'/customers/'+this.context.customer.userId+'/resend-verification',{})
      .pipe(finalize(()=>this.busy=false)).subscribe({
        next:r=>{this.message=r.message;},error:e=>{this.error=e.error?.message??'Could not resend verification.';}
      });
  }
}
