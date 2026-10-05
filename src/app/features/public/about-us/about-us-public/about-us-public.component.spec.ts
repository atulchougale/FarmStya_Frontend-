import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutUsPublicComponent } from './about-us-public.component';

describe('AboutUsPublicComponent', () => {
  let component: AboutUsPublicComponent;
  let fixture: ComponentFixture<AboutUsPublicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutUsPublicComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AboutUsPublicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
