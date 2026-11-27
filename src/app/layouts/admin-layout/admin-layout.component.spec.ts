import { Component } from '@angular/core';
import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { AdminSidebarComponent } from '../../features/admin/admin-sidebar/admin-sidebar.component';
import { AdminLayoutComponent, sidebarWidth } from './admin-layout.component';

@Component({selector:'app-header',standalone:true,template:'<div style="height:128px">Header</div>'})
class HeaderStub {}
@Component({selector:'app-admin-sidebar',standalone:true,template:'<a href="#">Dashboard</a>'})
class SidebarStub {}
@Component({standalone:true,template:'Page'})
class PageStub {}

describe('Responsive administration shell', () => {
  let fixture: ComponentFixture<AdminLayoutComponent>;
  let component: AdminLayoutComponent;
  const key='farmstay.admin.sidebar.v1';
  beforeEach(async()=>{
    localStorage.removeItem(key);
    await TestBed.configureTestingModule({imports:[AdminLayoutComponent],providers:[provideRouter([{path:'test-page',component:PageStub}])]}).overrideComponent(AdminLayoutComponent,{
      remove:{imports:[HeaderComponent,AdminSidebarComponent]},add:{imports:[HeaderStub,SidebarStub]}
    }).compileComponents();
    fixture=TestBed.createComponent(AdminLayoutComponent);component=fixture.componentInstance;component.onViewport(1440);fixture.detectChanges();
  });
  afterEach(()=>{fixture.destroy();localStorage.removeItem(key);});
  it('bounds invalid and extreme stored widths to the supported 8px grid',()=>{
    expect(sidebarWidth(NaN)).toBe(280);expect(sidebarWidth(-1)).toBe(224);expect(sidebarWidth(800)).toBe(384);expect(sidebarWidth(289)).toBe(288);
  });
  it('collapses the actual grid column and removes hidden menu from keyboard access',()=>{
    expect(fixture.nativeElement.querySelector('.admin-toolbar').hidden).toBeTrue();
    component.toggle();fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.admin-toolbar').hidden).toBeFalse();
    expect(fixture.nativeElement.querySelector('.admin-layout').classList.contains('sidebar-open')).toBeFalse();
    expect(fixture.nativeElement.querySelector('.sidebar-slot').hasAttribute('inert')).toBeTrue();
    expect(fixture.nativeElement.querySelector('[aria-controls]').getAttribute('aria-expanded')).toBe('false');
    component.toggle();fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.admin-toolbar').hidden).toBeTrue();
  });
  it('restores desktop width and collapse preference after remount',()=>{
    component.width=352;component.toggle();fixture.destroy();
    fixture=TestBed.createComponent(AdminLayoutComponent);component=fixture.componentInstance;component.onViewport(1440);fixture.detectChanges();
    expect(component.width).toBe(352);expect(component.desktopOpen).toBeFalse();
  });
  it('uses keyboard resizing and clamps at both ends',()=>{
    component.resizeKey(new KeyboardEvent('keydown',{key:'ArrowRight'}));expect(component.width).toBe(288);
    component.resizeKey(new KeyboardEvent('keydown',{key:'End'}));expect(component.width).toBe(384);
    component.resizeKey(new KeyboardEvent('keydown',{key:'ArrowRight'}));expect(component.width).toBe(384);
    component.resizeKey(new KeyboardEvent('keydown',{key:'Home'}));expect(component.width).toBe(224);
  });
  it('coalesces pointer resizing and keeps the final drag position',()=>{
    const target={setPointerCapture:()=>{}};
    component.startResize({button:0,clientX:280,pointerId:1,currentTarget:target,preventDefault:()=>{}} as unknown as PointerEvent);
    component.resize({clientX:344} as PointerEvent);component.endResize();expect(component.width).toBe(344);expect(component.resizing).toBeFalse();
  });
  it('opens mobile as a modal drawer, locks background and Escape restores it',()=>{
    component.onViewport(375);component.toggle();fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.sidebar-slot').hasAttribute('inert')).toBeFalse();
    expect(fixture.nativeElement.querySelector('.sidebar-slot').getAttribute('aria-modal')).toBe('true');
    expect(fixture.nativeElement.querySelector('.admin-content-wrapper').hasAttribute('inert')).toBeTrue();
    expect(document.body.style.overflow).toBe('hidden');
    component.escape();fixture.detectChanges();expect(component.mobileOpen).toBeFalse();expect(document.body.style.overflow).not.toBe('hidden');
  });
  it('closes mobile drawer when navigating',fakeAsync(()=>{
    component.onViewport(375);component.toggle();fixture.detectChanges();
    TestBed.inject(Router).navigateByUrl('/test-page');tick();fixture.detectChanges();expect(component.mobileOpen).toBeFalse();
  }));
  it('preserves desktop collapse preference when crossing the mobile breakpoint',()=>{
    component.toggle();component.onViewport(375);component.toggle();component.onViewport(1440);
    expect(component.mobileOpen).toBeFalse();expect(component.desktopOpen).toBeFalse();expect(component.open).toBeFalse();
  });
  it('updates the sticky offset when the real header height changes',async()=>{
    const header=fixture.nativeElement.querySelector('app-header div') as HTMLElement;header.style.height='176px';
    await new Promise(resolve=>setTimeout(resolve,80));fixture.detectChanges();expect(component.headerHeight).toBeGreaterThanOrEqual(176);
  });
  it('restores the previous body scroll setting on teardown',()=>{
    document.body.style.overflow='auto';component.onViewport(375);component.toggle();fixture.destroy();
    expect(document.body.style.overflow).toBe('auto');document.body.style.overflow='';
  });
});
