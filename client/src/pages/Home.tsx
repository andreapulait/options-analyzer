import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { calculateCall, calculatePut, calculateImpliedVolatility, type OptionInputs } from '@/lib/blackScholes';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, RotateCcw, RefreshCw, Settings } from 'lucide-react';
import { fetchPrice, type ApiConfig } from '@/lib/priceApi';

export default function Home() {
  // Valori iniziali del setup
  const initialSpotPrice = 100;
  const initialStrike = 100;
  const initialRiskFreeRate = 3; // 3% (in percentuale, sarà convertito in decimale)
  const initialIV = 0.25; // 25% (in decimale)

  // Date
  const today = new Date();
  const defaultExpiry = new Date(today);
  defaultExpiry.setDate(today.getDate() + 60);

  // Stati per i parametri di setup
  const [ticker, setTicker] = useState('');
  const [setupSpotPrice, setSetupSpotPrice] = useState(initialSpotPrice);
  const [lastFetchTime, setLastFetchTime] = useState<string | null>(null);
  const [lastFetchSource, setLastFetchSource] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // API keys opzionali
  const [showApiSettings, setShowApiSettings] = useState(false);
  const [finnhubKey, setFinnhubKey] = useState('');
  const [alphaVantageKey, setAlphaVantageKey] = useState('');
  const [strike, setStrike] = useState(initialStrike);
  const [tradeStartDate, setTradeStartDate] = useState(today.toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(defaultExpiry.toISOString().split('T')[0]);
  const [riskFreeRate, setRiskFreeRate] = useState(initialRiskFreeRate);
  
  // Premi iniziali calcolati con lazy initializer
  const [callPremium, setCallPremium] = useState<number>(() => {
    const timeToExpiry = 60 / 365;
    const inputs: OptionInputs = {
      S: initialSpotPrice,
      K: initialStrike,
      T: timeToExpiry,
      r: initialRiskFreeRate / 100, // Converti da % a decimale
      sigma: initialIV,
    };
    return calculateCall(inputs).price; // NON arrotondare per evitare discrepanze
  });
  
  const [putPremium, setPutPremium] = useState<number>(() => {
    const timeToExpiry = 60 / 365;
    const inputs: OptionInputs = {
      S: initialSpotPrice,
      K: initialStrike,
      T: timeToExpiry,
      r: initialRiskFreeRate / 100, // Converti da % a decimale
      sigma: initialIV,
    };
    return calculatePut(inputs).price; // NON arrotondare per evitare discrepanze
  });

  // Stati per gli slider
  const [currentSpotPrice, setCurrentSpotPrice] = useState(initialSpotPrice);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [volatilityAdjustment, setVolatilityAdjustment] = useState(0);
  
  // IV Base editabili (inizializzate con IV iniziale per coerenza)
  const [callIVBase, setCallIVBase] = useState<number>(initialIV);
  const [putIVBase, setPutIVBase] = useState<number>(initialIV);
  
  // Stati temporanei per i campi durante la digitazione
  const [tempCallPremium, setTempCallPremium] = useState<string>('');
  const [tempPutPremium, setTempPutPremium] = useState<string>('');
  const [tempCallIV, setTempCallIV] = useState<string>('');
  const [tempPutIV, setTempPutIV] = useState<string>('');

  // Calcolo durata trade
  const tradeDuration = useMemo(() => {
    const start = new Date(tradeStartDate);
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 1);
  }, [tradeStartDate, expiryDate]);

  const currentDTE = useMemo(() => {
    return Math.max(tradeDuration - currentDayIndex, 0);
  }, [tradeDuration, currentDayIndex]);

  useEffect(() => {
    setCurrentDayIndex(0);
  }, [tradeDuration]);

  // Volatilità implicita calcolata
  const [impliedVolCallCalculated, setImpliedVolCallCalculated] = useState(0.25);
  const [impliedVolPutCalculated, setImpliedVolPutCalculated] = useState(0.25);
  
  // IV effettiva: usa sempre IV Base (editabile dall'utente)
  const impliedVolCall = callIVBase;
  const impliedVolPut = putIVBase;

  // Funzioni per ricalcolare IV quando l'utente modifica manualmente i premi
  const handleCallPremiumBlur = () => {
    if (callPremium > 0 && tradeDuration > 0) {
      const timeToExpiry = tradeDuration / 365;
      const iv = calculateImpliedVolatility(
        callPremium,
        setupSpotPrice,
        strike,
        timeToExpiry,
        riskFreeRate / 100,
        true
      );
      if (iv && iv > 0 && iv < 2) { // Solo se IV è realistica (0-200%)
        setCallIVBase(iv);
        // Reset slider quando si modifica manualmente il premio
        setCurrentSpotPrice(setupSpotPrice);
        setCurrentDayIndex(0);
        setVolatilityAdjustment(0);
      }
    }
  };

  const handlePutPremiumBlur = () => {
    if (putPremium > 0 && tradeDuration > 0) {
      const timeToExpiry = tradeDuration / 365;
      const iv = calculateImpliedVolatility(
        putPremium,
        setupSpotPrice,
        strike,
        timeToExpiry,
        riskFreeRate / 100,
        false
      );
      if (iv && iv > 0 && iv < 2) { // Solo se IV è realistica (0-200%)
        setPutIVBase(iv);
        // Reset slider quando si modifica manualmente il premio
        setCurrentSpotPrice(setupSpotPrice);
        setCurrentDayIndex(0);
        setVolatilityAdjustment(0);
      }
    }
  };

  // Volatilità effettiva
  const effectiveVolCall = useMemo(() => {
    const adjusted = impliedVolCall * (1 + volatilityAdjustment / 100);
    return Math.max(adjusted, 0.01);
  }, [impliedVolCall, volatilityAdjustment]);

  const effectiveVolPut = useMemo(() => {
    const adjusted = impliedVolPut * (1 + volatilityAdjustment / 100);
    return Math.max(adjusted, 0.01);
  }, [impliedVolPut, volatilityAdjustment]);

  const timeToExpiry = currentDTE / 365;

  const priceSliderMin = 0;
  const priceSliderMax = setupSpotPrice * 3; // 300% del prezzo iniziale

  // Input Black-Scholes (converti solo risk-free da % a decimale, volatilità già in decimale)
  const callInputs: OptionInputs = useMemo(
    () => ({
      S: currentSpotPrice,
      K: strike,
      T: timeToExpiry,
      r: riskFreeRate / 100, // Converti da % a decimale (3.00 -> 0.03)
      sigma: effectiveVolCall, // Già in decimale (0.25)
    }),
    [currentSpotPrice, strike, timeToExpiry, riskFreeRate, effectiveVolCall]
  );

  const putInputs: OptionInputs = useMemo(
    () => ({
      S: currentSpotPrice,
      K: strike,
      T: timeToExpiry,
      r: riskFreeRate / 100, // Converti da % a decimale
      sigma: effectiveVolPut, // Già in decimale (0.25)
    }),
    [currentSpotPrice, strike, timeToExpiry, riskFreeRate, effectiveVolPut]
  );

  // Calcolo risultati
  const callResult = useMemo(() => calculateCall(callInputs), [callInputs]);
  const putResult = useMemo(() => calculatePut(putInputs), [putInputs]);

  // Verifica se gli slider sono resettati (nessuna simulazione attiva)
  const slidersReset = currentSpotPrice === setupSpotPrice && currentDayIndex === 0 && volatilityAdjustment === 0;
  
  // Quando slider resettati, mostra i premi iniziali invece di quelli calcolati
  // Questo garantisce P&L = 0.00% dopo modifiche manuali
  const displayCallPrice = slidersReset ? callPremium : callResult.price;
  const displayPutPrice = slidersReset ? putPremium : putResult.price;

  // P&L Long (Compratore) e Short (Venditore)
  const callPnLLong = displayCallPrice - callPremium;
  const putPnLLong = displayPutPrice - putPremium;
  const callPnLShort = -callPnLLong; // Opposto del long
  const putPnLShort = -putPnLLong;
  
  const callPnLLongPercent = (callPnLLong / callPremium) * 100;
  const putPnLLongPercent = (putPnLLong / putPremium) * 100;
  const callPnLShortPercent = -callPnLLongPercent;
  const putPnLShortPercent = -putPnLLongPercent;

  // Percentuali di variazione
  const priceChangePercent = ((currentSpotPrice - setupSpotPrice) / setupSpotPrice) * 100;
  const timeElapsedPercent = (currentDayIndex / tradeDuration) * 100;

  // Funzione reset slider
  const handleResetSliders = () => {
    setCurrentSpotPrice(setupSpotPrice);
    setCurrentDayIndex(0);
    setVolatilityAdjustment(0);
  };

  // Funzione per gestire modifiche manuali di Sottostante o Strike
  // Ricalcola i premi iniziali e resetta gli slider come nuovo punto di partenza
  const handleManualSetupChange = (newSpotPrice: number, newStrike: number) => {
    // Aggiorna i valori di setup
    setSetupSpotPrice(newSpotPrice);
    setCurrentSpotPrice(newSpotPrice);
    setStrike(newStrike);
    
    // Ricalcola i premi usando Black-Scholes con i nuovi valori
    const timeToExpiry = tradeDuration / 365;
    const callInputs: OptionInputs = {
      S: newSpotPrice,
      K: newStrike,
      T: timeToExpiry,
      r: riskFreeRate / 100,
      sigma: callIVBase, // Usa la IV base corrente
    };
    const putInputs: OptionInputs = {
      S: newSpotPrice,
      K: newStrike,
      T: timeToExpiry,
      r: riskFreeRate / 100,
      sigma: putIVBase, // Usa la IV base corrente
    };
    
    const callResult = calculateCall(callInputs);
    const putResult = calculatePut(putInputs);
    
    // Aggiorna i premi iniziali (NON arrotondare per evitare discrepanze)
    setCallPremium(callResult.price);
    setPutPremium(putResult.price);
    
    // Reset slider a valori iniziali
    setCurrentDayIndex(0);
    setVolatilityAdjustment(0);
  };

  // Funzione per gestire modifiche manuali delle IV Base
  // Ricalcola i premi con le nuove IV e resetta gli slider
  const handleManualIVChange = (newCallIV: number, newPutIV: number) => {
    // Aggiorna le IV Base
    setCallIVBase(newCallIV);
    setPutIVBase(newPutIV);
    
    // Ricalcola i premi usando Black-Scholes con le nuove IV
    const timeToExpiry = tradeDuration / 365;
    const callInputs: OptionInputs = {
      S: setupSpotPrice,
      K: strike,
      T: timeToExpiry,
      r: riskFreeRate / 100,
      sigma: newCallIV,
    };
    const putInputs: OptionInputs = {
      S: setupSpotPrice,
      K: strike,
      T: timeToExpiry,
      r: riskFreeRate / 100,
      sigma: newPutIV,
    };
    
    const callResult = calculateCall(callInputs);
    const putResult = calculatePut(putInputs);
    
    // Aggiorna i premi iniziali
    setCallPremium(callResult.price);
    setPutPremium(putResult.price);
    
    // Reset slider a valori iniziali
    setCurrentSpotPrice(setupSpotPrice);
    setCurrentDayIndex(0);
    setVolatilityAdjustment(0);
  };

  // Funzione fetch prezzo con sistema multi-API e reset automatico
  const handleFetchPrice = async () => {
    if (!ticker.trim()) {
      setFetchError('Inserisci un ticker');
      return;
    }

    setIsFetching(true);
    setFetchError(null);

    try {
      const config: ApiConfig = {
        finnhubKey: finnhubKey || undefined,
        alphaVantageKey: alphaVantageKey || undefined,
      };

      const result = await fetchPrice(ticker, config);
      
      const newPrice = Number(result.price.toFixed(2));
      
      // Reset completo del setup come nuovo punto di partenza
      setSetupSpotPrice(newPrice);
      setCurrentSpotPrice(newPrice);
      
      // Strike ATM arrotondato al più vicino intero
      const atmStrike = Math.round(newPrice);
      setStrike(atmStrike);
      
      // Imposta IV Base realistica (0.25 = 25% è un valore tipico per opzioni ATM a 60 giorni)
      // Salva in decimale per coerenza con calculateImpliedVolatility
      const realisticIV = 0.25; // Decimale (0.25 = 25%)
      setCallIVBase(realisticIV);
      setPutIVBase(realisticIV);
      
      // Calcola i premi usando Black-Scholes con la IV impostata
      const timeToExpiry = tradeDuration / 365;
      const callInputs: OptionInputs = {
        S: newPrice,
        K: atmStrike,
        T: timeToExpiry,
        r: riskFreeRate / 100,
        sigma: realisticIV, // Già in decimale (0.25)
      };
      const putInputs = { ...callInputs };
      
      const callResult = calculateCall(callInputs);
      const putResult = calculatePut(putInputs);
      
      // Imposta i premi calcolati (coerenti con la IV) - NON arrotondare
      setCallPremium(callResult.price);
      setPutPremium(putResult.price);
      
      // Reset slider a valori iniziali
      setCurrentDayIndex(0);
      setVolatilityAdjustment(0);
      
      setLastFetchTime(result.timestamp.toLocaleTimeString('it-IT'));
      setLastFetchSource(result.source);
      setFetchError(null);
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Errore di connessione');
      setLastFetchSource(null);
    } finally {
      setIsFetching(false);
    }
  };

  // Componente per indicatore trend
  const TrendIndicator = ({ value, percent }: { value: number; percent: number }) => {
    if (Math.abs(value) < 0.01) {
      return (
        <div className="flex items-center gap-1 text-gray-400">
          <Minus className="w-4 h-4" />
          <span className="text-sm font-semibold">0.0%</span>
        </div>
      );
    }
    const isPositive = value > 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span className="text-sm font-semibold">
          {isPositive ? '+' : ''}
          {percent.toFixed(1)}%
        </span>
      </div>
    );
  };

  // Greche
  const greeks = [
    {
      name: 'Delta',
      symbol: 'Δ',
      callValue: callResult.delta,
      putValue: putResult.delta,
      description: 'Variazione per 1€ di movimento',
    },
    {
      name: 'Gamma',
      symbol: 'Γ',
      callValue: callResult.gamma,
      putValue: putResult.gamma,
      description: 'Variazione del Delta',
    },
    {
      name: 'Theta',
      symbol: 'Θ',
      callValue: callResult.theta,
      putValue: putResult.theta,
      description: 'Decadimento giornaliero',
    },
    {
      name: 'Vega',
      symbol: 'ν',
      callValue: callResult.vega,
      putValue: putResult.vega,
      description: 'Sensibilità alla volatilità',
    },
    {
      name: 'Rho',
      symbol: 'ρ',
      callValue: callResult.rho,
      putValue: putResult.rho,
      description: 'Sensibilità al tasso',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4">
          <h1 className="text-2xl font-bold">Options Analyzer</h1>
          <p className="text-sm text-slate-400 mt-1">
            Dashboard interattiva con modello Black-Scholes
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Sidebar Setup - Compatta */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-300">Parametri Contratto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <Label className="text-xs text-slate-400">Ticker (opzionale)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="es. AAPL, TSLA"
                      value={ticker}
                      onChange={(e) => setTicker(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleFetchPrice();
                        }
                      }}
                      className="h-8 bg-slate-800 border-slate-700 text-white flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFetchPrice}
                      disabled={isFetching}
                      className="h-8 px-3 bg-slate-800 hover:bg-slate-700 border-slate-700"
                    >
                      {isFetching ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {fetchError && (
                    <p className="text-xs text-red-400 mt-1">{fetchError}</p>
                  )}
                  {lastFetchTime && !fetchError && (
                    <p className="text-xs text-green-400 mt-1">
                      Aggiornato: {lastFetchTime} ({lastFetchSource})
                    </p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowApiSettings(!showApiSettings)}
                    className="h-6 px-2 text-xs text-slate-400 hover:text-white mt-1"
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    {showApiSettings ? 'Nascondi' : 'Configura'} API
                  </Button>
                  {showApiSettings && (
                    <div className="mt-2 space-y-2 p-2 bg-slate-800 rounded border border-slate-700">
                      <div>
                        <Label className="text-xs text-slate-400">Finnhub API Key (opzionale)</Label>
                        <Input
                          type="text"
                          placeholder="Gratuita su finnhub.io"
                          value={finnhubKey}
                          onChange={(e) => setFinnhubKey(e.target.value)}
                          className="h-7 text-xs bg-slate-900 border-slate-600 text-white"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">Alpha Vantage Key (opzionale)</Label>
                        <Input
                          type="text"
                          placeholder="Gratuita su alphavantage.co"
                          value={alphaVantageKey}
                          onChange={(e) => setAlphaVantageKey(e.target.value)}
                          className="h-7 text-xs bg-slate-900 border-slate-600 text-white"
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        Le API keys sono opzionali. Migliorano la copertura per indici internazionali (DAX, FTSE, etc.).
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Sottostante</Label>
                  <Input
                    type="number"
                    value={setupSpotPrice}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const newSpotPrice = Number(e.target.value);
                      handleManualSetupChange(newSpotPrice, strike);
                    }}
                    className="h-8 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Strike</Label>
                  <Input
                    type="number"
                    value={strike}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => {
                      const newStrike = Number(e.target.value);
                      handleManualSetupChange(setupSpotPrice, newStrike);
                    }}
                    className="h-8 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Inizio Trade</Label>
                  <Input
                    type="date"
                    value={tradeStartDate}
                    onChange={(e) => setTradeStartDate(e.target.value)}
                    className="h-8 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Scadenza</Label>
                  <Input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="h-8 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-xs text-slate-400">Durata</div>
                  <div className="text-sm font-semibold">{tradeDuration} giorni</div>
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Risk-Free (%)</Label>
                  <Input
                    type="number"
                    value={riskFreeRate.toFixed(2)}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setRiskFreeRate(Number(e.target.value))}
                    className="h-8 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 mt-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-300">Premi Iniziali</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <Label className="text-xs text-blue-400">Premio Call</Label>
                  <Input
                    type="number"
                    value={tempCallPremium || callPremium.toFixed(2)}
                    onFocus={(e) => {
                      e.target.select();
                      setTempCallPremium(callPremium.toFixed(2));
                    }}
                    onChange={(e) => {
                      setTempCallPremium(e.target.value);
                    }}
                    onBlur={() => {
                      const newPremium = Number(tempCallPremium);
                      if (newPremium > 0) {
                        setCallPremium(newPremium);
                        
                        // Reset slider quando si modifica manualmente il premio
                        // NON ricalcola la IV - l'utente vuole testare con questi valori specifici
                        setCurrentSpotPrice(setupSpotPrice);
                        setCurrentDayIndex(0);
                        setVolatilityAdjustment(0);
                      }
                      setTempCallPremium('');
                    }}
                    className="h-8 bg-slate-800 border-slate-700 text-blue-300"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <Label className="text-xs text-slate-500">IV Base (%):</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={tempCallIV || (impliedVolCall * 100).toFixed(1)}
                      onFocus={(e) => {
                        e.target.select();
                        setTempCallIV((impliedVolCall * 100).toFixed(1));
                      }}
                      onChange={(e) => {
                        setTempCallIV(e.target.value);
                      }}
                      onBlur={() => {
                        const newCallIV = Number(tempCallIV) / 100;
                        if (newCallIV > 0) {
                          // Aggiorna solo la IV, NON ricalcola il premio
                          // L'utente vuole testare con questi valori specifici
                          setCallIVBase(newCallIV);
                          
                          // Reset slider
                          setCurrentSpotPrice(setupSpotPrice);
                          setCurrentDayIndex(0);
                          setVolatilityAdjustment(0);
                        }
                        setTempCallIV('');
                      }}
                      className="h-6 text-xs bg-slate-800 border-slate-700 text-blue-300 w-20"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-orange-400">Premio Put</Label>
                  <Input
                    type="number"
                    value={tempPutPremium || putPremium.toFixed(2)}
                    onFocus={(e) => {
                      e.target.select();
                      setTempPutPremium(putPremium.toFixed(2));
                    }}
                    onChange={(e) => {
                      setTempPutPremium(e.target.value);
                    }}
                    onBlur={() => {
                      const newPremium = Number(tempPutPremium);
                      if (newPremium > 0) {
                        setPutPremium(newPremium);
                        
                        // Reset slider quando si modifica manualmente il premio
                        // NON ricalcola la IV - l'utente vuole testare con questi valori specifici
                        setCurrentSpotPrice(setupSpotPrice);
                        setCurrentDayIndex(0);
                        setVolatilityAdjustment(0);
                      }
                      setTempPutPremium('');
                    }}
                    className="h-8 bg-slate-800 border-slate-700 text-orange-300"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <Label className="text-xs text-slate-500">IV Base (%):</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={tempPutIV || (impliedVolPut * 100).toFixed(1)}
                      onFocus={(e) => {
                        e.target.select();
                        setTempPutIV((impliedVolPut * 100).toFixed(1));
                      }}
                      onChange={(e) => {
                        setTempPutIV(e.target.value);
                      }}
                      onBlur={() => {
                        const newPutIV = Number(tempPutIV) / 100;
                        if (newPutIV > 0) {
                          // Aggiorna solo la IV, NON ricalcola il premio
                          // L'utente vuole testare con questi valori specifici
                          setPutIVBase(newPutIV);
                          
                          // Reset slider
                          setCurrentSpotPrice(setupSpotPrice);
                          setCurrentDayIndex(0);
                          setVolatilityAdjustment(0);
                        }
                        setTempPutIV('');
                      }}
                      className="h-6 text-xs bg-slate-800 border-slate-700 text-orange-300 w-20"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Area principale */}
          <div className="lg:col-span-7 space-y-2">
            {/* Card grandi Call e Put */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Call Option */}
              <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 shadow-lg">
                <CardContent className="pt-2 pb-2">
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className="text-base font-semibold text-white/90">Call Option</h3>
                    <TrendIndicator value={callPnLLong} percent={callPnLLongPercent} />
                  </div>
                  <div className="text-4xl font-bold text-white mb-0.5">{displayCallPrice.toFixed(2)}</div>
                  <div className="text-xs text-white/70 mb-0.5">
                    Premio iniziale: {callPremium.toFixed(2)}
                  </div>
                  <div className="space-y-0.5">
                    <div className={`text-sm font-semibold ${callPnLLong >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      P&L Long: {callPnLLong >= 0 ? '+' : ''}{callPnLLong.toFixed(2)} ({callPnLLong >= 0 ? '+' : ''}{callPnLLongPercent.toFixed(1)}%)
                    </div>
                    <div className={`text-sm font-semibold ${callPnLShort >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      P&L Short: {callPnLShort >= 0 ? '+' : ''}{callPnLShort.toFixed(2)} ({callPnLShort >= 0 ? '+' : ''}{callPnLShortPercent.toFixed(1)}%)
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Put Option */}
              <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-0 shadow-lg">
                <CardContent className="pt-2 pb-2">
                  <div className="flex justify-between items-start mb-0.5">
                    <h3 className="text-base font-semibold text-white/90">Put Option</h3>
                    <TrendIndicator value={putPnLLong} percent={putPnLLongPercent} />
                  </div>
                  <div className="text-4xl font-bold text-white mb-0.5">{displayPutPrice.toFixed(2)}</div>
                  <div className="text-xs text-white/70 mb-0.5">
                    Premio iniziale: {putPremium.toFixed(2)}
                  </div>
                  <div className="space-y-0.5">
                    <div className={`text-sm font-semibold ${putPnLLong >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      P&L Long: {putPnLLong >= 0 ? '+' : ''}{putPnLLong.toFixed(2)} ({putPnLLong >= 0 ? '+' : ''}{putPnLLongPercent.toFixed(1)}%)
                    </div>
                    <div className={`text-sm font-semibold ${putPnLShort >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                      P&L Short: {putPnLShort >= 0 ? '+' : ''}{putPnLShort.toFixed(2)} ({putPnLShort >= 0 ? '+' : ''}{putPnLShortPercent.toFixed(1)}%)
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Metriche secondarie */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-2 pb-2">
                  <div className="text-xs text-slate-400 mb-0.5">Intrinseco Call</div>
                  <div className="text-xl font-bold text-blue-400">{callResult.intrinsicValue.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-2 pb-2">
                  <div className="text-xs text-slate-400 mb-0.5">Estrinseco Call</div>
                  <div className="text-xl font-bold text-blue-400">{callResult.extrinsicValue.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-2 pb-2">
                  <div className="text-xs text-slate-400 mb-0.5">Intrinseco Put</div>
                  <div className="text-xl font-bold text-orange-400">{putResult.intrinsicValue.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-2 pb-2">
                  <div className="text-xs text-slate-400 mb-0.5">Estrinseco Put</div>
                  <div className="text-xl font-bold text-orange-400">{putResult.extrinsicValue.toFixed(2)}</div>
                </CardContent>
              </Card>
            </div>

            {/* Slider di simulazione */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-base text-slate-300">Controlli Simulazione</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetSliders}
                    className="h-8 gap-2 bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 py-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <Label className="text-sm text-slate-300">Prezzo Sottostante</Label>
                    <span className="text-sm font-semibold text-white">
                      {currentSpotPrice.toFixed(2)} 
                      <span className={`ml-2 ${priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div className="relative">
                    <Slider
                      value={[currentSpotPrice]}
                      onValueChange={(val) => setCurrentSpotPrice(val[0])}
                      min={priceSliderMin}
                      max={priceSliderMax}
                      step={0.01}
                      className="w-full"
                    />
                    {/* Marcatore valore iniziale */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-yellow-400 pointer-events-none"
                      style={{ left: `${(setupSpotPrice / priceSliderMax) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0</span>
                    <span className="text-yellow-400">{setupSpotPrice.toFixed(0)}</span>
                    <span>{priceSliderMax.toFixed(0)}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <Label className="text-sm text-slate-300">Tempo (DTE)</Label>
                    <span className="text-sm font-semibold text-white">
                      {currentDTE} giorni
                      <span className="ml-2 text-slate-400">
                        ({timeElapsedPercent.toFixed(0)}% trascorso)
                      </span>
                    </span>
                  </div>
                  <Slider
                    value={[currentDayIndex]}
                    onValueChange={(val) => setCurrentDayIndex(val[0])}
                    min={0}
                    max={tradeDuration}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Inizio ({tradeDuration} DTE)</span>
                    <span>Scadenza (0 DTE)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <Label className="text-sm text-slate-300">Volatilità</Label>
                    <span className="text-sm font-semibold text-white">
                      {volatilityAdjustment > 0 ? '+' : ''}
                      {volatilityAdjustment.toFixed(0)}%
                    </span>
                  </div>
                  <div className="relative">
                    <Slider
                      value={[volatilityAdjustment]}
                      onValueChange={(val) => setVolatilityAdjustment(val[0])}
                    min={-50}
                    max={50}
                      step={1}
                      className="w-full"
                    />
                    {/* Marcatore 0% */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-yellow-400 pointer-events-none"
                      style={{ left: '50%' }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>-50%</span>
                    <span className="text-yellow-400">0%</span>
                    <span>+50%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Pannello Greche - Colonna destra */}
          <div className="lg:col-span-3">
            <Card className="bg-slate-900 border-slate-800 sticky top-20">
              <CardHeader>
                <CardTitle className="text-base text-slate-300">Greche</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {greeks.map((greek) => (
                    <div key={greek.name} className="pb-3 border-b border-slate-800 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl font-semibold text-slate-400">{greek.symbol}</span>
                        <span className="text-sm font-medium text-slate-300">{greek.name}</span>
                      </div>
                      <div className="text-xs text-slate-500 mb-3">{greek.description}</div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-blue-400">Call</span>
                          <span className="text-sm font-semibold text-white">{greek.callValue.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-orange-400">Put</span>
                          <span className="text-sm font-semibold text-white">{greek.putValue.toFixed(4)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

