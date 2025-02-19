import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstantNotificationsFormComponent } from './instant-notifications-form.component';
import { getTranslocoModule } from '../../../../shared/utils/testing';

describe('InstantNotificationsFormComponent', () => {
  let component: InstantNotificationsFormComponent;
  let fixture: ComponentFixture<InstantNotificationsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [ InstantNotificationsFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstantNotificationsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
