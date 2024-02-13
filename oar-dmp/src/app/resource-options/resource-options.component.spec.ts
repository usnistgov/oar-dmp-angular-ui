import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { NistResourcesModule } from '../config/nist-resources.module';
import { ResourceOptionsComponent } from './resource-options.component';
import { DomPositioningModule } from '../shared/dom-positioning.module';

describe('ResourceOptionsComponent', () => {
  let component: ResourceOptionsComponent;
  let fixture: ComponentFixture<ResourceOptionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ HttpClientTestingModule, NistResourcesModule ],
      declarations: [ ResourceOptionsComponent ],
      providers: [DomPositioningModule]
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
