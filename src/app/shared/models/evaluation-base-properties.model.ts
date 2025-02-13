import { InstrumentKey } from "src/app/shared/models/instruments/instrument-key.model";

export interface EvaluationBaseProperties {
  price: number,
  lotQuantity: number,
  instrument: InstrumentKey,
  instrumentCurrency?: string
}

export interface QuantityEvaluationProperties {
  instrumentKey: InstrumentKey,
  budget: number,
  price?: number
}

