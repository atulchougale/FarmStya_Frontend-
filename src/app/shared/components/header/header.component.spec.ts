import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { TokenService } from '../../../core/services/token.service';
import { PublicSiteService } from '../../../core/services/public-site.service';
import { LoginResponse } from '../../../features/auth/models/login-response.model';

import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let user: BehaviorSubject<LoginResponse | null>;

  beforeEach(async () => {
    user = new BehaviorSubject<LoginResponse | null>(null);
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        provideRouter([]),
        { provide: TokenService, useValue: { currentUser$: user.asObservable() } },
        { provide: PublicSiteService, useValue: { publicSite$: of(null) } },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('replaces guest actions with the customer profile after login', () => {
    const header: HTMLElement = fixture.nativeElement;
    expect(header.querySelector('.login-link')).not.toBeNull();
    expect(header.querySelector('.register-btn')).not.toBeNull();

    user.next({ fullName: 'Test Customer', roleName: 'Customer' } as LoginResponse);
    fixture.detectChanges();

    expect(header.querySelector('.login-link')).toBeNull();
    expect(header.querySelector('.register-btn')).toBeNull();
    expect(header.querySelector('.profile-btn')?.textContent).toContain('Test Customer');
  });
  it('toggles the responsive navigation without Bootstrap JavaScript', () => {
    const button=fixture.nativeElement.querySelector('.navbar-toggler') as HTMLButtonElement;
    button.click();fixture.detectChanges();
    expect(component.isNavigationOpen).toBeTrue();
    expect(fixture.nativeElement.querySelector('#mainNavbar').classList.contains('show')).toBeTrue();
    component.closeNavigation();fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

});
