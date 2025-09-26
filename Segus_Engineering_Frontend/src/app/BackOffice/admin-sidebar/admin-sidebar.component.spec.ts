import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminSidebarComponent } from './admin-sidebar.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('AdminSidebarComponent', () => {
  let component: AdminSidebarComponent;
  let fixture: ComponentFixture<AdminSidebarComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, AdminSidebarComponent]
    });
    fixture = TestBed.createComponent(AdminSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
