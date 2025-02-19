import { Injectable } from '@angular/core';
import {
  combineLatest,
  filter,
  Observable,
  shareReplay,
  switchMap
} from 'rxjs';
import {
  ScalperOrderBookDataContext,
  ScalperOrderBookExtendedSettings
} from '../models/scalper-order-book-data-context.model';
import { mapWith } from '../../../shared/utils/observable-helper';
import { WidgetSettingsService } from '../../../shared/services/widget-settings.service';
import { InstrumentsService } from '../../instruments/services/instruments.service';
import { DashboardContextService } from '../../../shared/services/dashboard-context.service';
import { PortfolioKey } from '../../../shared/models/portfolio-key.model';
import { Position } from '../../../shared/models/positions/position.model';
import {
  map,
  startWith
} from 'rxjs/operators';
import { PortfolioSubscriptionsService } from '../../../shared/services/portfolio-subscriptions.service';
import { OrderBookDataFeedHelper } from '../../orderbook/utils/order-book-data-feed.helper';
import { SubscriptionsDataFeedService } from '../../../shared/services/subscriptions-data-feed.service';
import {
  BodyRow,
  CurrentOrderDisplay,
  PriceRow,
  ScalperOrderBookBody,
  ScalperOrderBookRowType
} from '../models/scalper-order-book.model';
import { Range } from '../../../shared/models/common.model';
import { ScalperOrderBookSettings } from '../models/scalper-order-book-settings.model';
import {
  OrderbookData,
  OrderbookDataRow,
  OrderbookRequest
} from '../../orderbook/models/orderbook-data.model';
import { AllTradesItem } from '../../../shared/models/all-trades.model';
import { AllTradesService } from '../../../shared/services/all-trades.service';

@Injectable({
  providedIn: 'root'
})
export class ScalperOrderBookDataContextService {

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly instrumentsService: InstrumentsService,
    private readonly currentDashboardService: DashboardContextService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly subscriptionsDataFeedService: SubscriptionsDataFeedService,
    private readonly allTradesService: AllTradesService
  ) {
  }

  createContext(
    widgetGuid: string,
    priceRows$: Observable<PriceRow[]>,
    regeneratePriceRows: (orderBookData: OrderbookData, settings: ScalperOrderBookExtendedSettings) => void
  ): Omit<ScalperOrderBookDataContext, 'displayRange$' | 'workingVolume$'> {
    const settings$ = this.getSettingsStream(widgetGuid);
    const currentPortfolio$ = this.getOrderBookPortfolio();
    const position$ = this.getOrderBookPositionStream(settings$, currentPortfolio$);
    const orderBookData$ = this.getOrderBookDataStream(settings$);

    return {
      extendedSettings$: settings$,
      currentPortfolio$: currentPortfolio$,
      position$: position$,
      orderBookData$: orderBookData$,
      orderBookBody$: this.getOrderBookBody(settings$, priceRows$, orderBookData$, position$, regeneratePriceRows),
      currentOrders$: this.getCurrentOrdersStream(settings$, currentPortfolio$),
      trades$: this.getInstrumentTradesStream(settings$)
    };
  }

  public getOrderBookBounds(orderBookData: OrderbookData): { asksRange: Range | null, bidsRange: Range | null } {
    let asksRange: Range | null = null;
    if (orderBookData.a.length > 0) {
      asksRange = {
        min: orderBookData.a[0].p,
        max: orderBookData.a[orderBookData.a.length - 1].p
      };
    }

    let bidsRange: Range | null = null;
    if (orderBookData.b.length > 0) {
      bidsRange = {
        min: orderBookData.b[orderBookData.b.length - 1].p,
        max: orderBookData.b[0].p
      };
    }

    return { asksRange, bidsRange };
  }

  public getOrderBookPortfolio(): Observable<PortfolioKey> {
    return this.currentDashboardService.selectedPortfolio$;
  }

  public getSettingsStream(widgetGuid: string): Observable<ScalperOrderBookExtendedSettings> {
    return this.widgetSettingsService.getSettings<ScalperOrderBookSettings>(widgetGuid).pipe(
      mapWith(
        settings => this.instrumentsService.getInstrument(settings),
        (widgetSettings, instrument) => ({ widgetSettings, instrument } as ScalperOrderBookExtendedSettings)
      ),
      filter(x => !!x.instrument),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  public getOrderBookPositionStream(settings$: Observable<ScalperOrderBookExtendedSettings>, currentPortfolio$: Observable<PortfolioKey>): Observable<Position | null> {
    return settings$.pipe(
      mapWith(
        () => currentPortfolio$,
        (settings, portfolio) => ({ settings, portfolio })
      ),
      mapWith(
        x => this.portfolioSubscriptionsService.getAllPositionsSubscription(x.portfolio.portfolio, x.portfolio.exchange),
        (source, positions) => ({ ...source, positions })
      ),
      map(s => s.positions.find(p => p.symbol === s.settings.widgetSettings.symbol && p.exchange === s.settings.widgetSettings.exchange)),
      map(p => (!p || !p.avgPrice ? null as any : p)),
      startWith(null),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  public getOrderBookDataStream(settings$: Observable<ScalperOrderBookExtendedSettings>): Observable<OrderbookData> {
    return settings$.pipe(
      switchMap(settings => this.subscriptionsDataFeedService.subscribe<OrderbookRequest, OrderbookData>(
        OrderBookDataFeedHelper.getRealtimeDateRequest(
          settings.widgetSettings.symbol,
          settings.widgetSettings.exchange,
          settings.widgetSettings.instrumentGroup,
          settings.widgetSettings.depth
        ),
        OrderBookDataFeedHelper.getOrderbookSubscriptionId
      )),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  private getInstrumentTradesStream(settings$: Observable<ScalperOrderBookExtendedSettings>): Observable<AllTradesItem[]> {
    const results: AllTradesItem[] = [];

    return settings$.pipe(
      switchMap(x => this.allTradesService.getNewTradesSubscription(x.widgetSettings, 100)),
      map(trade => {
        results.push(trade);
        return results;
      }),
      startWith([]),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  private getCurrentOrdersStream(settings$: Observable<ScalperOrderBookExtendedSettings>, currentPortfolio$: Observable<PortfolioKey>): Observable<CurrentOrderDisplay[]> {
    const limitOrders$ = settings$.pipe(
      mapWith(() => currentPortfolio$, (s, p) => ({ s, p })),
      mapWith(
        ({ p }) => this.portfolioSubscriptionsService.getOrdersSubscription(p.portfolio, p.exchange),
        (source, orders) => {
          return orders.allOrders.filter(o => o.symbol === source.s.widgetSettings.symbol
            && o.exchange === source.s.widgetSettings.exchange
            && o.status === 'working');
        }
      ),
      map(orders => orders.map(x => ({
        orderId: x.id,
        exchange: x.exchange,
        portfolio: x.portfolio,
        type: 'limit',
        side: x.side,
        linkedPrice: x.price,
        displayVolume: x.qty - (x.filledQtyBatch ?? 0)
      } as CurrentOrderDisplay))),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    const stopOrders$ = settings$.pipe(
      mapWith(() => currentPortfolio$, (s, p) => ({ s, p })),
      mapWith(
        ({ p }) => this.portfolioSubscriptionsService.getStopOrdersSubscription(p.portfolio, p.exchange),
        (source, orders) => {
          return orders.allOrders.filter(o => o.symbol === source.s.widgetSettings.symbol
            && o.exchange === source.s.widgetSettings.exchange
            && o.status === 'working');
        }
      ),
      map(orders => orders.map(x => ({
        orderId: x.id,
        exchange: x.exchange,
        portfolio: x.portfolio,
        type: x.type,
        side: x.side,
        linkedPrice: x.triggerPrice,
        displayVolume: x.qty - (x.filledQtyBatch ?? 0)
      } as CurrentOrderDisplay))),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    return combineLatest([
      limitOrders$,
      stopOrders$
    ]).pipe(
      map(([limitOrders, stopOrders]) => [...limitOrders, ...stopOrders]),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  private getOrderBookBody(
    extendedSettings$: Observable<ScalperOrderBookExtendedSettings>,
    priceRows$: Observable<PriceRow[]>,
    orderBookData$: Observable<OrderbookData>,
    position$: Observable<Position | null>,
    regeneratePriceRows: (orderBookData: OrderbookData, settings: ScalperOrderBookExtendedSettings) => void
  ): Observable<ScalperOrderBookBody> {
    return combineLatest([
      extendedSettings$,
      priceRows$,
      orderBookData$,
      position$
    ]).pipe(
      map(([settings, priceRows, orderBookData, position]) => {
        return {
          orderBookData: orderBookData,
          bodyRows: this.mapToBodyRows(
            settings,
            priceRows,
            orderBookData,
            position,
            regeneratePriceRows) ?? []
        };
      }),
      filter(x => x.bodyRows.length > 0),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  private mapToBodyRows(
    settings: ScalperOrderBookExtendedSettings,
    priceRows: PriceRow[],
    orderBookData: OrderbookData,
    position: Position | null,
    regeneratePriceRows: (orderBookData: OrderbookData, settings: ScalperOrderBookExtendedSettings) => void
  ): BodyRow[] | null {
    if (priceRows.length === 0
      || !this.checkPriceRowBounds(
        priceRows,
        orderBookData,
        settings,
        regeneratePriceRows)
    ) {
      return [];
    }

    const orderBookBounds = this.getOrderBookBounds(orderBookData);
    const rows: BodyRow[] = [];
    for (let i = 0; i < priceRows.length; i++) {
      const mappedRow = this.mapPriceRowToOrderBook(
        priceRows[i],
        orderBookData,
        orderBookBounds,
        settings.widgetSettings
      );

      if (!mappedRow) {
        continue;
      }

      this.mapToPosition(mappedRow, position, orderBookBounds);

      rows.push(mappedRow);
    }

    return rows;
  }

  private checkPriceRowBounds(
    priceRows: PriceRow[],
    orderBookData: OrderbookData,
    settings: ScalperOrderBookExtendedSettings,
    regeneratePriceRows: (orderBookData: OrderbookData, settings: ScalperOrderBookExtendedSettings) => void
  ): boolean {
    const maxRowPrice = priceRows[0].price;
    const minRowPrice = priceRows[priceRows.length - 1].price;
    const orderBookBounds = this.getOrderBookBounds(orderBookData);

    const expectedMaxPrice = orderBookBounds.asksRange?.max ?? orderBookBounds.bidsRange?.max;
    const expectedMinPrice = orderBookBounds.bidsRange?.min ?? orderBookBounds.asksRange?.min;
    if ((!!expectedMinPrice && expectedMinPrice < minRowPrice)
      || (!!expectedMaxPrice && expectedMaxPrice > maxRowPrice)) {
      regeneratePriceRows(orderBookData, settings);
      return false;
    }

    return true;
  }

  private mapPriceRowToOrderBook(
    row: PriceRow,
    orderBookData: OrderbookData,
    orderBookBounds: { asksRange: Range | null, bidsRange: Range | null },
    settings: ScalperOrderBookSettings,
  ): BodyRow | null {
    const resultRow = {
      ...row
    } as BodyRow;

    if (!orderBookBounds.bidsRange && !orderBookBounds.asksRange) {
      return resultRow;
    }

    const matchRow = (targetRow: BodyRow, source: OrderbookDataRow[]) => {
      const matchedRowIndex = source.findIndex(x => x.p === targetRow.price);
      if (matchedRowIndex >= 0) {
        const matchedRow = source[matchedRowIndex];
        targetRow.volume = matchedRow.v;
        targetRow.isBest = matchedRowIndex === 0;

        return true;
      }

      return false;
    };

    if (orderBookBounds.asksRange && row.price >= orderBookBounds.asksRange.min) {
      resultRow.rowType = ScalperOrderBookRowType.Ask;
      if (resultRow.price <= orderBookBounds.asksRange.max) {
        if (!matchRow(resultRow, orderBookData.a)) {
          if (settings.showZeroVolumeItems) {
            resultRow.isFiller = true;
          }
          else {
            return null;
          }
        }
      }

      return resultRow;
    }
    else if (orderBookBounds.bidsRange && row.price <= orderBookBounds.bidsRange.max) {
      resultRow.rowType = ScalperOrderBookRowType.Bid;
      if (resultRow.price >= orderBookBounds.bidsRange.min) {
        if (!matchRow(resultRow, orderBookData.b)) {
          if (settings.showZeroVolumeItems) {
            resultRow.isFiller = true;
          }
          else {
            return null;
          }
        }
      }
      return resultRow;
    }
    else if (settings.showSpreadItems) {
      resultRow.rowType = ScalperOrderBookRowType.Spread;
      return resultRow;
    }

    return null;
  }

  private mapToPosition(
    targetRow: BodyRow,
    position: Position | null,
    orderBookBounds: { asksRange: Range | null, bidsRange: Range | null }
  ) {
    if (!!position && position.qtyTFuture !== 0) {
      const basePrice = position.qtyTFuture > 0
        ? orderBookBounds.bidsRange?.max ?? orderBookBounds.asksRange?.min
        : orderBookBounds.asksRange?.min ?? orderBookBounds.bidsRange?.max;

      if (!basePrice) {
        return;
      }

      const sign = position.qtyTFuture > 0 ? 1 : -1;
      const currentPositionRangeSign = (basePrice - position.avgPrice) * sign;

      const isCurrentPositionRange = targetRow.price <= basePrice && targetRow.price >= position.avgPrice
        || (targetRow.price >= basePrice && targetRow.price <= position.avgPrice);

      targetRow.currentPositionRangeSign = isCurrentPositionRange
        ? currentPositionRangeSign
        : null;
    }
  }
}
