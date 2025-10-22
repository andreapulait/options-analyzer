// Database moltiplicatori per contratti di opzioni
// Varia in base al sottostante

export const OPTION_MULTIPLIERS: Record<string, number> = {
  // Azioni USA (standard)
  'AAPL': 100,
  'MSFT': 100,
  'GOOGL': 100,
  'AMZN': 100,
  'TSLA': 100,
  'META': 100,
  'NVDA': 100,
  'AMD': 100,
  'NFLX': 100,
  
  // ETF USA
  'SPY': 100,
  'QQQ': 100,
  'IWM': 100,
  'DIA': 100,
  'VIX': 100,
  
  // Indici Europei
  'DAX': 5,
  'FDAX': 5,
  'MDAX': 5,
  'STOXX50': 10,
  'CAC40': 10,
  'FTSE': 10,
  
  // Futures E-mini
  'ES': 50,    // E-mini S&P 500
  'NQ': 20,    // E-mini Nasdaq
  'YM': 5,     // E-mini Dow
  'RTY': 50,   // E-mini Russell 2000
  
  // Commodities
  'GC': 100,   // Gold
  'SI': 5000,  // Silver
  'CL': 1000,  // Crude Oil
  'NG': 10000, // Natural Gas
};

export const DEFAULT_MULTIPLIER = 100;

export function getMultiplier(ticker: string): number {
  const normalizedTicker = ticker.trim().toUpperCase();
  return OPTION_MULTIPLIERS[normalizedTicker] || DEFAULT_MULTIPLIER;
}

