import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookingViewComponent } from './booking-view.component';

describe('BookingViewComponent', () => {
  let component: BookingViewComponent;
  let fixture: ComponentFixture<BookingViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
      imports: [BookingViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookingViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
