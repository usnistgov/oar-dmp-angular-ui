import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityAndPrivacyComponent } from './security-and-privacy.component';

describe('SecurityAndPrivacyComponent', () => {
  let component: SecurityAndPrivacyComponent;
  let fixture: ComponentFixture<SecurityAndPrivacyComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SecurityAndPrivacyComponent]
    });
    fixture = TestBed.createComponent(SecurityAndPrivacyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
