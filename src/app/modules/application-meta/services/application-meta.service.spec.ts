import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { ApplicationMetaService } from './application-meta.service';
import { LocalStorageService } from '../../../shared/services/local-storage.service';
import { take } from 'rxjs';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';


describe('ApplicationMetaService', () => {
  let service: ApplicationMetaService;

  let httpTestingController: HttpTestingController;
  let localStorageServiceSpy: any;
  let errorHandlerServiceSpy: any;

  beforeEach(() => {
    localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', ['setItem', 'getItem']);
    errorHandlerServiceSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        {
          provide: LocalStorageService,
          useValue: localStorageServiceSpy
        },
        {
          provide: ErrorHandlerService,
          useValue: errorHandlerServiceSpy
        }
      ]
    });
    service = TestBed.inject(ApplicationMetaService);

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should read current version from server', () => {
    service.getCurrentVersion().subscribe();

    const req = httpTestingController.expectOne('https://warp.alor.dev/api/releases?offset=0&limit=1&sortDesc=true&selectedService=astras&locale=ru');
    expect(req.request.method).toEqual('GET');
  });

  it('should update CurrentVersion in local storage', () => {
    const expectedVersion = 'CHANGES-2079';
    service.updateCurrentVersion(expectedVersion);

    expect(localStorageServiceSpy.setItem).toHaveBeenCalledOnceWith(
      'version',
      expectedVersion
    );
  });

  it('should update savedVersion$', fakeAsync(() => {
    const savedVersion = 'CHANGES-2078';
    localStorageServiceSpy.getItem.and.returnValue(savedVersion);
    tick();

    service.savedVersion$.pipe(
      take(1)
    ).subscribe(version => {
      expect(version).toEqual(savedVersion);
    });

    const expectedVersion = 'CHANGES-2079';
    localStorageServiceSpy.getItem.and.returnValue(expectedVersion);
    service.updateCurrentVersion(expectedVersion);

    tick();
    service.savedVersion$.pipe(
      take(1)
    ).subscribe(version => {
      expect(version).toEqual(expectedVersion);
    });
  }));
});
