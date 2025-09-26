import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CareersPageComponent } from './careers-page.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';

describe('CareersPageComponent', () => {
  let component: CareersPageComponent;
  let fixture: ComponentFixture<CareersPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, ReactiveFormsModule],
      declarations: [CareersPageComponent]
    });
    fixture = TestBed.createComponent(CareersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
