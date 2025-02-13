import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsComponent } from './components/news/news.component';
import { NewsWidgetComponent } from './widgets/news-widget/news-widget.component';
import { SharedModule } from "../../shared/shared.module";
import { NzSpinModule } from "ng-zorro-antd/spin";
import { NewsModalWidgetComponent } from './widgets/news-modal-widget/news-modal-widget.component';
import { NzResizeObserverModule } from 'ng-zorro-antd/cdk/resize-observer';


@NgModule({
  declarations: [
    NewsComponent,
    NewsWidgetComponent,
    NewsModalWidgetComponent
  ],
  exports: [
    NewsWidgetComponent,
    NewsModalWidgetComponent
  ],
    imports: [
        CommonModule,
        SharedModule,
        NzSpinModule,
        NzResizeObserverModule,
    ]
})
export class NewsModule {
}
