import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSubtasksComponent } from './admin-subtasks.component';

describe('AdminSubtasksComponent', () => {
  let component: AdminSubtasksComponent;
  let fixture: ComponentFixture<AdminSubtasksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSubtasksComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminSubtasksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
