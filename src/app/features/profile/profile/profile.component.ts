import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { TranslationPipe } from '../../../core/i18n/language';
import { AuthService } from '../../../core/services/auth.service';
import { TokenService } from '../../../core/services/token.service';
import { Profile } from '../models/profile.model';
@Component({selector:'app-profile',standalone:true,imports:[CommonModule,TranslationPipe,RouterLink],templateUrl:'./profile.component.html',styleUrl:'./profile.component.css'})
export class ProfileComponent implements OnInit {
 @Input() embedded = false;
 private auth=inject(AuthService); private tokens=inject(TokenService);
 profile:Profile|null=null; isLoading=false; error=''; message=''; sending=false;
 get initials():string{return (this.profile?.fullName??'').split(/\s+/).filter(Boolean).slice(0,2).map(n=>n[0]).join('').toUpperCase();}
 ngOnInit():void{this.load();}
 load():void{this.isLoading=true;this.error='';this.auth.getProfile().pipe(finalize(()=>this.isLoading=false)).subscribe({next:r=>{if(r.success){this.profile=r.data;this.tokens.updateProfileDetails(r.data);}else this.error=r.message;},error:e=>this.error=e.error?.message??'Unable to load profile.'});}
 verifyEmail():void{if(!this.profile?.email||this.profile.isEmailVerified||this.sending)return;this.sending=true;this.message='';this.auth.updateEmail(this.profile.email).pipe(finalize(()=>this.sending=false)).subscribe({next:r=>this.message=r.message,error:e=>this.error=e.error?.message??'Unable to send verification email.'});}
}
