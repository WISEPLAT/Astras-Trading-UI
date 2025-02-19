import { TestBed } from '@angular/core/testing';

import {
  RXJS_WEBSOCKET_CTOR,
  SubscriptionsDataFeedService
} from './subscriptions-data-feed.service';
import {
  BehaviorSubject,
  Subject
} from 'rxjs';
import { AuthService } from './auth.service';
import { LoggerService } from './logger.service';
import { BaseResponse } from '../models/ws/base-response.model';

describe('SubscriptionsDataFeedService', () => {
  let service: SubscriptionsDataFeedService;

  let authServiceSpy: any;
  let loggerService: any;
  let webSocketSubjectMock: any;
  let socketConstructorSpy: any;

  beforeEach(() => {
    loggerService = jasmine.createSpyObj('LoggerService', ['trace', 'info', 'warn']);
    authServiceSpy = {
      accessToken$: new BehaviorSubject<string>('test_token')
    };

    webSocketSubjectMock = jasmine.createSpyObj('WebSocketSubject', ['multiplex']);
    socketConstructorSpy = jasmine.createSpy('RXJS_WEBSOCKET_CTOR').and.returnValue(webSocketSubjectMock);
  });

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: LoggerService, useValue: loggerService },
        {
          provide: RXJS_WEBSOCKET_CTOR,
          useValue: socketConstructorSpy
        },
      ]
    });

    service = TestBed.inject(SubscriptionsDataFeedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should subscribe only once for the same key', () => {
    const requests = [
      {
        key: 'Key1',
        opcode: 'opcode'
      },
      {
        key: 'Key1',
        opcode: 'opcode'
      }
    ];

    const getCode = (request: any) => `${request.key}_${request.opcode}`;

    requests.forEach(request => {
      service.subscribe<any, any>(request, getCode).subscribe();
    });

    expect(webSocketSubjectMock.multiplex).toHaveBeenCalledTimes(1);
  });

  it('should subscribe to each unique key', () => {
    const requests = [
      {
        key: 'Key1',
        opcode: 'opcode'
      },
      {
        key: 'Key2',
        opcode: 'opcode'
      },
      {
        key: 'Key3',
        opcode: 'opcode_other'
      }
    ];

    const getCode = (request: any) => `${request.key}_${request.opcode}`;

    requests.forEach(request => {
      service.subscribe<any, any>(request, getCode).subscribe();
    });

    expect(webSocketSubjectMock.multiplex).toHaveBeenCalledTimes(requests.length);
  });

  it('should provide subscription messages', (done) => {
    const messagesMock = new Subject<BaseResponse<any>>();

    webSocketSubjectMock.multiplex.and.returnValue(messagesMock);

    service.subscribe<any, any>({
        key: 'Key1',
        opcode: 'opcode'
      },
      request => `${request.key}_${request.opcode}`
    ).subscribe(() => {
      done();

      expect().nothing();
    });

    messagesMock.next({ data: {}, guid: '' });
  });
});
