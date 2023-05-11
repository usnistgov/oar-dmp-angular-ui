import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataDescriptionComponent } from './data-description.component';
import { FormBuilder } from '@angular/forms';

describe('DataDescriptionComponent', () => {
  let component: DataDescriptionComponent;
  let fixture: ComponentFixture<DataDescriptionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DataDescriptionComponent ],
      providers: [ FormBuilder ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
