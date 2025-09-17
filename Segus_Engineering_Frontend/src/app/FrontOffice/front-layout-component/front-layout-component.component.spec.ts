import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FrontLayoutComponentComponent } from './front-layout-component.component';

describe('FrontLayoutComponentComponent', () => {
  let component: FrontLayoutComponentComponent;
  let fixture: ComponentFixture<FrontLayoutComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FrontLayoutComponentComponent]
    });
    fixture = TestBed.createComponent(FrontLayoutComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
