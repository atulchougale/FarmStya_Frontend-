import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslationPipe } from '../../../core/i18n/language';
import { AccountsService, AccountPage, AccountRow, VoucherDraft, VoucherLine } from './accounts.service';
import { localDay } from './accounts-page.component';
import Swal from 'sweetalert2';
@Component({standalone:true,imports:[CommonModule,FormsModule,RouterLink,TranslationPipe],templateUrl:'./voucher.component.html',styleUrl:'./accounts.css'})
export class AccountVoucherComponent implements OnInit {
 private api=inject(AccountsService);private route=inject(ActivatedRoute);private router=inject(Router);private destroy=inject(DestroyRef);
 id:number|null=null;record:AccountRow|null=null;rights:string[]=[];ledgers:AccountRow[]=[];vendors:AccountRow[]=[];customers:AccountRow[]=[];bills:AccountRow[]=[];masters:AccountRow[]=[];attachments:AccountRow[]=[];settlements:AccountRow[]=[];outstanding:number|null=null;saving=false;loading=false;error='';
 types=['Journal','Receipt','Payment','Transfer','Income','Expense','VendorBill','VendorPayment','OpeningBalance','Depreciation','Adjustment'];
 draft:VoucherDraft={date:localDay(),type:'Journal',narration:'',reference:'',dueDate:null,settlesVoucherId:null,lines:[]};
 ngOnInit(){this.route.paramMap.pipe(takeUntilDestroyed(this.destroy)).subscribe(p=>{this.id=p.get('id')==='new'?null:Number(p.get('id'));this.draft.type=this.route.snapshot.queryParamMap.get('type')||'Journal';this.record=null;void this.load();});}
 async load(){this.loading=true;this.error='';try{const access=await firstValueFrom(this.api.get<{permissions:string[]}>('access'));this.rights=access.data.permissions;const lookup=async(area:string)=>{const all:AccountRow[]=[];for(let page=1;page<=100;page++){const r=await firstValueFrom(this.api.get<AccountPage>(area,{page,pageSize:100}));all.push(...r.data.items);if(all.length>=r.data.total)break;}return all;};[this.ledgers,this.vendors,this.masters,this.bills,this.customers]=await Promise.all(['ledgers','vendors','masters','payables','customers'].map(lookup));if(this.id){const r=await firstValueFrom(this.api.get<{voucher:AccountRow;attachments:AccountRow[];settlements:AccountRow[];outstanding:number|null}>('vouchers/'+this.id));this.record=r.data.voucher;this.attachments=r.data.attachments;this.settlements=r.data.settlements;this.outstanding=r.data.outstanding;this.draft={date:String(this.record['voucherDate']).slice(0,10),type:String(this.record['voucherType']),narration:String(this.record['narration']),reference:String(this.record['sourceReference']||''),dueDate:this.record['dueDate']?String(this.record['dueDate']).slice(0,10):null,settlesVoucherId:this.record['settlesVoucherId']?Number(this.record['settlesVoucherId']):null,paymentModeId:this.record['paymentModeId']?Number(this.record['paymentModeId']):null,version:this.record['version'] as string,lines:(this.record['lines'] as VoucherLine[]).map(l=>({...l}))};}else if(!this.draft.lines.length){this.add();this.add();}}catch(e:unknown){this.error=this.message(e);}finally{this.loading=false;}}
 message(e:unknown){return (e as {error?:{message?:string}})?.error?.message||'Could not complete the accounting operation.';}
 can(p:string){return this.rights.includes('Accounts.'+p);}
 get posted(){return this.record?.['status']==='Posted';}
 get debit(){return this.draft.lines.reduce((sum,l)=>sum+Number(l.debit||0),0);}
 get credit(){return this.draft.lines.reduce((sum,l)=>sum+Number(l.credit||0),0);}
 get balanced(){return this.draft.lines.length>=2&&this.debit>0&&Math.abs(this.debit-this.credit)<.001&&this.draft.lines.every(l=>l.accountId>0&&((l.debit>0&&l.credit===0)||(l.credit>0&&l.debit===0)));}
 add(){if(this.draft.lines.length<200)this.draft.lines.push({accountId:0,debit:0,credit:0,description:'',vendorId:null,customerId:null,categoryId:null,costCentreId:null,taxId:null});}
 choices(kind:string){return this.masters.filter(m=>m['isActive']!==false&&(kind==='Category'?['IncomeCategory','ExpenseCategory'].includes(String(m['kind'])):m['kind']===kind));}
 name(id:unknown){return this.ledgers.find(l=>l['id']===id)?.['name']||id;}
 save(){if(this.saving||!this.balanced||this.posted)return;this.saving=true;this.error='';this.api.save('vouchers',this.id,this.draft).pipe(finalize(()=>this.saving=false),takeUntilDestroyed(this.destroy)).subscribe({next:r=>{const id=Number(r.data['id']);if(!this.id)void this.router.navigate(['/admin/accounts/vouchers',id]);else void this.load();},error:e=>this.error=this.message(e)});}
 async post(reverse=false){if(!this.id||this.saving)return;const response=await Swal.fire({icon:'question',title:reverse?'Reverse this voucher?':'Post this voucher?',text:reverse?'A linked opposite entry will be posted. The original stays unchanged.':'Posted entries cannot be edited or deleted.',showCancelButton:true,...(reverse?{input:'textarea' as const,inputLabel:'Reversal reason',inputValidator:(value:string)=>value.trim()?null:'A reason is required.'}:{})});if(!response.isConfirmed)return;this.saving=true;this.api.action('vouchers',this.id,reverse?'reverse':'post',{date:localDay(),reason:reverse?response.value:'Post voucher',version:this.record?.['version']}).pipe(finalize(()=>this.saving=false),takeUntilDestroyed(this.destroy)).subscribe({next:()=>{void this.load();},error:e=>this.error=this.message(e)});}
 upload(event:Event){const file=(event.target as HTMLInputElement).files?.[0];if(!file||!this.id)return;this.saving=true;this.api.upload(this.id,file).pipe(finalize(()=>this.saving=false),takeUntilDestroyed(this.destroy)).subscribe({next:()=>void this.load(),error:e=>this.error=this.message(e)});}
 download(a:AccountRow){this.api.download('attachments/'+a['id']).pipe(takeUntilDestroyed(this.destroy)).subscribe({next:blob=>{const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=String(a['fileName']);link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},error:e=>this.error=this.message(e)});}
}
