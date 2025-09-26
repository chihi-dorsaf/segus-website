import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminProjectsComponent } from './admin-projects.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('AdminProjectsComponent', () => {
  let component: AdminProjectsComponent;
  let fixture: ComponentFixture<AdminProjectsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, AdminProjectsComponent]
    });
    fixture = TestBed.createComponent(AdminProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
