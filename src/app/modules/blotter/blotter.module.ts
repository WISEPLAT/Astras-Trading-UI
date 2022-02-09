import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BlotterRoutingModule } from './blotter-routing.module';
import { BlotterWidgetComponent } from './widgets/blotter-widget/blotter-widget.component';
import { PositionsComponent } from './components/positions/positions.component';
import { TradesComponent } from './components/trades/trades.component';
import { OrdersComponent } from './components/orders/orders.component';
import { BlotterSettingsComponent } from './components/blotter-settings/blotter-settings.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { SummariesComponent } from './components/summaries/summaries.component';


@NgModule({
  declarations: [
    BlotterWidgetComponent,
    PositionsComponent,
    TradesComponent,
    OrdersComponent,
    BlotterSettingsComponent,
    SummariesComponent
  ],
  imports: [
    SharedModule,
    BlotterRoutingModule
  ],
  exports: [
    BlotterWidgetComponent
  ]
})
export class BlotterModule { }
