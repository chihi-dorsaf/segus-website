import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmployeeTasksComponent } from './employee-tasks.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('EmployeeTasksComponent', () => {
  let component: EmployeeTasksComponent;
  let fixture: ComponentFixture<EmployeeTasksComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, EmployeeTasksComponent]
    });
    fixture = TestBed.createComponent(EmployeeTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
