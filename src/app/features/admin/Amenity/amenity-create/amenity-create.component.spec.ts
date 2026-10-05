import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmenityCreateComponent } from './amenity-create.component';

describe('AmenityCreateComponent', () => {
  let component: AmenityCreateComponent;
  let fixture: ComponentFixture<AmenityCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmenityCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AmenityCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
