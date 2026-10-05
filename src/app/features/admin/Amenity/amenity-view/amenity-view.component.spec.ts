import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmenityViewComponent } from './amenity-view.component';

describe('AmenityViewComponent', () => {
  let component: AmenityViewComponent;
  let fixture: ComponentFixture<AmenityViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmenityViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AmenityViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
