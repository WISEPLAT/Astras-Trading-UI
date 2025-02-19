import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { TranslocoService } from "@ngneat/transloco";
import { map } from "rxjs/operators";
import { HashMap } from "@ngneat/transloco/lib/types";
import { getTranslationPath } from "../utils/translation-helper";

type TranslatorFn = (key: string[], params?: HashMap) => string;

@Injectable({
  providedIn: 'root'
})
export class TranslatorService {

  constructor(
    private readonly translocoService: TranslocoService
  ) {}

  getActiveLang(): string {
    return this.translocoService.getActiveLang();
  }

  setActiveLang(lang: string) {
    this.translocoService.setActiveLang(lang);
  }

  getLangChanges() {
    return this.translocoService.langChanges$;
  }

  getTranslator(scope: string): Observable<TranslatorFn> {
    const scopePath = scope.length ? scope + '/' : '';
    return this.translocoService.selectTranslate('', {}, { scope }).pipe(
      map(() => (
        (key: string[], params?: HashMap) =>
          this.translocoService.translate(
            getTranslationPath(
              scopePath ? [scopePath] : [],
              key
            ),
            params
          )
      ))
    );
  }
}
