import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { TableDisplaySettings } from '../../../shared/models/settings/table-display-settings.model';
import { Column } from '../models/column.model';
import { TableSettingHelper } from '../../../shared/utils/table-setting.helper';

export class BlotterTablesHelper {
  static changeColumnOrder(
    event: CdkDragDrop<any>,
    targetSettings: TableDisplaySettings,
    displayColumns: Column<any, any>[]): TableDisplaySettings {
    let updatedSettings = targetSettings;

    const currentColumn = displayColumns[event.previousIndex];
    displayColumns.splice(event.previousIndex, 1);
    displayColumns.splice(event.currentIndex, 0, currentColumn);
    displayColumns.forEach((column, index) => {
      const columnSettings = targetSettings.columns.find(c => c.columnId === column.id)!;

      updatedSettings = TableSettingHelper.updateColumn(
        columnSettings.columnId,
        updatedSettings,
        {
          columnOrder: index
        }
      );
    });

    return updatedSettings;
  }
}
