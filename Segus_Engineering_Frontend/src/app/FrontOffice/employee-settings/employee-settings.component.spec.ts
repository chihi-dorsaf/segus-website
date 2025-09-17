import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeSettingsComponent } from './employee-settings.component';

describe('EmployeeSettingsComponent', () => {
  let component: EmployeeSettingsComponent;
  let fixture: ComponentFixture<EmployeeSettingsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EmployeeSettingsComponent]
    });
    fixture = TestBed.createComponent(EmployeeSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
