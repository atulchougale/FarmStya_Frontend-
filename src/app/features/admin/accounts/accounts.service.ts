import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
export type AccountRow = Record<string, unknown>;
export interface AccountPage { items: AccountRow[]; total: number; page: number; pageSize: number; }
export interface AccountsResponse<T> { success: boolean; message: string; data: T; }
export interface VoucherLine { accountId: number; debit: number; credit: number; description: string; vendorId: number|null; customerId: number|null; categoryId: number|null; costCentreId: number|null; taxId: number|null; }
export interface VoucherDraft { date: string; type: string; narration: string; reference: string; dueDate: string|null; settlesVoucherId: number|null; version?: string; paymentModeId?: number|null; lines: VoucherLine[]; }
@Injectable({providedIn:'root'})
export class AccountsService {
 private readonly http=inject(HttpClient);
 private readonly base=environment.apiUrl+'/administration/accounts';
 private params(values:Record<string,unknown>) { let p=new HttpParams();for(const [k,v] of Object.entries(values))if(v!==null&&v!==undefined&&v!=='')p=p.set(k,String(v));return p; }
 get<T>(area:string,query:Record<string,unknown>={}) {return this.http.get<AccountsResponse<T>>(this.base+'/'+area,{params:this.params(query)});}
 save(area:string,id:number|null,input:unknown) {return id?this.http.put<AccountsResponse<AccountRow>>(this.base+'/'+area+'/'+id,input):area==='settings'?this.http.put<AccountsResponse<AccountRow>>(this.base+'/settings',input):this.http.post<AccountsResponse<AccountRow>>(this.base+'/'+area,input);}
 action(area:string,id:number,action:string,input:unknown){return this.http.post<AccountsResponse<AccountRow>>(`${this.base}/${area}/${id}/${action}`,input);}
 upload(id:number,file:File){const f=new FormData();f.append('file',file);return this.http.post<AccountsResponse<AccountRow>>(`${this.base}/vouchers/${id}/attachments`,f);}
 download(path:string,query:Record<string,unknown>={}){return this.http.get(this.base+'/'+path,{params:this.params(query),responseType:'blob'});}
}
