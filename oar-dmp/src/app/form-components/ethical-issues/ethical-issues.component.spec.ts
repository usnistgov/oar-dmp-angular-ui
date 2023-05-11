import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthicalIssuesComponent } from './ethical-issues.component';
import { FormBuilder } from '@angular/forms';

describe('EthicalIssuesComponent', () => {
  let component: EthicalIssuesComponent;
  let fixture: ComponentFixture<EthicalIssuesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EthicalIssuesComponent ],
      providers: [ FormBuilder ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EthicalIssuesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
