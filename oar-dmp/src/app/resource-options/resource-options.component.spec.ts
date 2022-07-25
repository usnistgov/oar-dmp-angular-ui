import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceOptionsComponent } from './resource-options.component';

describe('ResourceOptionsComponent', () => {
  let component: ResourceOptionsComponent;
  let fixture: ComponentFixture<ResourceOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ResourceOptionsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourceOptionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
