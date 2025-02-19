import {
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { InstrumentsService } from '../../../modules/instruments/services/instruments.service';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import {
  BehaviorSubject,
  Observable,
  of,
  switchMap
} from 'rxjs';


@Component({
  selector: 'ats-instrument-board-select[instrument]',
  templateUrl: './instrument-board-select.component.html',
  styleUrls: ['./instrument-board-select.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: InstrumentBoardSelectComponent
    }
  ]
})
export class InstrumentBoardSelectComponent implements OnInit, OnDestroy, ControlValueAccessor {
  currentValue: string | null = null;
  availableBoards$!: Observable<string[]>;
  @Input()
  placeholder?: string;
  private instrument$ = new BehaviorSubject<{ symbol: string, exchange: string } | null>(null);

  constructor(private readonly instrumentsService: InstrumentsService) {
  }

  @Input()
  set instrument(value: { symbol: string, exchange: string } | null) {
    this.instrument$.next(value);
  }

  ngOnDestroy(): void {
    this.instrument$.complete();
  }

  ngOnInit(): void {
    this.availableBoards$ = this.instrument$.pipe(
      switchMap(instrument => {
        if (!instrument) {
          return of([]);
        }

        return this.instrumentsService.getInstrumentBoards(instrument);
      })
    );
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onValueChanged = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  writeValue(board: string): void {
    this.currentValue = board;
  }

  selectBoard(value: string) {
    this.onTouched();
    this.onValueChanged(value);
  }

  private onValueChanged: (value: string | null) => void = () => {
  };

  private onTouched = () => {
  };
}
