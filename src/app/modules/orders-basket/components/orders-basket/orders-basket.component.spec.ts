import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersBasketComponent } from './orders-basket.component';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { Subject } from 'rxjs';
import { OrderService } from '../../../../shared/services/orders/order.service';
import {
  getTranslocoModule,
  mockComponent
} from '../../../../shared/utils/testing';
import { EvaluationService } from '../../../../shared/services/evaluation.service';

describe('OrdersBasketComponent', () => {
  let component: OrdersBasketComponent;
  let fixture: ComponentFixture<OrdersBasketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        getTranslocoModule()
      ],
      declarations: [
        OrdersBasketComponent,
        mockComponent({ selector: 'ats-orders-basket-item', inputs: ['exchange', 'formControl', 'totalBudget', 'itemIndex', 'enableDelete'] })
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: OrderService,
          useValue: {
            getSettings: jasmine.createSpy('submitLimitOrder').and.returnValue(new Subject())
          }
        },
        {
          provide: EvaluationService,
          useValue: {
            getSettings: jasmine.createSpy('evaluateQuantity').and.returnValue(new Subject())
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdersBasketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
