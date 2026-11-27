import { AccountsBreadcrumbComponent } from './accounts-breadcrumb.component';
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { TranslationPipe } from '../../../core/i18n/language';
import { TokenService } from '../../../core/services/token.service';
import { AccountsService, AccountPage, AccountRow } from './accounts.service';
interface PaidPayment {paymentTransactionId:number;paymentType:string;paymentMethod:string;amount:number;refunded:number;}
interface RefundBooking {bookingId:number;bookingReference:string;fullName:string;status:string;payments:PaidPayment[];refunds:{paymentTransactionId:number;amount:number;refundReason:string;}[];}
@Component({standalone:true,imports:[CommonModule,FormsModule,RouterLink,TranslationPipe,AccountsBreadcrumbComponent],templateUrl:'./refunds.component.html',styleUrl:'./accounts.css'})
export class AccountRefundsComponent implements OnInit {
 private readonly api=inject(AccountsService);private readonly route=inject(ActivatedRoute);private readonly token=inject(TokenService);
 reference='';booking:RefundBooking|null=null;moneyAccounts:AccountRow[]=[];rights:string[]=[];busy=false;error='';notice='';
 requestId=crypto.randomUUID();paymentId=0;moneyId=0;amount:number|null=null;reason='';bankReference='';actuallyPaid=false;
 get payment(){return this.booking?.payments.find(p=>p.paymentTransactionId===this.paymentId);}
 get maximum(){return Math.max(0,(this.payment?.amount??0)-(this.payment?.refunded??0));}
 get bank(){return this.moneyAccounts.find(m=>m['id']===this.moneyId)?.['kind']==='Bank';}
 get canRecord(){return this.rights.includes('Accounts.Post')&&['Admin','Farm Owner','FarmOwner','Super Admin'].includes(this.token.getCurrentUser()?.roleName??'');}
 async ngOnInit(){try{const access=await firstValueFrom(this.api.get<{permissions:string[]}>('access'));this.rights=access.data.permissions;for(let page=1;page<=100;page++){const response=await firstValueFrom(this.api.get<AccountPage>('money-accounts',{page,pageSize:100}));this.moneyAccounts.push(...response.data.items.filter(m=>m['isActive']!==false));if(page*100>=response.data.total)break;}this.reference=this.route.snapshot.queryParamMap.get('bookingReference')??'';if(this.reference)await this.lookup();}catch{this.error='Could not load refund access or Money Accounts.';}}
 async lookup(){if(this.busy||!this.reference.trim())return;this.busy=true;this.error='';try{const result=await firstValueFrom(this.api.get<RefundBooking>('refunds/payments',{bookingReference:this.reference.trim()}));this.booking=result.data;}catch(e:any){this.booking=null;this.error=e.error?.message||'Booking not found.';}finally{this.busy=false;}}
 async submit(){if(this.busy||!this.canRecord||!this.booking||!this.actuallyPaid||!this.payment||!this.moneyId||this.amount===null||this.amount<=0||this.amount>this.maximum||!this.reason.trim()||(this.bank&&!this.bankReference.trim()))return;this.busy=true;this.error='';try{await firstValueFrom(this.api.refund({requestId:this.requestId,originalPaymentTransactionId:this.paymentId,moneyAccountId:this.moneyId,amount:this.amount,reason:this.reason.trim(),reference:this.bankReference.trim()||null,actuallyPaid:true}));this.notice='Actual refund recorded. Accounting posting will use the selected Money Account.';this.requestId=crypto.randomUUID();this.actuallyPaid=false;this.amount=null;this.reason='';this.bankReference='';}catch(e:any){this.error=e.error?.message||'Could not record refund. Retry with the same request.';}finally{this.busy=false;}if(!this.error)await this.lookup();}
}
