import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WatchlistCollectionEditComponent } from './watchlist-collection-edit.component';
import { WatchlistCollectionService } from '../../services/watchlist-collection.service';
import { of, Subject } from 'rxjs';
import { getTranslocoModule } from "../../../../shared/utils/testing";

describe('WatchlistCollectionEditComponent', () => {
  let component: WatchlistCollectionEditComponent;
  let fixture: ComponentFixture<WatchlistCollectionEditComponent>;
  const watchlistCollectionServiceSpy = jasmine.createSpyObj(
    'WatchlistCollectionService',
    [
      'collectionChanged$',
      'getWatchlistCollection',
      'updateListMeta',
      'createNewList',
      'removeList',
      'getPresetCollection'
    ]);

  const collectionChangedMock = new Subject();
  watchlistCollectionServiceSpy.collectionChanged$ = collectionChangedMock.asObservable();
  watchlistCollectionServiceSpy.getPresetCollection.and.returnValue(of(null));
  watchlistCollectionServiceSpy.getWatchlistCollection.and.returnValue(of({}));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WatchlistCollectionEditComponent],
      imports: [
        getTranslocoModule()
      ],
      providers: [
        { provide: WatchlistCollectionService, useValue: watchlistCollectionServiceSpy }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WatchlistCollectionEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
