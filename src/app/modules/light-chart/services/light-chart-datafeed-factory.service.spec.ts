import { TestBed } from '@angular/core/testing';

import { LightChartDatafeedFactoryService } from './light-chart-datafeed-factory.service';
import { HistoryService } from '../../../shared/services/history.service';
import { SubscriptionsDataFeedService } from '../../../shared/services/subscriptions-data-feed.service';

describe('LightChartDatafeedFactoryService', () => {
  let service: LightChartDatafeedFactoryService;

  let subscriptionsDataFeedServiceSpy: any;
  let historyServiceSpy: any;

  beforeEach(() => {
    subscriptionsDataFeedServiceSpy = jasmine.createSpy('SubscriptionsDataFeedService');
    historyServiceSpy = jasmine.createSpy('HistoryService');
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: SubscriptionsDataFeedService, useValue: subscriptionsDataFeedServiceSpy },
        { provide: HistoryService, useValue: historyServiceSpy },
      ]
    });
    service = TestBed.inject(LightChartDatafeedFactoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
