// Tipi per strategie multi-leg

export type OptionType = 'call' | 'put' | 'stock';
export type PositionType = 'long' | 'short';

export interface OptionLeg {
  id: string;
  type: OptionType;
  position: PositionType;
  strike?: number; // Opzionale per stock
  premium?: number; // Opzionale per stock (prezzo di acquisto)
  quantity: number;
  expiration?: string; // ISO date string, opzionale per stock
  iv?: number; // Volatilità implicita in decimale (0.25 = 25%), opzionale per stock
}

export interface Strategy {
  id: string;
  name: string;
  legs: OptionLeg[];
  underlyingPrice: number;
  underlyingSymbol?: string;
  multiplier: number; // Moltiplicatore contratto (es. 100 per azioni USA, 5 per DAX)
}

export interface StrategyGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface StrategyPnL {
  totalPnL: number;
  totalPnLPercent: number;
  maxProfit: number | null; // null = unlimited
  maxLoss: number | null; // null = unlimited
  breakEvenPoints: number[];
  legsPnL: {
    legId: string;
    pnl: number;
    pnlPercent: number;
  }[];
}

// Strategie predefinite
export type PresetStrategyType =
  | 'long_call'
  | 'long_put'
  | 'short_call'
  | 'short_put'
  | 'bull_call_spread'
  | 'bear_put_spread'
  | 'long_straddle'
  | 'short_straddle'
  | 'long_strangle'
  | 'short_strangle'
  | 'iron_condor'
  | 'butterfly'
  | 'calendar_spread'
  | 'diagonal_spread';

export interface PresetStrategy {
  type: PresetStrategyType;
  name: string;
  description: string;
  legs: Omit<OptionLeg, 'id' | 'expiration' | 'premium' | 'iv'>[];
  maxProfit: 'unlimited' | 'limited';
  maxLoss: 'unlimited' | 'limited';
  breakEvenCount: number;
}

