import { Injectable } from '@angular/core';
import {
  combineLatest,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CurrencyCode,
  CurrencyInstrument
} from 'src/app/shared/models/enums/currencies.model';
import { Exchanges } from 'src/app/shared/models/enums/exchanges';
import { OrdersNotificationsService } from 'src/app/shared/services/orders-notifications.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { formatCurrency } from 'src/app/shared/utils/formatters';
import { CommonSummaryView } from '../models/common-summary-view.model';
import { CommonSummaryModel } from '../models/common-summary.model';
import { ForwardRisks } from "../models/forward-risks.model";
import { ForwardRisksView } from "../models/forward-risks-view.model";
import { PortfolioSubscriptionsService } from '../../../shared/services/portfolio-subscriptions.service';
import { TerminalSettingsService } from "../../terminal-settings/services/terminal-settings.service";
import { MarketService } from "../../../shared/services/market.service";
import { mapWith } from "../../../shared/utils/observable-helper";
import { DashboardContextService } from '../../../shared/services/dashboard-context.service';
import { BlotterSettings } from '../models/blotter-settings.model';

@Injectable()
export class BlotterService {

  constructor(
    private readonly notification: OrdersNotificationsService,

    private readonly dashboardContextService: DashboardContextService,
    private readonly quotes: QuotesService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly marketService: MarketService
  ) {
  }

  selectNewInstrument(symbol: string, exchange: string, badgeColor: string) {
    if (symbol == CurrencyCode.RUB) {
      return;
    }
    if (CurrencyCode.isCurrency(symbol)) {
      symbol = CurrencyCode.toInstrument(symbol);
      exchange = Exchanges.MOEX;
    }
    const instrument = { symbol, exchange, instrumentGroup: undefined };
    this.dashboardContextService.selectDashboardInstrument(instrument, badgeColor);
  }

  getPositions(settings: BlotterSettings) {
    return this.portfolioSubscriptionsService.getAllPositionsSubscription(settings.portfolio, settings.exchange).pipe(
      map(poses => settings.isSoldPositionsHidden ? poses.filter(p => p.qtyTFuture !== 0) : poses),
    );
  }

  getTrades(settings: BlotterSettings) {
    return this.portfolioSubscriptionsService.getTradesSubscription(settings.portfolio, settings.exchange);
  }

  getOrders(settings: BlotterSettings) {
    return this.portfolioSubscriptionsService.getOrdersSubscription(settings.portfolio, settings.exchange).pipe(
      tap(x => {
        if (!x.lastOrder) {
          return;
        }

        if (x.existingOrder) {
          this.notification.notificateOrderChange(x.lastOrder, x.existingOrder);
        }
        else {
          this.notification.notificateAboutNewOrder(x.lastOrder);
        }
      }),
      map(x => x.allOrders)
    );
  }

  getStopOrders(settings: BlotterSettings) {
    return this.portfolioSubscriptionsService.getStopOrdersSubscription(settings.portfolio, settings.exchange).pipe(
      tap(x => {
        if (!x.lastOrder) {
          return;
        }

        if (x.existingOrder) {
          this.notification.notificateOrderChange(x.lastOrder, x.existingOrder);
        }
        else {
          this.notification.notificateAboutNewOrder(x.lastOrder);
        }
      }),
      map(x => x.allOrders)
    );
  }

  getCommonSummary(settings: BlotterSettings): Observable<CommonSummaryView> {
    return combineLatest([
      this.portfolioSubscriptionsService.getSummariesSubscription(settings.portfolio, settings.exchange),
      this.getExchangeRate(settings.portfolio, settings.exchange)
    ]).pipe(
      map(([summary, quoteData]) => this.formatCommonSummary(summary, quoteData.currency, quoteData.quote))
    );
  }

  getForwardRisks(settings: BlotterSettings): Observable<ForwardRisksView> {
      return combineLatest([
        this.portfolioSubscriptionsService.getSpectraRisksSubscription(settings.portfolio, settings.exchange),
        this.getExchangeRate(settings.portfolio, settings.exchange)
      ]).pipe(
        map(([risks, quoteData]) => this.formatForwardRisks(risks, quoteData.currency, quoteData.quote))
      );
  }

  private getExchangeRate(portfolio: string, exchange: string): Observable<{ currency: string, quote: number }> {
    return this.terminalSettingsService.getSettings()
      .pipe(
        mapWith(
          () => this.marketService.getExchangeSettings(exchange),
          (settings, exchangeSettings) => ({settings, exchangeSettings})
        ),
        switchMap(({settings, exchangeSettings}) => {
          const portfolioCurrency = settings.portfoliosCurrency?.find(pc =>
            pc.portfolio.portfolio === portfolio && pc.portfolio.exchange === exchange
          );

          const currency = portfolioCurrency?.currency || exchangeSettings.currencyInstrument;

          if (currency === CurrencyInstrument.RUB) {
            return of({ currency, quote: 1 });
          }

          return this.quotes.getQuotes(currency, 'MOEX')
            .pipe(
              map(quote => ({ currency, quote: quote.last_price }))
            );
        })
      );
  }

  private formatCommonSummary(summary: CommonSummaryModel, currency: string, exchangeRate: number): CommonSummaryView {
    return ({
      buyingPowerAtMorning: formatCurrency(summary.buyingPowerAtMorning / exchangeRate, currency),
      buyingPower: formatCurrency(summary.buyingPower / exchangeRate, currency),
      profit: formatCurrency(summary.profit / exchangeRate, currency),
      profitRate: summary.profitRate,
      portfolioEvaluation: formatCurrency(summary.portfolioEvaluation / exchangeRate, currency),
      portfolioLiquidationValue: formatCurrency(summary.portfolioLiquidationValue / exchangeRate, currency),
      initialMargin: formatCurrency(summary.initialMargin / exchangeRate, currency),
      riskBeforeForcePositionClosing: formatCurrency(summary.riskBeforeForcePositionClosing / exchangeRate, currency),
      commission: formatCurrency(summary.commission / exchangeRate, currency),
    });
  }

  private formatForwardRisks(risks: ForwardRisks, currency: string, exchangeRate: number): ForwardRisksView {
    return {
      moneyFree: formatCurrency(risks.moneyFree / exchangeRate, currency),
      moneyBlocked: formatCurrency(risks.moneyBlocked / exchangeRate, currency),
      fee: formatCurrency(risks.fee / exchangeRate, currency),
      moneyOld: formatCurrency(risks.moneyOld / exchangeRate, currency),
      moneyAmount: formatCurrency(risks.moneyAmount / exchangeRate, currency),
      moneyPledgeAmount: formatCurrency(risks.moneyPledgeAmount / exchangeRate, currency),
      vmInterCl: formatCurrency(risks.vmInterCl / exchangeRate, currency),
      vmCurrentPositions: formatCurrency(risks.vmCurrentPositions / exchangeRate, currency),
      varMargin: formatCurrency(risks.varMargin / exchangeRate, currency),
      isLimitsSet: risks.isLimitsSet
    } as ForwardRisksView;
  }
}
