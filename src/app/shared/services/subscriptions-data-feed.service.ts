import {
  Inject,
  Injectable,
  InjectionToken
} from '@angular/core';
import {
  webSocket,
  WebSocketSubject
} from 'rxjs/webSocket';
import { AuthService } from './auth.service';
import { LoggerService } from './logger.service';
import {
  BehaviorSubject,
  filter,
  interval,
  Observable,
  shareReplay,
  Subject,
  Subscription,
  switchMap,
  take
} from 'rxjs';
import { BaseResponse } from '../models/ws/base-response.model';
import { ConfirmResponse } from '../models/ws/confirm-response.model';
import { environment } from '../../../environments/environment';
import { GuidGenerator } from '../utils/guid';
import {
  finalize,
  map,
  takeWhile,
  tap
} from 'rxjs/operators';
import { isOnline$ } from '../utils/network';

export interface SubscriptionRequest {
  opcode: string;
}

type WsResponseMessage = BaseResponse<any> & ConfirmResponse;

interface WsRequestMessage extends SubscriptionRequest {
  guid: string;
}

interface SubscriptionState {
  messageSource: Subject<WsResponseMessage>,
  sharedStream$: Observable<any>,
  request: WsRequestMessage,
  subscription: Subscription
}

interface SocketState {
  readonly socketId: string;
  readonly subscriptionsMap: Map<string, SubscriptionState>;
  webSocketSubject: WebSocketSubject<WsResponseMessage> | null;
  isClosing: boolean;
  reconnectSub: Subscription | null;

  offlineSub: Subscription | null
}

export const RXJS_WEBSOCKET_CTOR = new InjectionToken<typeof webSocket>(
  'rxjs/webSocket',
  {
    providedIn: 'root',
    factory: () => webSocket,
  }
);

@Injectable({
  providedIn: 'root'
})
export class SubscriptionsDataFeedService {
  private socketState: SocketState | null = null;

  private isConnected$ = new BehaviorSubject<boolean>(false);

  private readonly options = {
    reconnectTimeout: 2000,
    reconnectAttempts: 5
  };

  constructor(
    private accountService: AuthService,
    private logger: LoggerService,
    @Inject(RXJS_WEBSOCKET_CTOR) private webSocketFactory: typeof webSocket
  ) {
  }

  public getConnectionStatus(): Observable<boolean> {
    return this.isConnected$.pipe(
      map(x => {
        if(!this.socketState) {
          return true;
        }

        return x;
      })
    );
  }

  public subscribe<T extends SubscriptionRequest, R>(request: T, getSubscriptionId: (request: T) => string): Observable<R> {
    const socketState = this.getSocket();
    const subscriptionId = getSubscriptionId(request);

    const existingSubscription = socketState.subscriptionsMap.get(subscriptionId);
    if (!!existingSubscription) {
      return existingSubscription.sharedStream$;
    }

    const requestMessage: WsRequestMessage = {
      ...request,
      guid: GuidGenerator.newGuid()
    };

    const subject = new Subject<any>();
    const messageSubscription = this.subscribeToMessages(this.createSubscription(requestMessage, socketState), subject, subscriptionId);

    const subscriptionState: SubscriptionState = {
      request: requestMessage,
      messageSource: subject,
      sharedStream$: subject.pipe(
        finalize(() => {
          this.dropSubscription(socketState, subscriptionId);
        }),
        map(x => x.data as R),
        shareReplay({ bufferSize: 1, refCount: true })
      ),
      subscription: messageSubscription
    };

    socketState.subscriptionsMap.set(subscriptionId, subscriptionState);

    return subscriptionState.sharedStream$;
  }

  private subscribeToMessages(source: Observable<WsResponseMessage>, target: Subject<any>, subscriptionId: string): Subscription {
    return source.subscribe({
      next: (value) => target.next(value),
      complete: () => this.logger.trace(this.toLoggerMessage(`${subscriptionId} COMPLETED`)),
      error: () => this.logger.trace(this.toLoggerMessage(`${subscriptionId} ERROR`)),
    });
  }

  private dropSubscription(socketState: SocketState, subscriptionId: string) {
    const state = socketState.subscriptionsMap.get(subscriptionId);

    if (state) {
      socketState.subscriptionsMap.delete(subscriptionId);
      state.subscription.unsubscribe();

      if (socketState.subscriptionsMap.size === 0) {
        socketState.isClosing = true;
      }
    }
  }

  private createSubscription(request: WsRequestMessage, state: SocketState): Observable<WsResponseMessage> {
    return this.getCurrentAccessToken().pipe(
      take(1),
      switchMap(token => {
        return state.webSocketSubject!.multiplex(
          () => ({
            ...request,
            token
          }),
          () => ({
            opcode: 'unsubscribe',
            guid: request.guid,
            token: token
          }),
          (value) => value.guid === request.guid && !!value.data
        );
      })
    );
  }

  private getSocket(): SocketState {
    if (!!this.socketState && this.isStateValid(this.socketState)) {
      return this.socketState;
    }

    const socketState: SocketState = {
      socketId: GuidGenerator.newGuid(),
      isClosing: false,
      subscriptionsMap: new Map<string, SubscriptionState>(),
      webSocketSubject: null,
      reconnectSub: null,
      offlineSub: null
    };

    socketState.webSocketSubject = this.createWebSocketSubject(socketState);

    this.initReconnectOnDisconnection(socketState);

    this.socketState = socketState;

    return socketState;
  }

  private createWebSocketSubject(socketState: SocketState): WebSocketSubject<WsResponseMessage> {
    return this.webSocketFactory<WsResponseMessage>({
      url: environment.wsUrl,
      openObserver: {
        next: () => {
          this.logger.trace(this.toLoggerMessage('Connection open'));
          this.isConnected$.next(true);
        }
      },
      closeObserver: {
        next: (event) => {
          if (socketState.subscriptionsMap.size > 0) {
            this.logger.warn(
              this.toLoggerMessage('Connection closed with active subscriptions'),
              JSON.stringify(event)
            );

            socketState.webSocketSubject?.complete();
            socketState.webSocketSubject = null;

            this.reconnect(socketState);
            this.isConnected$.next(false);

            return;
          }

          this.logger.info(this.toLoggerMessage('Connection closed'));
          this.clean(socketState);
        }
      }
    });
  }

  private isStateValid(state: SocketState): boolean {
    return !!state.webSocketSubject && !state.webSocketSubject.closed && !state.isClosing;
  }

  private initReconnectOnDisconnection(state: SocketState) {
    if (!!state.offlineSub) {
      return;
    }

    state.offlineSub =
      isOnline$().pipe(
        filter(() => !this.isStateValid(state)),
        filter(isOnline => isOnline),
      ).subscribe(() => {
        this.reconnect(state);
      });
  }

  private clean(state: SocketState) {
    state.reconnectSub?.unsubscribe();
    state.offlineSub?.unsubscribe();
  }

  private getCurrentAccessToken(): Observable<string> {
    return this.accountService.accessToken$
      .pipe(
        filter(x => !!x)
      );
  }

  private reconnect(socketState: SocketState) {
    if (socketState.reconnectSub) {
      return;
    }

    const reconnection$ = interval(this.options.reconnectTimeout)
      .pipe(
        takeWhile((v, index) => index < this.options.reconnectAttempts && !this.isStateValid(socketState)),
        finalize(() => {
          socketState.reconnectSub?.unsubscribe();
          socketState.reconnectSub = null;
        }),
        tap(attempt => this.logger.warn(this.toLoggerMessage('Reconnection attempt #' + (attempt + 1))))
      );

    socketState.reconnectSub = reconnection$.subscribe(() => {
      socketState.webSocketSubject = this.createWebSocketSubject(socketState);
      socketState.subscriptionsMap.forEach((state, subscriptionId) => {
        this.logger.trace(this.toLoggerMessage(`Reconnect to ${subscriptionId}`));
        state.subscription = this.subscribeToMessages(this.createSubscription(state.request, socketState), state.messageSource, subscriptionId);
      });
    });
  }

  private toLoggerMessage(message: string): string {
    return `[SDF]: ${message}`;
  }
}
