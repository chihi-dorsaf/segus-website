import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminEmployeesComponent } from './admin-employees.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AdminEmployeesComponent', () => {
  let component: AdminEmployeesComponent;
  let fixture: ComponentFixture<AdminEmployeesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AdminEmployeesComponent]
    });
    fixture = TestBed.createComponent(AdminEmployeesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
