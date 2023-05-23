import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataPreservationComponent } from './data-preservation.component';
import { FormBuilder } from '@angular/forms';

describe('DataPreservationComponent', () => {
  let component: DataPreservationComponent;
  let fixture: ComponentFixture<DataPreservationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DataPreservationComponent ],
      providers: [ FormBuilder ]
      
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataPreservationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
