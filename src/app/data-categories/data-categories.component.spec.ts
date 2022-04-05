import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataCategoriesComponent } from './data-categories.component';

describe('DataCategoriesComponent', () => {
  let component: DataCategoriesComponent;
  let fixture: ComponentFixture<DataCategoriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DataCategoriesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DataCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
