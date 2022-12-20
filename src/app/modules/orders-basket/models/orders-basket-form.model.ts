import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';

export interface OrdersBasketItem {
  instrumentKey: InstrumentKey;
  quota: number;

  quantity: number;

  price: number;
}

export interface OrdersBasket {
  budget: number;
  items: OrdersBasketItem[];
}
