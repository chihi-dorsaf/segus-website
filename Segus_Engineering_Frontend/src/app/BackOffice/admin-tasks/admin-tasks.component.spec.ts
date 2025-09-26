import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminTasksComponent } from './admin-tasks.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AdminTasksComponent', () => {
  let component: AdminTasksComponent;
  let fixture: ComponentFixture<AdminTasksComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AdminTasksComponent]
    });
    fixture = TestBed.createComponent(AdminTasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
