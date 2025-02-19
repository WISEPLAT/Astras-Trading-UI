import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderbookRoutingModule } from './orderbook-routing.module';
import { OrderBookComponent } from './components/orderbook/orderbook.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { OrderbookSettingsComponent } from './components/orderbook-settings/orderbook-settings.component';
import { OrderbookWidgetComponent } from './widgets/orderbook-widget/orderbook-widget.component';
import { OrderbookChartComponent } from './components/orderbook-chart/orderbook-chart.component';
import { NzInputModule } from "ng-zorro-antd/input";
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NzResizeObserverModule } from 'ng-zorro-antd/cdk/resize-observer';
import { ScalperOrderBookModule } from '../scalper-order-book/scalper-order-book.module';

@NgModule({
  declarations: [
    OrderBookComponent,
    OrderbookSettingsComponent,
    OrderbookWidgetComponent,
    OrderbookChartComponent
  ],
  imports: [
    CommonModule,
    OrderbookRoutingModule,
    SharedModule,
    NzInputModule,
    DragDropModule,
    NzResizeObserverModule,
    ScalperOrderBookModule
  ],
  exports: [
    OrderbookWidgetComponent
  ]
})
export class OrderbookModule {
}
