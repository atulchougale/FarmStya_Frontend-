import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutUsFormComponent } from './about-us-form.component';

describe('AboutUsFormComponent', () => {
  let component: AboutUsFormComponent;
  let fixture: ComponentFixture<AboutUsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutUsFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AboutUsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
