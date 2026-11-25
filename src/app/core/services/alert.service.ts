import { Injectable, inject } from '@angular/core';
import Swal, { SweetAlertOptions, SweetAlertResult, SweetAlertIcon } from 'sweetalert2';
import { LanguageService } from '../i18n/language';

/** Shared translated alerts. CSS tokens resolve the current theme when the popup opens. */
@Injectable({providedIn:'root'})
export class AlertService {
 private readonly language=inject(LanguageService);
 show(options:SweetAlertOptions):Promise<SweetAlertResult> {
   return Swal.fire({
     buttonsStyling:false, heightAuto:false, returnFocus:true,
     ...options,
     title:typeof options.title==='string'?this.language.translate(options.title):options.title,
     text:options.text?this.language.translate(options.text):options.text,
     confirmButtonText:this.language.translate(options.confirmButtonText??'OK'),
     cancelButtonText:this.language.translate(options.cancelButtonText??'Cancel'),
   });
 }
 success(title:string,text:string){return this.show({icon:'success',title,text});}
 error(title:string,text:string){return this.show({icon:'error',title,text});}
 warning(title:string,text:string){return this.show({icon:'warning',title,text});}
 toast(title:string,icon:SweetAlertIcon='success'):void {
   void this.show({title,icon,toast:true,position:'top-end',showConfirmButton:false,timer:2600,timerProgressBar:true});
 }
 async confirm(title:string,text:string,confirmButtonText='Continue'):Promise<boolean>{
   return (await this.show({icon:'question',title,text,showCancelButton:true,focusCancel:true,confirmButtonText})).isConfirmed;
 }
}
