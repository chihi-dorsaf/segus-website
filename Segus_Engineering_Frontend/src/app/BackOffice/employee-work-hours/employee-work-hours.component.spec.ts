import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { EmployeeWorkHoursComponent } from './employee-work-hours.component';
import { EmployeeWorkHoursService } from '../../services/employee-work-hours.service';
import { AuthService } from '../../services/auth.service';

describe('EmployeeWorkHoursComponent', () => {
  let component: EmployeeWorkHoursComponent;
  let fixture: ComponentFixture<EmployeeWorkHoursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EmployeeWorkHoursComponent,
        ReactiveFormsModule,
        HttpClientTestingModule,
        BrowserAnimationsModule
      ],
      providers: [
        EmployeeWorkHoursService,
        AuthService
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeWorkHoursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.sessionForm).toBeTruthy();
    expect(component.pauseForm).toBeTruthy();
    expect(component.sessions).toBeDefined();
    expect(Array.isArray(component.sessions)).toBeTrue();
  });

  it('should have valid forms', () => {
    expect(component.sessionForm).toBeTruthy();
    expect(component.pauseForm).toBeTruthy();
  });
});









