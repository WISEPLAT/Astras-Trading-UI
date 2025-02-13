import { ErrorHandler, NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SharedModule } from './shared/shared.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NZ_I18N, ru_RU, en_US } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import ru from '@angular/common/locales/ru';
import { FormsModule } from '@angular/forms';
import {
  HTTP_INTERCEPTORS,
  HttpClientModule
} from '@angular/common/http';
import { StoreModule } from '@ngrx/store';
import { extModules } from "./build-specifics/ext-modules";
import { ErrorHandlerService } from "./shared/services/handle-error/error-handler.service";
import { EffectsModule } from '@ngrx/effects';
import { ApplicationMetaModule } from './modules/application-meta/application-meta.module';
import { AuthInterceptor } from './shared/interceptors/auth.interceptor';
import { TranslocoRootModule } from './transloco-root.module';
import { TRANSLOCO_MISSING_HANDLER, TranslocoConfig, TranslocoMissingHandler } from "@ngneat/transloco";

class CustomHandler implements TranslocoMissingHandler {
  handle(key: string, config: TranslocoConfig, params?: any) {
    return params?.fallback || '';
  }
}

registerLocaleData(ru);

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    AppRoutingModule,
    SharedModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    StoreModule.forRoot({}),
    EffectsModule.forRoot(),
    ...extModules,
    ApplicationMetaModule,
    TranslocoRootModule
  ],
  bootstrap: [AppComponent],
  providers: [
    {
      provide: NZ_I18N,
      useFactory: (localId: string) => {
        switch (localId) {
          case 'en':
            return en_US;
          case 'ru':
            return ru_RU;
          default:
            return ru_RU;
        }
      }
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    { provide: ErrorHandler, useClass: ErrorHandlerService },
    {
      provide: TRANSLOCO_MISSING_HANDLER,
      useClass: CustomHandler
    }
  ]
})
export class AppModule {
}
