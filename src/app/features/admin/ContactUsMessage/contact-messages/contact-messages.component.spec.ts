import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContactMessagesComponent } from './contact-messages.component';

describe('ContactMessagesComponent', () => {
  let component: ContactMessagesComponent;
  let fixture: ComponentFixture<ContactMessagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactMessagesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContactMessagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
