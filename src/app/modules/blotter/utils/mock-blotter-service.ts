/* eslint-disable @typescript-eslint/no-unused-vars */
import { Observable, of } from "rxjs";
import { Position } from "src/app/shared/models/positions/position.model";
import { Trade } from "src/app/shared/models/trades/trade.model";
import { Order } from "../../../shared/models/orders/order.model";

export class MockServiceBlotter {
  order$: Observable<Order[]> = of([]);
  trade$: Observable<Trade[]> = of([]);
  position$: Observable<Position[]> = of([]);

  unsubscribe(): void {

  }

  getTrades(portfolio: string, exchange: string): Observable<Trade[]> {
    return of([]);
  }
  getPositions(portfolio: string, exchange: string): Observable<Position[]> {
    return of([]);

  }
  getOrders(portfolio: string, exchange: string): Observable<Order[]> {
    return of([]);
  }
  getStopOrders(guid: string) {
    return of([]);
  }
}
