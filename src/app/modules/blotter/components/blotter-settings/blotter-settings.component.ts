import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  Observable,
  shareReplay,
  Subject,
  take,
  takeUntil,
} from "rxjs";
import { exchangesList } from "../../../../shared/models/enums/exchanges";
import { TableDisplaySettings } from '../../../../shared/models/settings/table-display-settings.model';
import { TableSettingHelper } from '../../../../shared/utils/table-setting.helper';
import { Store } from '@ngrx/store';
import { PortfolioExtended } from '../../../../shared/models/user/portfolio-extended.model';
import { selectPortfoliosState } from '../../../../store/portfolios/portfolios.selectors';
import {
  filter,
  map
} from 'rxjs/operators';
import { EntityStatus } from '../../../../shared/models/enums/entity-status';
import { groupPortfoliosByAgreement } from '../../../../shared/utils/portfolios';
import {
  allOrdersColumns,
  allPositionsColumns,
  allStopOrdersColumns,
  allTradesColumns,
  BlotterSettings,
  ColumnIds
} from '../../models/blotter-settings.model';

@Component({
  selector: 'ats-blotter-settings[guid]',
  templateUrl: './blotter-settings.component.html',
  styleUrls: ['./blotter-settings.component.less']
})
export class BlotterSettingsComponent implements OnInit, OnDestroy {
  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<BlotterSettings> = new EventEmitter<BlotterSettings>();
  form!: UntypedFormGroup;
  allOrdersColumns: ColumnIds[] = allOrdersColumns;
  allStopOrdersColumns: ColumnIds[] = allStopOrdersColumns;
  allTradesColumns: ColumnIds[] = allTradesColumns;
  allPositionsColumns: ColumnIds[] = allPositionsColumns;
  prevSettings?: BlotterSettings;
  exchanges: string[] = exchangesList;

  availablePortfolios$!: Observable<Map<string, PortfolioExtended[]>>;

  private readonly destroy$: Subject<boolean> = new Subject<boolean>();
  private settings$!: Observable<BlotterSettings>;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly store: Store
  ) {
  }

  ngOnInit() {
    this.settings$ = this.settingsService.getSettings<BlotterSettings>(this.guid).pipe(
      shareReplay(1)
    );

    this.settings$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      if (settings) {
        this.prevSettings = settings;

        this.form = new UntypedFormGroup({
          portfolio: new UntypedFormControl(this.toPortfolioKey(settings), Validators.required),
          exchange: new UntypedFormControl({ value: settings.exchange, disabled: true }, Validators.required),
          ordersColumns: new UntypedFormControl(this.toTableSettings(settings.ordersTable, settings.ordersColumns)?.columns?.map(c => c.columnId)),
          stopOrdersColumns: new UntypedFormControl(this.toTableSettings(settings.stopOrdersTable, settings.stopOrdersColumns)?.columns?.map(c => c.columnId)),
          tradesColumns: new UntypedFormControl(this.toTableSettings(settings.tradesTable, settings.tradesColumns)?.columns?.map(c => c.columnId)),
          positionsColumns: new UntypedFormControl(this.toTableSettings(settings.positionsTable, settings.positionsColumns)?.columns?.map(c => c.columnId)),
          isSoldPositionsHidden: new UntypedFormControl(settings.isSoldPositionsHidden ?? false),
          cancelOrdersWithoutConfirmation: new UntypedFormControl(settings.cancelOrdersWithoutConfirmation ?? false)
        });
      }
    });

    this.availablePortfolios$ = this.store.select(selectPortfoliosState).pipe(
      filter(p => p.status === EntityStatus.Success),
      map(portfolios => groupPortfoliosByAgreement(Object.values(portfolios.entities).filter((x): x is PortfolioExtended => !!x)))
    );
  }

  portfolioChanged(portfolio: string) {
    this.form.controls.exchange.setValue(this.getPortfolioKey(portfolio).exchange);
  }

  submitForm(): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(initialSettings => {
      const portfolio = this.getPortfolioKey(this.form.value.portfolio);

      const newSettings = {
        ...this.form.value,
        portfolio: portfolio.portfolio,
        exchange: portfolio.exchange
      };

      newSettings.ordersTable = this.updateTableSettings(newSettings.ordersColumns, initialSettings.ordersTable);
      delete newSettings.ordersColumns;
      newSettings.stopOrdersTable = this.updateTableSettings(newSettings.stopOrdersColumns, initialSettings.stopOrdersTable);
      delete newSettings.stopOrdersColumns;
      newSettings.tradesTable = this.updateTableSettings(newSettings.tradesColumns, initialSettings.tradesTable);
      delete newSettings.tradesColumns;
      newSettings.positionsTable = this.updateTableSettings(newSettings.positionsColumns, initialSettings.positionsTable);
      delete newSettings.positionsColumns;

      newSettings.linkToActive = initialSettings.linkToActive && this.isPortfolioEqual(initialSettings, newSettings);

      this.settingsService.updateSettings<BlotterSettings>(this.guid, newSettings);
      this.settingsChange.emit();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  toPortfolioKey(portfolio: {portfolio: string, exchange: string}): string {
    return `${portfolio.portfolio}:${portfolio.exchange}`;
  }

  private isPortfolioEqual(settings1: BlotterSettings, settings2: BlotterSettings) {
    return settings1.portfolio === settings2.portfolio
      && settings1.exchange === settings2.exchange;
  }

  private toTableSettings(tableSettings?: TableDisplaySettings | null, columnIds?: string[]): TableDisplaySettings | undefined {
    if (tableSettings) {
      return tableSettings;
    }

    if (columnIds) {
      return TableSettingHelper.toTableDisplaySettings(columnIds);
    }

    return undefined;
  }

  private updateTableSettings(columnIds: string[], currentSettings?: TableDisplaySettings): TableDisplaySettings {
    const newSettings = this.toTableSettings(null, columnIds)!;

    if (currentSettings) {
      newSettings.columns.forEach((column, index) => {
        const matchedColumn = currentSettings!.columns.find(x => x.columnId === column.columnId);
        if (matchedColumn) {
          newSettings.columns[index] = {
            ...column,
            ...matchedColumn
          };
        }
      });
    }

    return newSettings!;
  }
  private getPortfolioKey(portfolio: string): {portfolio: string, exchange: string} {
    const parts = portfolio.split(':');
    return {
      portfolio: parts[0],
      exchange: parts[1]
    };
  }
}
