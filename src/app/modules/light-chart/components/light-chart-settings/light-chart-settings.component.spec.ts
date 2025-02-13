import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LightChartSettingsComponent } from './light-chart-settings.component';
import { of } from 'rxjs';
import { AppModule } from 'src/app/app.module';
import {
  getTranslocoModule,
  mockComponent
} from '../../../../shared/utils/testing';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { LightChartSettings } from '../../models/light-chart-settings.model';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from "@angular/forms";
import { NzSelectModule } from "ng-zorro-antd/select";
import { NzCollapseModule } from "ng-zorro-antd/collapse";
import { Component, forwardRef, Input } from "@angular/core";
import { NzFormModule } from "ng-zorro-antd/form";

@Component({
  selector: 'ats-instrument-board-select',
  template: '',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => InstrumentBoardMockComponent),
    multi: true
  }]
})
class InstrumentBoardMockComponent implements ControlValueAccessor {
  @Input() instrument: any;
  @Input() placeholder: any;

  registerOnChange(fn: any): void {
  }

  registerOnTouched(fn: any): void {
  }

  setDisabledState(isDisabled: boolean): void {
  }

  writeValue(obj: any): void {
  }
}

@Component({
  selector: 'ats-instrument-search',
  template: '',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => InstrumentSearchMockComponent),
    multi: true
  }]
})
class InstrumentSearchMockComponent implements ControlValueAccessor {
  @Input() instrument: any;
  @Input() placeholder: any;

  registerOnChange(fn: any): void {
  }

  registerOnTouched(fn: any): void {
  }

  setDisabledState(isDisabled: boolean): void {
  }

  writeValue(obj: any): void {
  }
}

describe('LightChartSettingsComponent', () => {
  let component: LightChartSettingsComponent;
  let fixture: ComponentFixture<LightChartSettingsComponent>;
  const spy = jasmine.createSpyObj('LightChartService', ['getBars']);
  spy.getBars.and.returnValue(of([]));

  const settings: LightChartSettings = {
    timeFrame: 'D',
    symbol: 'SBER',
    exchange: 'MOEX',
    guid: '123',
    width: 300,
    height: 300
  };

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach((async () => {
    await TestBed.configureTestingModule({
      declarations: [
        LightChartSettingsComponent,
        InstrumentBoardMockComponent,
        InstrumentSearchMockComponent
      ],
      imports: [
        AppModule,
        getTranslocoModule(),
        ReactiveFormsModule,
        NzSelectModule,
        NzCollapseModule,
        NzFormModule
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settings)),
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough()
          }
        }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LightChartSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
