import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PersonelComponent } from './personel.component';
import { DropDownSelectService } from '../../shared/drop-down-select.service';
import { FormBuilder } from '@angular/forms';
import {MatAutocompleteModule} from '@angular/material/autocomplete';

describe('PersonelComponent', () => {
  let component: PersonelComponent;
  let fixture: ComponentFixture<PersonelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PersonelComponent ],
      providers: [
        DropDownSelectService,
        FormBuilder
      ],
      imports: [HttpClientTestingModule, MatAutocompleteModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PersonelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
