import {
  createAction,
  props
} from '@ngrx/store';
import {
  DashboardItemPosition,
  Widget
} from '../../shared/models/dashboard/widget.model';
import {
  Dashboard,
  InstrumentGroups
} from '../../shared/models/dashboard/dashboard.model';
import { PortfolioKey } from '../../shared/models/portfolio-key.model';
import { InstrumentKey } from '../../shared/models/instruments/instrument-key.model';

export class ManageDashboardsActions {
  static initDashboards = createAction(
    '[Dashboards] Init Dashboards'
  );

  static initDashboardsSuccess = createAction(
    '[Dashboards] Init Dashboards (SUCCESS)',
    props<{ dashboards: Dashboard[] }>()
  );

  static selectDashboard = createAction(
    '[Dashboards] Select Dashboard',
    props<{ dashboardGuid: string }>()
  );

  static addDashboard = createAction(
    '[Dashboards] Add Dashboard',
    props<{
      guid: string,
      title: string,
      isSelected: boolean,
      existedItems: Widget[],
      instrumentsSelection?: InstrumentGroups
    }>()
  );

  static addWidgets = createAction(
    '[Dashboards] Add Widgets',
    props<{
      dashboardGuid: string,
      widgets: Omit<Widget, 'guid'>[]
    }>()
  );

  static removeWidgets = createAction(
    '[Dashboards] Remove Widgets',
    props<{
      dashboardGuid: string,
      widgetIds: string[]
    }>()
  );

  static updateWidgetPosition = createAction(
    '[Dashboards] Update Widget Position',
    props<{
      dashboardGuid: string,
      widgetGuid: string,
      position: DashboardItemPosition
    }>()
  );

  static resetDashboard = createAction(
    '[Dashboards] Reset Dashboard',
    props<{
      dashboardGuid: string
    }>()
  );

  static renameDashboard = createAction(
    '[Dashboards] Rename Dashboard',
    props<{
      dashboardGuid: string,
      title: string
    }>()
  );

  /**
   Drops dashboard entity and clears widget settings
   */
  static removeDashboard = createAction(
    '[Dashboards] Remove Dashboard',
    props<{
      dashboardGuid: string
    }>()
  );

  static removeAllDashboards = createAction('[Dashboards] Remove All Dashboards');

  static saveDashboards = createAction('[Dashboards] Save Dashboards');
}

export class CurrentDashboardActions {
  static selectPortfolio = createAction(
    '[Dashboards] Select Portfolio',
    props<{
      dashboardGuid: string,
      portfolioKey: PortfolioKey | null
    }>()
  );

  static selectInstruments = createAction(
    '[Dashboards] Select Instruments',
    props<{
      dashboardGuid: string,
      selection: { groupKey: string, instrumentKey: InstrumentKey }[]
    }>()
  );
}

/**
 These actions can be dispatched only from store effects
 */
export class InternalDashboardActions {
  /**
   Drops dashboard entity from store
   */
  static dropDashboardEntity = createAction(
    '[Dashboards] Drop Dashboard Entity',
    props<{
      dashboardGuid: string
    }>()
  );
}

