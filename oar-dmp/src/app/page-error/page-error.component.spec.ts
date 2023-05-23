import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageErrorComponent } from './page-error.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('PageErrorComponent', () => {
  let component: PageErrorComponent;
  let fixture: ComponentFixture<PageErrorComponent>;


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PageErrorComponent ],
      imports: [ RouterTestingModule ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PageErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
