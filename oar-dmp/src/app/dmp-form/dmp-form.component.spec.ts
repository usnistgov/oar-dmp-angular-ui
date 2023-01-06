import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DmpFormComponent } from './dmp-form.component';

describe('DmpFormComponent', () => {
  let component: DmpFormComponent;
  let fixture: ComponentFixture<DmpFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DmpFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DmpFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
