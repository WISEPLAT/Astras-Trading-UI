import { Injectable } from '@angular/core';
import {
  Observable,
  Subject
} from 'rxjs';
import {
  filter,
  map
} from 'rxjs/operators';

export interface BroadcastMessage<T> {
  messageType: string;
  payload?: T | null;
}

@Injectable({
  providedIn: 'root'
})
export class BroadcastService {
  private channel: BroadcastChannel | null = null;
  private messageSub$: Subject<MessageEvent> | null = null;

  constructor() {
  }

  publish<T>(message: BroadcastMessage<T>) {
    this.getOrCreateChannel().postMessage(message);
  }

  subscribe<T>(messageType: string): Observable<BroadcastMessage<T>> {
    if (!this.messageSub$) {
      this.messageSub$ = new Subject<MessageEvent>();
      this.getOrCreateChannel().onmessage = (message) => {
        this.messageSub$?.next(message);
      };
    }

    return this.messageSub$.pipe(
      map(x => x.data as BroadcastMessage<any>),
      filter(x => !!x && x.messageType === messageType),
      map(x => x as BroadcastMessage<T>)
    );
  }

  private getOrCreateChannel(): BroadcastChannel {
    if (!this.channel) {
      this.channel = new BroadcastChannel('ASTRAS Broadcast');
    }

    return this.channel;
  }
}
