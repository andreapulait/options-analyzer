import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { calculateCall, calculatePut, calculateImpliedVolatility, type OptionInputs } from '@/lib/blackScholes';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, RotateCcw } from 'lucide-react';

export default function Home() {
  // Valori iniziali del setup
  const initialSpotPrice = 100;
  const initialStrike = 100;
  const initialRiskFreeRate = 0.03;

  // Date
  const today = new Date();
  const defaultExpiry = new Date(today);
  defaultExpiry.setDate(today.getDate() + 60);

  // Stati per i parametri di setup
  const [setupSpotPrice, setSetupSpotPrice] = useState(initialSpotPrice);
  const [strike, setStrike] = useState(initialStrike);
  const [tradeStartDate, setTradeStartDate] = useState(today.toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(defaultExpiry.toISOString().split('T')[0]);
  const [riskFreeRate, setRiskFreeRate] = useState(initialRiskFreeRate);
  const [callPremium, setCallPremium] = useState<number>(0);
  const [putPremium, setPutPremium] = useState<number>(0);

  // Stati per gli slider
  const [currentSpotPrice, setCurrentSpotPrice] = useState(initialSpotPrice);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [volatilityAdjustment, setVolatilityAdjustment] = useState(0);

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

  // Volatilità implicita
  const [impliedVolCall, setImpliedVolCall] = useState(0.25);
  const [impliedVolPut, setImpliedVolPut] = useState(0.25);

  // Calcolo premi iniziali
  useEffect(() => {
    const timeToExpiry = tradeDuration / 365;
    const baseInputs: OptionInputs = {
      S: setupSpotPrice,
      K: strike,
      T: timeToExpiry,
      r: riskFreeRate,
      sigma: 0.25,
    };

    const callResult = calculateCall(baseInputs);
    const putResult = calculatePut(baseInputs);

    if (callPremium === 0) {
      setCallPremium(callResult.price);
    }
    if (putPremium === 0) {
      setPutPremium(putResult.price);
    }
  }, []);

  // Ricalcolo IV
  useEffect(() => {
    if (callPremium > 0 && tradeDuration > 0) {
      const timeToExpiry = tradeDuration / 365;
      const iv = calculateImpliedVolatility(
        callPremium,
        setupSpotPrice,
        strike,
        timeToExpiry,
        riskFreeRate,
        true
      );
      setImpliedVolCall(iv);
    }
  }, [callPremium, setupSpotPrice, strike, tradeDuration, riskFreeRate]);

  useEffect(() => {
    if (putPremium > 0 && tradeDuration > 0) {
      const timeToExpiry = tradeDuration / 365;
      const iv = calculateImpliedVolatility(
        putPremium,
        setupSpotPrice,
        strike,
        timeToExpiry,
        riskFreeRate,
        false
      );
      setImpliedVolPut(iv);
    }
  }, [putPremium, setupSpotPrice, strike, tradeDuration, riskFreeRate]);

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

  // Input Black-Scholes
  const callInputs: OptionInputs = useMemo(
    () => ({
      S: currentSpotPrice,
      K: strike,
      T: timeToExpiry,
      r: riskFreeRate,
      sigma: effectiveVolCall,
    }),
    [currentSpotPrice, strike, timeToExpiry, riskFreeRate, effectiveVolCall]
  );

  const putInputs: OptionInputs = useMemo(
    () => ({
      S: currentSpotPrice,
      K: strike,
      T: timeToExpiry,
      r: riskFreeRate,
      sigma: effectiveVolPut,
    }),
    [currentSpotPrice, strike, timeToExpiry, riskFreeRate, effectiveVolPut]
  );

  // Calcolo risultati
  const callResult = useMemo(() => calculateCall(callInputs), [callInputs]);
  const putResult = useMemo(() => calculatePut(putInputs), [putInputs]);

  // P&L
  const callPnL = callResult.price - callPremium;
  const putPnL = putResult.price - putPremium;
  const callPnLPercent = (callPnL / callPremium) * 100;
  const putPnLPercent = (putPnL / putPremium) * 100;

  // Funzione reset slider
  const handleResetSliders = () => {
    setCurrentSpotPrice(setupSpotPrice);
    setCurrentDayIndex(0);
    setVolatilityAdjustment(0);
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
                  <Label className="text-xs text-slate-400">Sottostante</Label>
                  <Input
                    type="number"
                    value={setupSpotPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSetupSpotPrice(val);
                      setCurrentSpotPrice(val);
                    }}
                    className="h-8 bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Strike</Label>
                  <Input
                    type="number"
                    value={strike}
                    onChange={(e) => setStrike(Number(e.target.value))}
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
                    value={(riskFreeRate * 100).toFixed(2)}
                    onChange={(e) => setRiskFreeRate(Number(e.target.value) / 100)}
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
                    value={callPremium.toFixed(2)}
                    onChange={(e) => setCallPremium(Number(e.target.value))}
                    className="h-8 bg-slate-800 border-slate-700 text-white"
                  />
                  <p className="text-xs text-slate-500 mt-1">IV: {(impliedVolCall * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <Label className="text-xs text-orange-400">Premio Put</Label>
                  <Input
                    type="number"
                    value={putPremium.toFixed(2)}
                    onChange={(e) => setPutPremium(Number(e.target.value))}
                    className="h-8 bg-slate-800 border-slate-700 text-white"
                  />
                  <p className="text-xs text-slate-500 mt-1">IV: {(impliedVolPut * 100).toFixed(1)}%</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Area principale */}
          <div className="lg:col-span-7 space-y-4">
            {/* Card grandi Call e Put */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Call Option */}
              <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-white/90">Call Option</h3>
                    <TrendIndicator value={callPnL} percent={callPnLPercent} />
                  </div>
                  <div className="text-5xl font-bold text-white mb-1">{callResult.price.toFixed(2)}</div>
                  <div className="text-sm text-white/70">
                    Premio iniziale: {callPremium.toFixed(2)}
                  </div>
                  <div className={`text-lg font-semibold mt-2 ${callPnL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    P&L: {callPnL >= 0 ? '+' : ''}{callPnL.toFixed(2)} ({callPnL >= 0 ? '+' : ''}{callPnLPercent.toFixed(1)}%)
                  </div>
                </CardContent>
              </Card>

              {/* Put Option */}
              <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-white/90">Put Option</h3>
                    <TrendIndicator value={putPnL} percent={putPnLPercent} />
                  </div>
                  <div className="text-5xl font-bold text-white mb-1">{putResult.price.toFixed(2)}</div>
                  <div className="text-sm text-white/70">
                    Premio iniziale: {putPremium.toFixed(2)}
                  </div>
                  <div className={`text-lg font-semibold mt-2 ${putPnL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    P&L: {putPnL >= 0 ? '+' : ''}{putPnL.toFixed(2)} ({putPnL >= 0 ? '+' : ''}{putPnLPercent.toFixed(1)}%)
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Metriche secondarie */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-4 pb-3">
                  <div className="text-xs text-slate-400 mb-1">Intrinseco Call</div>
                  <div className="text-2xl font-bold text-blue-400">{callResult.intrinsicValue.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-4 pb-3">
                  <div className="text-xs text-slate-400 mb-1">Estrinseco Call</div>
                  <div className="text-2xl font-bold text-blue-400">{callResult.extrinsicValue.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-4 pb-3">
                  <div className="text-xs text-slate-400 mb-1">Intrinseco Put</div>
                  <div className="text-2xl font-bold text-orange-400">{putResult.intrinsicValue.toFixed(2)}</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="pt-4 pb-3">
                  <div className="text-xs text-slate-400 mb-1">Estrinseco Put</div>
                  <div className="text-2xl font-bold text-orange-400">{putResult.extrinsicValue.toFixed(2)}</div>
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
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-sm text-slate-300">Prezzo Sottostante</Label>
                    <span className="text-sm font-semibold text-white">{currentSpotPrice.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[currentSpotPrice]}
                    onValueChange={(val) => setCurrentSpotPrice(val[0])}
                    min={priceSliderMin}
                    max={priceSliderMax}
                    step={0.01}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>0</span>
                    <span>{setupSpotPrice.toFixed(0)}</span>
                    <span>{priceSliderMax.toFixed(0)}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-sm text-slate-300">Tempo (DTE)</Label>
                    <span className="text-sm font-semibold text-white">{currentDTE} giorni</span>
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
                  <div className="flex justify-between mb-2">
                    <Label className="text-sm text-slate-300">Volatilità</Label>
                    <span className="text-sm font-semibold text-white">
                      {volatilityAdjustment > 0 ? '+' : ''}
                      {volatilityAdjustment.toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    value={[volatilityAdjustment]}
                    onValueChange={(val) => setVolatilityAdjustment(val[0])}
                    min={-100}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>-100%</span>
                    <span>0%</span>
                    <span>+100%</span>
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

