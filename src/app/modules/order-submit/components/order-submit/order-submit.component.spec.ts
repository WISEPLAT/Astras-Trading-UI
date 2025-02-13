import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';

import { OrderSubmitComponent } from './order-submit.component';
import { QuotesService } from '../../../../shared/services/quotes.service';
import { Store } from '@ngrx/store';
import {
  getTranslocoModule,
  mockComponent,
  sharedModuleImportForTests,
  TestData
} from '../../../../shared/utils/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PortfolioKey } from '../../../../shared/models/portfolio-key.model';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import {
  BehaviorSubject,
  of,
  Subject,
  take
} from 'rxjs';
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import { OrderService } from '../../../../shared/services/orders/order.service';
import { OrderType } from '../../models/order-form.model';
import { LimitOrderFormValue } from '../order-forms/limit-order-form/limit-order-form.component';
import {
  LimitOrder,
  MarketOrder,
  StopLimitOrder,
  StopMarketOrder
} from '../../../command/models/order.model';
import { Side } from '../../../../shared/models/enums/side.model';
import { MarketOrderFormValue } from '../order-forms/market-order-form/market-order-form.component';
import { StopOrderFormValue } from '../order-forms/stop-order-form/stop-order-form.component';
import { StopOrderCondition } from '../../../../shared/models/enums/stoporder-conditions';
import { PortfolioSubscriptionsService } from "../../../../shared/services/portfolio-subscriptions.service";
import { SubscriptionsDataFeedService } from '../../../../shared/services/subscriptions-data-feed.service';
import ruOrderSubmit from "../../../../../assets/i18n/order-submit/order-submit/ru.json";
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';

describe('OrderSubmitComponent', () => {
  let component: OrderSubmitComponent;
  let fixture: ComponentFixture<OrderSubmitComponent>;

  let store: any;
  let orderServiceSpy: any;
  let dashboardContextServiceSpy: any;

  const defaultPortfolio = 'D1234';
  const defaultInstrument = TestData.instruments[0];

  beforeEach(() => {
    orderServiceSpy = jasmine.createSpyObj(
      'OrderService',
      [
        'submitMarketOrder',
        'submitLimitOrder',
        'submitStopMarketOrder',
        'submitStopLimitOrder'
      ]
    );

    dashboardContextServiceSpy = jasmine.createSpyObj('DashboardContextService', ['selectedPortfolio$']);
    dashboardContextServiceSpy.selectedPortfolio$ = new BehaviorSubject({ portfolio: defaultPortfolio } as PortfolioKey);
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests,
        getTranslocoModule({
          langs: {
            'order-submit/order-submit/ru': ruOrderSubmit,
          }
        }),
        BrowserAnimationsModule
      ],
      declarations: [
        OrderSubmitComponent,
        mockComponent({
          selector: 'ats-limit-order-form',
          inputs: ['instrument', 'initialValues', 'guid', 'activated']
        }),
        mockComponent({
          selector: 'ats-market-order-form',
          inputs: ['instrument', 'initialValues', 'activated']
        }),
        mockComponent({
          selector: 'ats-stop-order-form',
          inputs: ['instrument', 'initialValues', 'guid', 'activated']
        }),
        mockComponent({
          selector: 'ats-limit-order-price-change',
          inputs: ['disabled', 'disabledTooltip', 'steps']
        }),
        mockComponent({
          selector: 'ats-working-volumes',
          inputs: ['workingVolumes', 'ask', 'bid'],
          outputs: ['itemSelected']
        })
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: { getSettings: jasmine.createSpy('getSettings').and.returnValue(of({ ...defaultInstrument })) }
        },
        {
          provide: InstrumentsService,
          useValue: { getInstrument: jasmine.createSpy('getInstrument').and.returnValue(of(defaultInstrument)) }
        },
        {
          provide: QuotesService, useValue: {
            getQuotes: jasmine.createSpy('getQuotes').and.returnValue(new Subject())
          }
        },
        { provide: OrderService, useValue: orderServiceSpy },
        {
          provide: PortfolioSubscriptionsService,
          useValue: {
            getAllPositionsSubscription: jasmine.createSpy('getAllPositionsSubscription').and.returnValue(of([]))
          }
        },
        {
          provide: SubscriptionsDataFeedService,
          useValue: {
            getAllPositionsSubscription: jasmine.createSpy('subscribe').and.returnValue(new Subject())
          }
        },
        {
          provide: DashboardContextService,
          useValue: dashboardContextServiceSpy
        },
      ]
    }).compileComponents();

    store = TestBed.inject(Store);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderSubmitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Limit Order', () => {
    beforeEach(() => {
      component.setSelectedCommandType(OrderType.LimitOrder);
    });

    it('should disable buttons on invalid form', fakeAsync(() => {
      component.setLimitOrderValue({ value: {} as LimitOrderFormValue, isValid: false });

      fixture.detectChanges();

      tick();
      component.canSubmitOrder$.pipe(
        take(1)
      ).subscribe(x => {
        expect(x).toBeFalse();
      });
    }));

    it('should enable buttons on valid form', fakeAsync(() => {
      component.setLimitOrderValue({ value: {} as LimitOrderFormValue, isValid: true });
      fixture.detectChanges();

      tick();
      component.canSubmitOrder$.pipe(
        take(1)
      ).subscribe(x => {
        expect(x).toBeTrue();
      });
    }));

    it('should pass correct order to service', fakeAsync(() => {
        const expectedOrder: LimitOrder = {
          price: Math.round(Math.random() * 1000),
          quantity: Math.round(Math.random() * 100),
          side: Math.random() < 0.5 ? Side.Buy : Side.Sell,
          instrument: defaultInstrument
        };

        component.setLimitOrderValue({
          value: {
            price: expectedOrder.price,
            quantity: expectedOrder.quantity,
            instrumentGroup: expectedOrder.instrument.instrumentGroup!
          },
          isValid: true
        });

        fixture.detectChanges();

        component.submitOrder(expectedOrder.side);
        fixture.detectChanges();

        tick();

        expect(orderServiceSpy.submitLimitOrder).toHaveBeenCalledOnceWith(
          jasmine.objectContaining(expectedOrder),
          defaultPortfolio
        );
      })
    );
  });

  describe('Market Order', () => {
    beforeEach(() => {
      component.setSelectedCommandType(OrderType.MarketOrder);
    });

    it('should disable buttons on invalid form', fakeAsync(() => {
      component.setMarketOrderValue({ value: {} as MarketOrderFormValue, isValid: false });
      fixture.detectChanges();

      tick();
      component.canSubmitOrder$.pipe(
        take(1)
      ).subscribe(x => {
        expect(x).toBeFalse();
      });
    }));

    it('should enable buttons on valid form', fakeAsync(() => {
      component.setMarketOrderValue({ value: {} as MarketOrderFormValue, isValid: true });
      fixture.detectChanges();

      tick();
      component.canSubmitOrder$.pipe(
        take(1)
      ).subscribe(x => {
        expect(x).toBeTrue();
      });
    }));

    it('should pass correct order to service', fakeAsync(() => {
        const expectedOrder: MarketOrder = {
          quantity: Math.round(Math.random() * 100),
          side: Math.random() < 0.5 ? Side.Buy : Side.Sell,
          instrument: defaultInstrument
        };

        component.setMarketOrderValue({
          value: {
            quantity: expectedOrder.quantity,
            instrumentGroup: expectedOrder.instrument.instrumentGroup!
          },
          isValid: true
        });

        fixture.detectChanges();

        component.submitOrder(expectedOrder.side);
        fixture.detectChanges();

        tick();

        expect(orderServiceSpy.submitMarketOrder).toHaveBeenCalledOnceWith(
          jasmine.objectContaining(expectedOrder),
          defaultPortfolio
        );
      })
    );
  });

  describe('Stop Order', () => {
    beforeEach(() => {
      component.setSelectedCommandType(OrderType.StopOrder);
    });

    it('should disable buttons on invalid form', fakeAsync(() => {
      component.setStopOrderValue({ value: {} as StopOrderFormValue, isValid: false });
      fixture.detectChanges();

      tick();
      component.canSubmitOrder$.pipe(
        take(1)
      ).subscribe(x => {
        expect(x).toBeFalse();
      });
    }));

    it('should enable buttons on valid form', fakeAsync(() => {
      component.setStopOrderValue({ value: {} as StopOrderFormValue, isValid: true });
      fixture.detectChanges();

      tick();
      component.canSubmitOrder$.pipe(
        take(1)
      ).subscribe(x => {
        expect(x).toBeTrue();
      });
    }));

    it('should pass correct order to service (StopMarketOrder)', fakeAsync(() => {
        const expectedOrder: StopMarketOrder = {
          instrument: defaultInstrument,
          side: Math.random() < 0.5 ? Side.Buy : Side.Sell,
          quantity: Math.round(Math.random() * 100),
          condition: Math.random() < 0.5 ? StopOrderCondition.Less : StopOrderCondition.More,
          triggerPrice: Math.round(Math.random() * 1000),
          stopEndUnixTime: new Date()
        };

      component.setStopOrderValue({
        value: {
          quantity: expectedOrder.quantity,
          triggerPrice: expectedOrder.triggerPrice,
          condition: expectedOrder.condition,
          stopEndUnixTime: expectedOrder.stopEndUnixTime,
          withLimit: false,
          price: 0
        },
        isValid: true
      });

        fixture.detectChanges();

        component.submitOrder(expectedOrder.side);
        fixture.detectChanges();

        tick();

        expect(orderServiceSpy.submitStopMarketOrder).toHaveBeenCalledOnceWith(
          jasmine.objectContaining(expectedOrder),
          defaultPortfolio
        );
      })
    );

    it('should pass correct order to service (StopLimitOrder)', fakeAsync(() => {
        const expectedOrder: StopLimitOrder = {
          instrument: defaultInstrument,
          side: Math.random() < 0.5 ? Side.Buy : Side.Sell,
          quantity: Math.round(Math.random() * 100),
          condition: Math.random() < 0.5 ? StopOrderCondition.Less : StopOrderCondition.More,
          triggerPrice: Math.round(Math.random() * 1000),
          price: Math.round(Math.random() * 1000),
          stopEndUnixTime: new Date(),
        };

      component.setStopOrderValue({
        value: {
          quantity: expectedOrder.quantity,
          triggerPrice: expectedOrder.triggerPrice,
          condition: expectedOrder.condition,
          stopEndUnixTime: expectedOrder.stopEndUnixTime,
          withLimit: true,
          price: expectedOrder.price
        },
        isValid: true
      });

        fixture.detectChanges();

        component.submitOrder(expectedOrder.side);
        fixture.detectChanges();

        tick();

        expect(orderServiceSpy.submitStopLimitOrder).toHaveBeenCalledOnceWith(
          jasmine.objectContaining(expectedOrder),
          defaultPortfolio
        );
      })
    );
  });
});
