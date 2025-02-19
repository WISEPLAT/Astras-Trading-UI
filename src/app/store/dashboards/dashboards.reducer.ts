import {
  createReducer,
  on
} from '@ngrx/store';
import {
  createEntityAdapter,
  EntityAdapter,
  EntityState
} from '@ngrx/entity';
import { EntityStatus } from '../../shared/models/enums/entity-status';
import {
  CurrentDashboardVersion,
  Dashboard
} from '../../shared/models/dashboard/dashboard.model';
import { Widget } from '../../shared/models/dashboard/widget.model';
import { GuidGenerator } from '../../shared/utils/guid';
import {
  CurrentDashboardActions,
  InternalDashboardActions,
  ManageDashboardsActions
} from './dashboards-actions';
import { toInstrumentKey } from '../../shared/utils/instruments';

export const dashboardsFeatureKey = 'dashboards';

export interface State extends EntityState<Dashboard> {
  status: EntityStatus
}

export const adapter: EntityAdapter<Dashboard> = createEntityAdapter<Dashboard>({
  selectId: model => model.guid
});

const initialState: State = adapter.getInitialState({
  status: EntityStatus.Initial
});

export const reducer = createReducer(
  initialState,

  on(ManageDashboardsActions.initDashboards, (state) => ({
    ...state,
    status: EntityStatus.Loading
  })),

  on(ManageDashboardsActions.initDashboardsSuccess, (state, { dashboards }) => {
    return adapter.addMany(
      dashboards,
      {
        ...state,
        status: EntityStatus.Success
      });
  }),

  on(
    ManageDashboardsActions.addDashboard,
    (state, props) => {
      let updatedState = state;
      if (props.isSelected) {
        updatedState = adapter.updateMany(
          state.ids.map(id => ({
            id: <string>id,
            changes: {
              isSelected: false
            }
          })),
          updatedState
        );
      }

      return adapter.addOne({
          guid: props.guid,
          version: CurrentDashboardVersion,
          title: props.title,
          isSelected: props.isSelected,
          items: props.existedItems.map(x => ({ ...x })),
          instrumentsSelection: props.instrumentsSelection ?? null
        },
        updatedState);
    }),

  on(ManageDashboardsActions.renameDashboard, (state, props) => {
    return adapter.updateOne({
        id: props.dashboardGuid,
        changes: {
          title: props.title
        }
      },
      state);
  }),

  on(ManageDashboardsActions.addWidgets, (state, props) => {
    const targetItem = state.entities[props.dashboardGuid];
    if (!targetItem) {
      return state;
    }

    return adapter.updateOne({
        id: targetItem.guid,
        changes: {
          items: [
            ...targetItem.items,
            ...props.widgets.map(w => (<Widget>{
                ...w,
                guid: GuidGenerator.newGuid()
              })
            )
          ]
        }
      },
      state);
  }),

  on(ManageDashboardsActions.removeWidgets, (state, props) => {
    const targetItem = state.entities[props.dashboardGuid];
    if (!targetItem) {
      return state;
    }

    return adapter.updateOne({
        id: targetItem.guid,
        changes: {
          items: targetItem.items.filter(x => !props.widgetIds.includes(x.guid))
        }
      },
      state);
  }),

  on(ManageDashboardsActions.selectDashboard, (state, props) => {
    const updatedState = adapter.updateMany(
      state.ids.map(id => ({
        id: <string>id,
        changes: {
          isSelected: false
        }
      })),
      state
    );

    return adapter.updateOne({
        id: props.dashboardGuid,
        changes: {
          isSelected: true
        }
      },
      updatedState);
  }),

  on(ManageDashboardsActions.updateWidgetPosition, (state, props) => {
    const targetDashboard = state.entities[props.dashboardGuid];
    if (!targetDashboard) {
      return state;
    }

    const targetItemIndex = targetDashboard.items.findIndex(x => x.guid === props.widgetGuid);
    if (targetItemIndex < 0) {
      return state;
    }

    const targetItemPosition = targetDashboard.items[targetItemIndex].position;
    if (targetItemPosition.x === props.position.x
      && targetItemPosition.y === props.position.y
      && targetItemPosition.cols === props.position.cols
      && targetItemPosition.rows === props.position.rows) {
      return state;
    }

    const updatedItems = [...targetDashboard.items];
    updatedItems[targetItemIndex] = {
      ...updatedItems[targetItemIndex],
      position: {
        ...props.position
      }
    };

    return adapter.updateOne(
      {
        id: targetDashboard.guid,
        changes: {
          items: updatedItems
        }
      },
      state
    );
  }),

  on(InternalDashboardActions.dropDashboardEntity, (state, props) => {
    let updatedState = state;
    const targetDashboard = state.entities[props.dashboardGuid];
    if (!targetDashboard) {
      return updatedState;
    }

    if (targetDashboard.isSelected) {
      const otherDashboardGuids = (state.ids as string[]).filter(x => x !== targetDashboard.guid);
      if (otherDashboardGuids.length === 0) {
        return updatedState;
      }

      updatedState = adapter.updateOne({
          id: otherDashboardGuids[0],
          changes: {
            isSelected: true
          }
        },
        updatedState
      );
    }

    return adapter.removeOne(props.dashboardGuid, updatedState);
  }),

  on(ManageDashboardsActions.removeAllDashboards, (state) => adapter.removeAll(state)),

  on(CurrentDashboardActions.selectPortfolio, (state, props) => {
    return adapter.updateOne({
        id: props.dashboardGuid,
        changes: {
          selectedPortfolio: props.portfolioKey ? {
              portfolio: props.portfolioKey.portfolio,
              exchange: props.portfolioKey.exchange,
              marketType: props.portfolioKey.marketType
            }
            : null
        }
      },
      state);
  }),

  on(CurrentDashboardActions.selectInstruments, (state, props) => {
    const targetDashboard = state.entities[props.dashboardGuid];
    if (!targetDashboard) {
      return state;
    }

    const instrumentsSelection = {
      ...targetDashboard.instrumentsSelection
    };

    props.selection.forEach(x => {
      instrumentsSelection[x.groupKey] = {
        ...toInstrumentKey(x.instrumentKey)
      };
    });

    return adapter.updateOne({
        id: props.dashboardGuid,
        changes: {
          instrumentsSelection: instrumentsSelection
        }
      },
      state);
  }),
);
