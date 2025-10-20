import { PresetStrategy } from '../types/strategy';

export const PRESET_STRATEGIES: PresetStrategy[] = [
  {
    type: 'long_call',
    name: 'Long Call',
    description: 'Acquisto di una call option. Profitto illimitato, perdita limitata al premio pagato.',
    legs: [
      { type: 'call', position: 'long', strike: 100, quantity: 1 }
    ],
    maxProfit: 'unlimited',
    maxLoss: 'limited',
    breakEvenCount: 1
  },
  {
    type: 'long_put',
    name: 'Long Put',
    description: 'Acquisto di una put option. Profitto alto, perdita limitata al premio pagato.',
    legs: [
      { type: 'put', position: 'long', strike: 100, quantity: 1 }
    ],
    maxProfit: 'limited',
    maxLoss: 'limited',
    breakEvenCount: 1
  },
  {
    type: 'bull_call_spread',
    name: 'Bull Call Spread',
    description: 'Acquisto call strike basso + vendita call strike alto. Profitto e perdita limitati.',
    legs: [
      { type: 'call', position: 'long', strike: 100, quantity: 1 },
      { type: 'call', position: 'short', strike: 110, quantity: 1 }
    ],
    maxProfit: 'limited',
    maxLoss: 'limited',
    breakEvenCount: 1
  },
  {
    type: 'bear_put_spread',
    name: 'Bear Put Spread',
    description: 'Acquisto put strike alto + vendita put strike basso. Profitto e perdita limitati.',
    legs: [
      { type: 'put', position: 'long', strike: 100, quantity: 1 },
      { type: 'put', position: 'short', strike: 90, quantity: 1 }
    ],
    maxProfit: 'limited',
    maxLoss: 'limited',
    breakEvenCount: 1
  },
  {
    type: 'long_straddle',
    name: 'Long Straddle',
    description: 'Acquisto call + put stesso strike. Profitto se movimento forte in qualsiasi direzione.',
    legs: [
      { type: 'call', position: 'long', strike: 100, quantity: 1 },
      { type: 'put', position: 'long', strike: 100, quantity: 1 }
    ],
    maxProfit: 'unlimited',
    maxLoss: 'limited',
    breakEvenCount: 2
  },
  {
    type: 'short_straddle',
    name: 'Short Straddle',
    description: 'Vendita call + put stesso strike. Profitto se prezzo rimane stabile.',
    legs: [
      { type: 'call', position: 'short', strike: 100, quantity: 1 },
      { type: 'put', position: 'short', strike: 100, quantity: 1 }
    ],
    maxProfit: 'limited',
    maxLoss: 'unlimited',
    breakEvenCount: 2
  },
  {
    type: 'long_strangle',
    name: 'Long Strangle',
    description: 'Acquisto call strike alto + put strike basso. Profitto se movimento forte.',
    legs: [
      { type: 'call', position: 'long', strike: 110, quantity: 1 },
      { type: 'put', position: 'long', strike: 90, quantity: 1 }
    ],
    maxProfit: 'unlimited',
    maxLoss: 'limited',
    breakEvenCount: 2
  },
  {
    type: 'short_strangle',
    name: 'Short Strangle',
    description: 'Vendita call strike alto + put strike basso. Profitto se prezzo rimane nel range.',
    legs: [
      { type: 'call', position: 'short', strike: 110, quantity: 1 },
      { type: 'put', position: 'short', strike: 90, quantity: 1 }
    ],
    maxProfit: 'limited',
    maxLoss: 'unlimited',
    breakEvenCount: 2
  },
  {
    type: 'iron_condor',
    name: 'Iron Condor',
    description: 'Bull put spread + bear call spread. Profitto se prezzo rimane nel range centrale.',
    legs: [
      { type: 'put', position: 'long', strike: 85, quantity: 1 },
      { type: 'put', position: 'short', strike: 95, quantity: 1 },
      { type: 'call', position: 'short', strike: 105, quantity: 1 },
      { type: 'call', position: 'long', strike: 115, quantity: 1 }
    ],
    maxProfit: 'limited',
    maxLoss: 'limited',
    breakEvenCount: 2
  },
  {
    type: 'butterfly',
    name: 'Butterfly Spread',
    description: 'Acquisto 2 option strike estremi + vendita 2 option strike centrale. Profitto se prezzo rimane al centro.',
    legs: [
      { type: 'call', position: 'long', strike: 90, quantity: 1 },
      { type: 'call', position: 'short', strike: 100, quantity: 2 },
      { type: 'call', position: 'long', strike: 110, quantity: 1 }
    ],
    maxProfit: 'limited',
    maxLoss: 'limited',
    breakEvenCount: 2
  }
];

export function getPresetStrategy(type: string): PresetStrategy | undefined {
  return PRESET_STRATEGIES.find(s => s.type === type);
}

