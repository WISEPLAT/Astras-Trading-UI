import { Injectable } from '@angular/core';
import { BehaviorSubject, interval, Observable,  } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { BaseRequest } from 'src/app/shared/models/ws/base-request.model';
import { BaseResponse } from 'src/app/shared/models/ws/base-response.model';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import { OrderbookData } from '../models/orderbook-data.model';
import { OrderbookRequest } from '../models/orderbook-request.model';
import { OrderbookRow } from '../models/orderbook-row.model';
import { OrderbookSettings } from '../../../shared/models/settings/orderbook-settings.model';
import { OrderBookViewRow } from '../models/orderbook-view-row.model';
import { OrderBook } from '../models/orderbook.model';

@Injectable({
  providedIn: 'root'
})
export class OrderbookService {
  private orderbook$: Observable<OrderBook | null> = new Observable();
  private subGuid: string | null = null
  private settings: BehaviorSubject<OrderbookSettings | null> = new BehaviorSubject<OrderbookSettings | null>(null);

  settings$ = this.settings.asObservable()

  constructor(private ws: WebsocketService) {  }

  setSettings(settings: OrderbookSettings) {
    this.settings.next(settings);
  }

  unsubscribe() {
    if (this.subGuid) {
      this.ws.unsubscribe(this.subGuid);
    }
  }

  getOrderbook(symbol: string, exchange: string) {
    this.ws.connect()

    if (this.subGuid) {
      this.ws.unsubscribe(this.subGuid);
    }

    this.subGuid = GuidGenerator.newGuid();
    const request : OrderbookRequest = {
      opcode:"OrderBookGetAndSubscribe",
      code: symbol,
      exchange: exchange,
      depth: 10,
      format:"simple",
      guid: this.subGuid,
    }
    this.ws.subscribe(request)

    this.orderbook$ = this.ws.messages$.pipe(
      filter(m => m.guid == this.subGuid),
      map(r => {
        const br = r as BaseResponse<OrderbookData>;
        const rows = br.data.asks.map((a, i) => {
          const obr: OrderBookViewRow = {
            ask: a.price,
            askVolume: a.volume,
            bid: br.data.bids[i].price,
            bidVolume: br.data.bids[i].volume
          }
          return obr;
        })
        const volumes = [...rows.map(p => p?.askVolume ?? 0), ...rows.map(p => p?.bidVolume ?? 0)]
        const ob : OrderBook = {
          maxVolume: Math.max(...volumes),
          rows: rows
        }
        return ob;
      })
    )
    return this.orderbook$;
  }
}
