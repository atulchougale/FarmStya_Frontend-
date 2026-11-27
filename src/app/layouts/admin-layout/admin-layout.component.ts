import { AfterViewInit, Component, ElementRef, HostListener, Injector, NgZone, OnDestroy, ViewChild, afterNextRender, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { TranslationPipe } from '../../core/i18n/language';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { AdminSidebarComponent } from '../../features/admin/admin-sidebar/admin-sidebar.component';

export const SIDEBAR_MIN = 224;
export const SIDEBAR_MAX = 384;
export const SIDEBAR_DEFAULT = 280;
export function sidebarWidth(value: number): number {
  return Number.isFinite(value) ? Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, Math.round(value / 8) * 8)) : SIDEBAR_DEFAULT;
}
@Component({
  selector: 'app-admin-layout', standalone: true,
  imports: [RouterOutlet, HeaderComponent, AdminSidebarComponent, TranslationPipe, A11yModule],
  templateUrl: './admin-layout.component.html', styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent implements AfterViewInit, OnDestroy {
  @ViewChild('header', {static:true}) header!: ElementRef<HTMLElement>;
  @ViewChild('menuToggle', {static:true}) menuToggle!: ElementRef<HTMLButtonElement>;
  @ViewChild('closeMenu', {static:true}) closeMenu!: ElementRef<HTMLButtonElement>;
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly injector = inject(Injector);
  private readonly preferenceKey = 'farmstay.admin.sidebar.v1';
  width = SIDEBAR_DEFAULT;
  desktopOpen = true;
  isMobile = window.innerWidth < 1024;
  mobileOpen = false;
  headerHeight = 114;
  resizing = false;
  readonly minWidth = SIDEBAR_MIN;
  readonly maxWidth = SIDEBAR_MAX;
  private observer?: ResizeObserver;
  private subscription: Subscription;
  private dragStart = 0;
  private dragWidth = 0;
  private pendingWidth?: number;
  private frame = 0;
  private previousBodyOverflow: string | null = null;
  get open(): boolean { return this.isMobile ? this.mobileOpen : this.desktopOpen; }
  constructor() {
    try {
      const saved = JSON.parse(localStorage.getItem(this.preferenceKey) || 'null');
      if(saved && typeof saved.width === 'number') this.width = sidebarWidth(saved.width);
      if(saved && typeof saved.open === 'boolean') this.desktopOpen = saved.open;
    } catch { /* Layout remains usable when browser storage is blocked or corrupt. */ }
    this.subscription = this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      if(this.mobileOpen) this.close();
    });
  }
  ngAfterViewInit(): void {
    this.observer = new ResizeObserver(entries => {
      const height = Math.ceil(entries[0].target.getBoundingClientRect().height);
      if(height > 0 && this.headerHeight !== height) this.zone.run(() => this.headerHeight = height);
    });
    this.observer.observe(this.header.nativeElement);
  }
  toggle(): void {
    if(this.isMobile) {
      this.mobileOpen = !this.mobileOpen;
      this.lockBody(this.mobileOpen);

    } else {
      this.desktopOpen = !this.desktopOpen;
      this.persist();
    }
  }
  close(): void {
    if(this.isMobile) { this.mobileOpen = false; this.lockBody(false); }
    else { this.desktopOpen = false; this.persist(); }
    afterNextRender(() => this.menuToggle.nativeElement.focus(), {injector:this.injector});
  }
  @HostListener('window:resize') onViewport(width = window.innerWidth): void {
    const mobile = width < 1024;
    if(mobile !== this.isMobile) {
      this.endResize(); this.mobileOpen = false; this.lockBody(false); this.isMobile = mobile;
    }
  }
  @HostListener('document:keydown.escape') escape(): void {
    if(this.isMobile && this.mobileOpen) this.close();
  }
  startResize(event: PointerEvent): void {
    if(this.isMobile || !this.desktopOpen || event.button !== 0) return;
    event.preventDefault();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.resizing = true; this.dragStart = event.clientX; this.dragWidth = this.width;
  }
  resize(event: PointerEvent): void {
    if(!this.resizing) return;
    this.pendingWidth = sidebarWidth(this.dragWidth + event.clientX - this.dragStart);
    if(!this.frame) this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      if(this.pendingWidth !== undefined) this.width = this.pendingWidth;
    });
  }
  endResize(): void {
    if(this.frame) {cancelAnimationFrame(this.frame);this.frame = 0;}
    if(this.pendingWidth !== undefined) this.width = this.pendingWidth;
    this.pendingWidth = undefined;
    if(this.resizing) { this.resizing = false; this.persist(); }
  }
  resizeKey(event: KeyboardEvent): void {
    const amount = event.shiftKey ? 32 : 8;
    const target = ({ArrowLeft:this.width-amount,ArrowRight:this.width+amount,Home:SIDEBAR_MIN,End:SIDEBAR_MAX} as Record<string,number>)[event.key];
    if(target === undefined) return;
    event.preventDefault(); this.width = sidebarWidth(target); this.persist();
  }
  resetWidth(): void { this.width = SIDEBAR_DEFAULT; this.persist(); }
  private persist(): void {
    try {localStorage.setItem(this.preferenceKey, JSON.stringify({width:this.width,open:this.desktopOpen}));} catch { /* Optional preference only. */ }
  }
  private lockBody(lock: boolean): void {
    if(lock && this.previousBodyOverflow === null) {this.previousBodyOverflow = this.document.body.style.overflow;this.document.body.style.overflow = 'hidden';}
    else if(!lock && this.previousBodyOverflow !== null) {this.document.body.style.overflow = this.previousBodyOverflow;this.previousBodyOverflow = null;}
  }
  ngOnDestroy(): void {this.endResize();this.observer?.disconnect();this.subscription.unsubscribe();this.lockBody(false);}
}
