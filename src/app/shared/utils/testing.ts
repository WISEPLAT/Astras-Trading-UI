import { defer } from 'rxjs';
import { Instrument } from '../models/instruments/instrument.model';
import { Component, Directive, EventEmitter, ModuleWithProviders, Type } from '@angular/core';
import { SharedModule } from '../shared.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { NzSelectComponent } from "ng-zorro-antd/select";
import { NzSwitchComponent } from "ng-zorro-antd/switch";

/**
 * Create async observable that emits-once and completes  after a JS engine turn
 * @param data any data
 * @returns Observable with completed promise
 */
export function asyncData<T>(data: T) {
  return defer(() => Promise.resolve(data));
}
/**
 * A class with a bunch of data for tests
 */
export class TestData {
  public static get instruments(): Instrument[] {
    return [
      {
        symbol: 'AAPL',
        exchange: 'SPBX',
        instrumentGroup: 'SPBX',
        isin: 'US0378331005',
        description: 'AAPL',
        shortName: 'AAPL',
        currency: "RUB",
        minstep: 0.01
      },
      {
        symbol: 'DSKY',
        exchange: 'MOEX',
        instrumentGroup: 'TQBR',
        isin: 'RU000A0JSQ90',
        description: 'DSKY',
        shortName: 'DSKY',
        currency: "RUB",
        minstep: 0.01
      },
      {
        symbol: 'SBER',
        exchange: 'MOEX',
        instrumentGroup: 'TQBR',
        isin: 'RU0009029540',
        description: 'SBER',
        shortName: 'SBER',
        currency: "RUB",
        minstep: 0.01
      },
      {
        symbol: 'DVEC',
        exchange: 'MOEX',
        instrumentGroup: 'TQBR',
        isin: 'RU000A0JP2W1',
        description: 'DVEC',
        shortName: 'DVEC',
        currency: "RUB",
        minstep: 0.01
      }
    ];
  }
}

/**
 *  array of ng-zorro mock components
 */
export const ngZorroMockComponents = [
  mockComponent({selector: 'nz-header'}),
  mockComponent({
    selector: 'nz-table',
    inputs: [
      'nzFrontPagination',
      'nzNoResult',
      'nzShowPagination',
      'nzScroll',
      'nzData',
      'nzLoading',
      'nzWidthConfig',
      'nzVirtualMaxBufferPx',
      'nzVirtualMinBufferPx',
      'nzVirtualForTrackBy',
      'nzVirtualItemSize',
    ]
  }),
  mockComponent({
    selector: 'nz-tabset',
    inputs: ['nzSelectedIndex', 'nzAnimated']
  }),
  mockComponent({ selector: 'nz-tab' }),
  mockComponent({ selector: 'nz-layout' }),
  mockComponent({ selector: 'nz-empty' }),
  mockComponent({ selector: 'nz-content' }),
  mockComponent({
    selector: 'nz-spin',
    inputs: ['nzSpinning', 'nzIndicator']
  }),
  mockComponent({
    selector: 'nz-form-control',
    inputs: ['nzErrorTip']
  }),
  mockComponent({selector: 'nz-collapse', inputs: ['nzBordered']}),
  mockComponent({ selector: 'nz-collapse-panel' }),
  mockComponent({ selector: 'nz-form-item' }),
  mockComponent({ selector: 'nz-form-label' }),
  mockComponent({ selector: 'nz-input-group' }),
  mockComponent({
    selector: 'nz-dropdown-menu',
    exportAs: 'nzDropdownMenu',
  }),
  mockComponent({
    selector: 'nz-avatar',
    inputs: ['nzSize', 'nzText', 'nzSrc']
  }),
  mockComponent({
    selector: 'nz-modal',
    inputs: ['nzCancelText', 'nzVisible']
  }),
  mockDirective({selector: '[text]', inputs: ['text']}),
  mockDirective({selector: '[nzLayout]', inputs: ['nzLayout']}),
  mockDirective({selector: '[nzPopoverContent]', inputs: ['nzPopoverContent']}),
  mockDirective({
    selector: '[nz-button]',
    inputs: ['nzDropdownMenu', 'title', 'text', 'nzLoading', 'nzType']
  }),
  mockDirective({
    selector: '[nz-icon]',
    inputs: ['title', 'text', 'nzTwotoneColor', 'nzTheme']
  }),
];

/**
 *  SharedModule requires store module registered for root
 */
export const sharedModuleImportForTests: Array<Type<any> | ModuleWithProviders<{}> | any[]> = [
  StoreModule.forRoot({}),
  EffectsModule.forRoot(),
  SharedModule
];

/**
 *  function helper for mock components create
 */
export function mockComponent(options: Component, klass= (class {})) {
  let metadata: Component = { template: '<ng-content></ng-content>', ...options };
  const classWithOutputs = classWithOutputEmittersFactory(klass, options.outputs || []);

  return Component(metadata)(classWithOutputs);
}

export function mockDirective(options: Directive, klass = (class {})) {
  return Directive(options)(klass);
}

/**
 *  function for adding event emitters in mock component outputs
 */
function classWithOutputEmittersFactory(klass: any, outputs: string[]) {
  outputs.forEach(output => {
    klass[output] = new EventEmitter();
  });

  return klass;
}
