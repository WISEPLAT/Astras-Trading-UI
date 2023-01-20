import { Component, EventEmitter, OnInit } from '@angular/core';
import {
  CompactType,
  DisplayGrid,
  Draggable,
  GridsterConfig,
  GridType,
  PushDirections,
  Resizable,
} from 'angular-gridster2';
import { map, Observable } from 'rxjs';
import { Widget } from 'src/app/shared/models/widget.model';
import { DashboardItem } from '../../../../shared/models/dashboard-item.model';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { mobileBreakpoint } from "../../../../shared/utils/device-helper";

interface Safe extends GridsterConfig {
  draggable: Draggable;
  resizable: Resizable;
  pushDirections: PushDirections;
}

@Component({
  selector: 'ats-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.less'],
})
export class DashboardComponent implements OnInit {
  options!: Safe;
  dashboard$?: Observable<Widget[]>;

  resize: EventEmitter<DashboardItem> = new EventEmitter<DashboardItem>();
  isBlockWidget = false;

  constructor(private service: DashboardService) {
  }

  ngOnInit(): void {
    this.options = {
      gridType: GridType.Fit,
      compactType: CompactType.None,
      margin: 5,
      outerMargin: true,
      outerMarginTop: null,
      outerMarginRight: null,
      outerMarginBottom: null,
      outerMarginLeft: null,
      useTransformPositioning: true,
      mobileBreakpoint,
      minCols: 50,
      maxCols: 100,
      minRows: 30,
      maxRows: 100,
      maxItemCols: 100,
      minItemCols: 1,
      maxItemRows: 100,
      minItemRows: 1,
      maxItemArea: 2500,
      minItemArea: 1,
      defaultItemCols: 1,
      defaultItemRows: 1,
      fixedColWidth: 105,
      fixedRowHeight: 30,
      keepFixedHeightInMobile: true,
      keepFixedWidthInMobile: false,
      scrollSensitivity: 10,
      scrollSpeed: 20,
      enableEmptyCellClick: false,
      enableEmptyCellContextMenu: false,
      enableEmptyCellDrop: false,
      enableEmptyCellDrag: false,
      enableOccupiedCellDrop: false,
      emptyCellDragMaxCols: 50,
      emptyCellDragMaxRows: 50,
      ignoreMarginInRow: false,
      draggable: {
        enabled: true,
        start: (gridsterItem, gridsterItemComp) => {
          gridsterItemComp.el.style.zIndex = '3';
          this.isBlockWidget = true;
        },
        stop: (gridsterItem, gridsterItemComp) => {
          gridsterItemComp.el.style.zIndex = '2';
          this.isBlockWidget = false;
        }
      },
      resizable: {
        enabled: true,
        handles: {
          s: true, n: true, w: true, e: true, nw: true, ne: true, sw: true, se: false
          // se: false
        },
        start: () => {
          this.isBlockWidget = true;
        },
        stop: () => {
          this.isBlockWidget = false;
        }
      },
      pushDirections: { north: true, east: true, south: true, west: true },
      pushResizeItems: false,
      pushItems: true,
      swap: false,
      disablePushOnDrag: true,
      disablePushOnResize: false,
      displayGrid: DisplayGrid.None,
      disableWindowResize: false,
      disableWarnings: true,
      scrollToNewItems: false,
      itemResizeCallback: (item, e) => {
        if (e.resize.resizeEnabled) {
          this.resize.emit({...item, height: e.height, width: e.width });
        }
        else {
          this.resize.emit({...item, height: e.el.clientHeight, width: e.el.clientWidth });
        }
      },
      itemChangeCallback: () => {
        this.service.saveDashboard('default');
      }
    };

    this.dashboard$ = this.service.dashboard$.pipe(
      map(map => Array.from(map.values()))
    );
  }
}
