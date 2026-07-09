import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechnicalRequirementsComponent } from './technical-requirements.component';
import { FormBuilder } from '@angular/forms';

describe('TechnicalRequirementsComponent', () => {
  let component: TechnicalRequirementsComponent;
  let fixture: ComponentFixture<TechnicalRequirementsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TechnicalRequirementsComponent ],
      providers: [ FormBuilder ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TechnicalRequirementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
