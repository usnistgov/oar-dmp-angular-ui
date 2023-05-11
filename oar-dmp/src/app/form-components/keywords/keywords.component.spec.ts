import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeywordsComponent } from './keywords.component';
import { DMP_Meta } from 'src/app/types/DMP.types';
import { FormsModule, ReactiveFormsModule } from '@angular/forms'; 


describe('KeywordsComponent', () => {
  let component: KeywordsComponent;
  let fixture: ComponentFixture<KeywordsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, ReactiveFormsModule],
      declarations: [ KeywordsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KeywordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
