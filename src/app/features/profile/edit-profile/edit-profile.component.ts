import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslationPipe } from '../../../core/i18n/language';
import { AlertService } from '../../../core/services/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileComponent } from '../profile/profile.component';
import { Profile } from '../models/profile.model';
type Channel='mobile'|'email';
@Component({selector:'app-edit-profile',standalone:true,imports:[CommonModule,FormsModule,TranslationPipe,RouterLink,ProfileComponent],templateUrl:'./edit-profile.component.html',styleUrls:['../profile/profile.component.css']})
export class EditProfileComponent implements OnInit {
 private alerts=inject(AlertService); private auth=inject(AuthService);private router=inject(Router);
 profile:Profile|null=null; fullName='';mobile='';email='';loading=true;busy=false;error='';message='';
 codes={mobile:'',email:''};sent={mobile:'',email:''};verified={mobile:'',email:''};
 channels:Channel[]=['mobile','email'];
 ngOnInit():void{this.auth.getProfile().pipe(finalize(()=>this.loading=false)).subscribe({next:r=>{if(r.success){this.profile=r.data;this.fullName=r.data.fullName;this.mobile=r.data.mobileNumber;this.email=r.data.email??'';}else this.error=r.message;},error:e=>this.error=e.error?.message??'Unable to load profile.'});}
 value(c:Channel):string{return c==='mobile'?this.mobile.trim():this.email.trim().toLowerCase();}
 valid(c:Channel):boolean{return c==='mobile'?/^[0-9]{10}$/.test(this.value(c)):/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value(c))&&this.value(c).length<=150;}
 isVerified(c:Channel):boolean {const current=c==='mobile'?this.profile?.mobileNumber:this.profile?.email;return !!this.value(c)&&((this.value(c)===(current??'').trim().toLowerCase()&&(c==='mobile'?this.profile?.isMobileVerified:this.profile?.isEmailVerified)===true)||this.verified[c]===this.value(c));}
 get canSave():boolean{return !!this.profile&&!!this.fullName.trim()&&this.fullName.trim().length<=150&&this.valid('mobile')&&this.isVerified('mobile')&&(!this.email.trim()||(this.valid('email')&&this.isVerified('email')));}
 changed(c:Channel):void{this.verified[c]='';this.sent[c]='';this.codes[c]='';this.error='';this.message='';}
 send(c:Channel):void{if(this.busy||!this.valid(c))return;this.busy=true;this.error='';const value=this.value(c);this.auth.requestProfileCode(c,value).pipe(finalize(()=>this.busy=false)).subscribe({next:r=>{if(r.success){this.sent[c]=value;this.codes[c]='';this.verified[c]='';this.message=r.message;}else this.error=r.message;},error:e=>this.error=e.error?.message??'Unable to send verification code.'});}
 verify(c:Channel):void{if(this.busy||!/^\d{6}$/.test(this.codes[c]))return;this.busy=true;this.error='';const value=this.value(c);this.auth.verifyProfileCode(c,value,this.codes[c]).pipe(finalize(()=>this.busy=false)).subscribe({next:r=>{if(r.success){this.verified[c]=value;this.message=r.message;this.alerts.toast('Contact verified successfully');}else this.error=r.message;},error:e=>this.error=e.error?.message??'Unable to verify code.'});}
 save():void{if(!this.canSave||this.busy)return;this.busy=true;this.error='';this.auth.updateProfile({fullName:this.fullName.trim(),mobileNumber:this.value('mobile'),email:this.value('email')||null}).pipe(finalize(()=>this.busy=false)).subscribe({next:r=>{if(r.success){void this.alerts.success('Profile updated','Your verified profile changes have been saved.').then(()=>this.router.navigate(['/profile']));}else {this.error=r.message;void this.alerts.error('Profile could not be updated',this.error);}},error:e=>{this.error=e.error?.message??'Unable to update profile.';void this.alerts.error('Profile could not be updated',this.error);}});}
}
