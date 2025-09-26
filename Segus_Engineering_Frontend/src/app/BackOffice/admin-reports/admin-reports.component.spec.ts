import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminReportsComponent } from './admin-reports.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AdminReportsComponent', () => {
  let component: AdminReportsComponent;
  let fixture: ComponentFixture<AdminReportsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AdminReportsComponent]
    });
    fixture = TestBed.createComponent(AdminReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
