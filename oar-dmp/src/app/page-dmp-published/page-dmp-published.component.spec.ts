import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PageDmpPublishedComponent } from './page-dmp-published.component';

describe('PageDmpPublishedComponent', () => {
  let component: PageDmpPublishedComponent;
  let fixture: ComponentFixture<PageDmpPublishedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PageDmpPublishedComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PageDmpPublishedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
