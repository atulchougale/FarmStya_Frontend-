import { Component, ElementRef, Input, OnChanges, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TranslationPipe } from '../../../core/i18n/language';
import { VideoPreviewService } from './video-preview.service';

@Component({selector:'app-video-preview',standalone:true,imports:[CommonModule,TranslationPipe],
 template:`<img *ngIf="image; else placeholder" [src]="image" [alt]="label" /><ng-template #placeholder><span class="video-placeholder"><i class="bi bi-camera-video" aria-hidden="true"></i><span>{{ (loading?'Loading preview…':'Video') | t }}</span><small *ngIf="!loading">{{ 'Open to play video' | t }}</small></span></ng-template>`,
 styles:[`:host{display:block;width:100%;height:100%;min-height:0}img{display:block;width:100%;height:100%;object-fit:cover}.video-placeholder{display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;width:100%;height:100%;background:var(--primary-50);color:var(--primary-700);padding:8px;text-align:center;font-size:14px}.video-placeholder i{font-size:32px}.video-placeholder small{font-size:12px}`]})
export class VideoPreviewComponent implements OnChanges, OnDestroy {
  @Input({required:true}) src=''; @Input() label='Video'; @Input() revision=0;
  image: string | null=null; loading=true;
  private readonly service=inject(VideoPreviewService);
  private readonly element=inject(ElementRef<HTMLElement>);
  private observer?:IntersectionObserver; private subscription?:Subscription;
  ngOnChanges(){
    this.observer?.disconnect();this.subscription?.unsubscribe();this.image=null;this.loading=true;
    const start=()=>{this.observer?.disconnect();this.subscription=this.service.preview(this.src).subscribe(image=>{this.image=image;this.loading=false;});};
    if(typeof IntersectionObserver==='undefined')start();
    else{this.observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))start();},{rootMargin:'160px'});this.observer.observe(this.element.nativeElement);}
  }
  ngOnDestroy(){this.observer?.disconnect();this.subscription?.unsubscribe();}
}
