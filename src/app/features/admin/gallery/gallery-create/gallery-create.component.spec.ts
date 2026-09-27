import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GalleryCreateComponent } from './gallery-create.component';

describe('GalleryCreateComponent', () => {
  let component: GalleryCreateComponent;
  let fixture: ComponentFixture<GalleryCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GalleryCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GalleryCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
