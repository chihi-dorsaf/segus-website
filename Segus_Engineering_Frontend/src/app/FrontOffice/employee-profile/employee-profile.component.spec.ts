import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmployeeProfileComponent } from './employee-profile.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('EmployeeProfileComponent', () => {
  let component: EmployeeProfileComponent;
  let fixture: ComponentFixture<EmployeeProfileComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, EmployeeProfileComponent]
    });
    fixture = TestBed.createComponent(EmployeeProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
