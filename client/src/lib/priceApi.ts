// Sistema multi-API per recupero prezzi con fallback automatico

export interface PriceResult {
  price: number;
  source: 'yahoo' | 'finnhub' | 'alphavantage';
  timestamp: Date;
}

export interface ApiConfig {
  finnhubKey?: string;
  alphaVantageKey?: string;
}

// Mapping ticker per diversi provider
const tickerMapping: Record<string, { yahoo: string; finnhub: string; alphavantage: string }> = {
  'DAX': { yahoo: '^GDAXI', finnhub: 'DAX', alphavantage: 'DAX' },
  'FTSE': { yahoo: '^FTSE', finnhub: 'FTSE', alphavantage: 'FTSE' },
  'CAC40': { yahoo: '^FCHI', finnhub: 'CAC40', alphavantage: 'CAC40' },
  'NIKKEI': { yahoo: '^N225', finnhub: 'NIKKEI', alphavantage: 'NIKKEI' },
};

// Normalizza ticker per provider specifico
function normalizeTicker(ticker: string, provider: 'yahoo' | 'finnhub' | 'alphavantage'): string {
  const upperTicker = ticker.toUpperCase();
  if (tickerMapping[upperTicker]) {
    return tickerMapping[upperTicker][provider];
  }
  return ticker;
}

// Yahoo Finance API con proxy CORS
async function fetchYahoo(ticker: string): Promise<number> {
  const normalizedTicker = normalizeTicker(ticker, 'yahoo');
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${normalizedTicker}?interval=1d&range=1d`;
  
  // Lista di proxy CORS pubblici da provare
  const corsProxies = [
    '', // Prova prima senza proxy
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
  ];

  for (const proxy of corsProxies) {
    try {
      const url = proxy ? `${proxy}${encodeURIComponent(yahooUrl)}` : yahooUrl;
      const response = await fetch(url, {
        method: 'GET',
        headers: proxy ? {} : { 'Accept': 'application/json' },
      });

      if (!response.ok) {
        continue; // Prova il prossimo proxy
      }

      const data = await response.json();
      const quote = data.chart?.result?.[0]?.meta?.regularMarketPrice;

      if (quote && quote > 0) {
        return Number(quote);
      }
    } catch (error) {
      // Continua con il prossimo proxy
      continue;
    }
  }

  throw new Error('Yahoo Finance: impossibile recuperare il prezzo (CORS)');
}

// Finnhub API
async function fetchFinnhub(ticker: string, apiKey: string): Promise<number> {
  const normalizedTicker = normalizeTicker(ticker, 'finnhub');
  const response = await fetch(
    `https://finnhub.io/api/v1/quote?symbol=${normalizedTicker}&token=${apiKey}`
  );

  if (!response.ok) {
    throw new Error('Finnhub: errore API');
  }

  const data = await response.json();
  
  if (data.c && data.c > 0) {
    return Number(data.c); // current price
  }

  throw new Error('Finnhub: prezzo non disponibile');
}

// Alpha Vantage API
async function fetchAlphaVantage(ticker: string, apiKey: string): Promise<number> {
  const normalizedTicker = normalizeTicker(ticker, 'alphavantage');
  const response = await fetch(
    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${normalizedTicker}&apikey=${apiKey}`
  );

  if (!response.ok) {
    throw new Error('Alpha Vantage: errore API');
  }

  const data = await response.json();
  const quote = data['Global Quote'];

  if (quote && quote['05. price']) {
    return Number(quote['05. price']);
  }

  throw new Error('Alpha Vantage: prezzo non disponibile');
}

// Funzione principale con fallback automatico
export async function fetchPrice(ticker: string, config: ApiConfig = {}): Promise<PriceResult> {
  const errors: string[] = [];

  // Prova 1: Yahoo Finance (sempre disponibile)
  try {
    const price = await fetchYahoo(ticker);
    return {
      price,
      source: 'yahoo',
      timestamp: new Date(),
    };
  } catch (error) {
    errors.push(`Yahoo: ${error instanceof Error ? error.message : 'errore sconosciuto'}`);
  }

  // Prova 2: Finnhub (se API key disponibile)
  if (config.finnhubKey) {
    try {
      const price = await fetchFinnhub(ticker, config.finnhubKey);
      return {
        price,
        source: 'finnhub',
        timestamp: new Date(),
      };
    } catch (error) {
      errors.push(`Finnhub: ${error instanceof Error ? error.message : 'errore sconosciuto'}`);
    }
  }

  // Prova 3: Alpha Vantage (se API key disponibile)
  if (config.alphaVantageKey) {
    try {
      const price = await fetchAlphaVantage(ticker, config.alphaVantageKey);
      return {
        price,
        source: 'alphavantage',
        timestamp: new Date(),
      };
    } catch (error) {
      errors.push(`Alpha Vantage: ${error instanceof Error ? error.message : 'errore sconosciuto'}`);
    }
  }

  // Tutte le API hanno fallito
  throw new Error(`Impossibile recuperare il prezzo. Errori:\n${errors.join('\n')}`);
}

// Helper per ticker comuni
export const commonTickers = {
  // Indici USA
  'S&P 500': '^SPX',
  'Dow Jones': '^DJI',
  'Nasdaq': '^IXIC',
  
  // Indici Europa
  'DAX': 'DAX',
  'FTSE 100': 'FTSE',
  'CAC 40': 'CAC40',
  
  // ETF popolari
  'SPY': 'SPY',
  'QQQ': 'QQQ',
  'IWM': 'IWM',
  
  // Azioni popolari
  'Apple': 'AAPL',
  'Tesla': 'TSLA',
  'Microsoft': 'MSFT',
  'Google': 'GOOGL',
};

