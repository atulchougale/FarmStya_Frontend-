import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalleryPublicComponent } from './gallery-public.component';

describe('GalleryPublicComponent', () => {
  let component: GalleryPublicComponent;
  let fixture: ComponentFixture<GalleryPublicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalleryPublicComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GalleryPublicComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
