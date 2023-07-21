import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DmpFormComponent } from './dmp-form.component';
import { FormBuilder } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ConfigModule, CONFIG_URL, AuthenticationService, MockAuthenticationService } from 'oarng';
import { environment } from '../../environments/environment';
import { RouterTestingModule } from '@angular/router/testing';
import { DomPositioningModule } from '../shared/dom-positioning.module';

describe('DmpFormComponent', () => {
  let component: DmpFormComponent;
  let fixture: ComponentFixture<DmpFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DmpFormComponent ],
      providers: [
        FormBuilder, DomPositioningModule,
        { provide: CONFIG_URL, useValue: environment.configUrl },
        { provide: AuthenticationService, useClass: MockAuthenticationService }
      ],
      imports: [HttpClientTestingModule, RouterTestingModule, ConfigModule]
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
