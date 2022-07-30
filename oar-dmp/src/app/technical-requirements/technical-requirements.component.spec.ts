import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorageNeedsComponent } from './technical-requirements.component';

describe('StorageNeedsComponent', () => {
  let component: StorageNeedsComponent;
  let fixture: ComponentFixture<StorageNeedsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StorageNeedsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StorageNeedsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
