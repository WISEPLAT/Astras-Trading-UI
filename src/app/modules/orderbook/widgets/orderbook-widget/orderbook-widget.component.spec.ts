import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { OrderbookWidgetComponent } from './orderbook-widget.component';
import {
  mockComponent,
  widgetSkeletonMock
} from "../../../../shared/utils/testing";
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { of } from 'rxjs';
import { TerminalSettingsService } from '../../../terminal-settings/services/terminal-settings.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { InstrumentsService } from '../../../instruments/services/instruments.service';

const settings = {
  symbol: 'SBER',
  exchange: 'MOEX'
};

describe('OrderbookWidgetComponent', () => {
  let component: OrderbookWidgetComponent;
  let fixture: ComponentFixture<OrderbookWidgetComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        OrderbookWidgetComponent,
        mockComponent({
          selector: 'ats-order-book',
          inputs: ['guid']
        }),
        mockComponent({
          selector: 'ats-orderbook-settings',
          inputs: ['guid']
        }),
        widgetSkeletonMock
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettingsOrNull: jasmine.createSpy('getSettingsOrNull').and.returnValue(of(null)),
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({})),
            addSettings: jasmine.createSpy('addSettings').and.callThrough()
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            terminalSettingsService: of({})
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            instrumentsSelection$: of({})
          }
        },
        {
          provide: InstrumentsService,
          useValue: {
            getInstrument: of({})
          }
        },
      ]
    }).compileComponents();

    TestBed.overrideComponent(OrderbookWidgetComponent, {
      set: {
        providers: []
      }
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderbookWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
