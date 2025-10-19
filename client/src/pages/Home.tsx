import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import ValueBar from '@/components/ValueBar';
import GreeksPanel from '@/components/GreeksPanel';
import { calculateCall, calculatePut, calculateImpliedVolatility, type OptionInputs } from '@/lib/blackScholes';

export default function Home() {
  // Valori iniziali del setup
  const initialSpotPrice = 100;
  const initialStrike = 100;
  const initialDTE = 60; // Giorni alla scadenza
  const initialRiskFreeRate = 0.03; // 3%

  // Stati per i parametri di setup (fissi, definiscono il contratto)
  const [setupSpotPrice, setSetupSpotPrice] = useState(initialSpotPrice);
  const [strike, setStrike] = useState(initialStrike);
  const [maxDTE, setMaxDTE] = useState(initialDTE);
  const [riskFreeRate, setRiskFreeRate] = useState(initialRiskFreeRate);
  const [callPremium, setCallPremium] = useState<number>(0);
  const [putPremium, setPutPremium] = useState<number>(0);

  // Stati per gli slider (variabili dinamiche)
  const [currentSpotPrice, setCurrentSpotPrice] = useState(initialSpotPrice);
  const [currentDTE, setCurrentDTE] = useState(initialDTE);
  const [volatilityAdjustment, setVolatilityAdjustment] = useState(0); // Percentuale di aggiustamento

  // Calcolo della volatilità implicita iniziale dai premi
  const [impliedVolCall, setImpliedVolCall] = useState(0.25);
  const [impliedVolPut, setImpliedVolPut] = useState(0.25);

  // Calcolo iniziale dei premi teorici con volatilità base
  useEffect(() => {
    const timeToExpiry = maxDTE / 365;
    const baseInputs: OptionInputs = {
      S: setupSpotPrice,
      K: strike,
      T: timeToExpiry,
      r: riskFreeRate,
      sigma: 0.25, // Volatilità base 25%
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

  // Ricalcolo della volatilità implicita quando cambiano i premi o i parametri di setup
  useEffect(() => {
    if (callPremium > 0 && maxDTE > 0) {
      const timeToExpiry = maxDTE / 365;
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
  }, [callPremium, setupSpotPrice, strike, maxDTE, riskFreeRate]);

  useEffect(() => {
    if (putPremium > 0 && maxDTE > 0) {
      const timeToExpiry = maxDTE / 365;
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
  }, [putPremium, setupSpotPrice, strike, maxDTE, riskFreeRate]);

  // Calcolo della volatilità effettiva con aggiustamento
  const effectiveVolCall = useMemo(() => {
    const adjusted = impliedVolCall * (1 + volatilityAdjustment / 100);
    return Math.max(adjusted, 0.01);
  }, [impliedVolCall, volatilityAdjustment]);

  const effectiveVolPut = useMemo(() => {
    const adjusted = impliedVolPut * (1 + volatilityAdjustment / 100);
    return Math.max(adjusted, 0.01);
  }, [impliedVolPut, volatilityAdjustment]);

  // Calcolo del tempo alla scadenza in anni
  const timeToExpiry = currentDTE / 365;

  // Input per Black-Scholes con parametri correnti
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

  // Calcolo dei risultati correnti
  const callResult = useMemo(() => calculateCall(callInputs), [callInputs]);
  const putResult = useMemo(() => calculatePut(putInputs), [putInputs]);

  // Valore massimo per le barre
  const maxValueCall = Math.max(callResult.price, callPremium, 1);
  const maxValuePut = Math.max(putResult.price, putPremium, 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4">
          <h1 className="text-3xl font-bold text-foreground">Options Analyzer</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Analisi interattiva delle opzioni con modello Black-Scholes e volatilità implicita
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar sinistra - Controlli */}
          <div className="lg:col-span-1 space-y-6">
            {/* Parametri di Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Setup Iniziale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="setupSpot">Prezzo Sottostante Iniziale (€)</Label>
                  <Input
                    id="setupSpot"
                    type="number"
                    value={setupSpotPrice}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSetupSpotPrice(val);
                      setCurrentSpotPrice(val);
                    }}
                    step={1}
                    min={1}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="strike">Strike Price (€)</Label>
                  <Input
                    id="strike"
                    type="number"
                    value={strike}
                    onChange={(e) => setStrike(Number(e.target.value))}
                    step={1}
                    min={1}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxDTE">Giorni alla Scadenza (DTE)</Label>
                  <Input
                    id="maxDTE"
                    type="number"
                    value={maxDTE}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setMaxDTE(val);
                      setCurrentDTE(val);
                    }}
                    step={7}
                    min={1}
                    max={365}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="riskFreeRate">Tasso Risk-Free (%)</Label>
                  <Input
                    id="riskFreeRate"
                    type="number"
                    value={(riskFreeRate * 100).toFixed(2)}
                    onChange={(e) => setRiskFreeRate(Number(e.target.value) / 100)}
                    step={0.1}
                    min={0}
                    max={20}
                    className="font-mono"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Premi delle Opzioni */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Premi di Mercato</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="callPremium" className="text-green-600 dark:text-green-400">
                    Premio Call (€)
                  </Label>
                  <Input
                    id="callPremium"
                    type="number"
                    value={callPremium.toFixed(2)}
                    onChange={(e) => setCallPremium(Number(e.target.value))}
                    step={0.1}
                    min={0}
                    className="font-mono"
                  />
                  <p className="text-xs text-foreground/60">
                    IV: {(impliedVolCall * 100).toFixed(1)}%
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="putPremium" className="text-red-600 dark:text-red-400">
                    Premio Put (€)
                  </Label>
                  <Input
                    id="putPremium"
                    type="number"
                    value={putPremium.toFixed(2)}
                    onChange={(e) => setPutPremium(Number(e.target.value))}
                    step={0.1}
                    min={0}
                    className="font-mono"
                  />
                  <p className="text-xs text-foreground/60">
                    IV: {(impliedVolPut * 100).toFixed(1)}%
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Slider Dinamici */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Simulazione</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Slider Prezzo */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">Prezzo Corrente</Label>
                    <span className="font-mono text-sm font-semibold">€{currentSpotPrice.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[currentSpotPrice]}
                    onValueChange={(val) => setCurrentSpotPrice(val[0])}
                    min={0}
                    max={setupSpotPrice * 5}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-foreground/60">
                    <span>€0</span>
                    <span>€{setupSpotPrice.toFixed(0)}</span>
                    <span>€{(setupSpotPrice * 5).toFixed(0)}</span>
                  </div>
                </div>

                {/* Slider DTE */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">DTE Rimanenti</Label>
                    <span className="font-mono text-sm font-semibold">{currentDTE} giorni</span>
                  </div>
                  <Slider
                    value={[currentDTE]}
                    onValueChange={(val) => setCurrentDTE(val[0])}
                    min={0}
                    max={maxDTE}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-foreground/60">
                    <span>Scadenza (0)</span>
                    <span>Oggi ({maxDTE})</span>
                  </div>
                </div>

                {/* Slider Volatilità */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm">Aggiustamento Vol</Label>
                    <span className="font-mono text-sm font-semibold">
                      {volatilityAdjustment > 0 ? '+' : ''}
                      {volatilityAdjustment.toFixed(0)}%
                    </span>
                  </div>
                  <Slider
                    value={[volatilityAdjustment]}
                    onValueChange={(val) => setVolatilityAdjustment(val[0])}
                    min={-100}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-foreground/60">
                    <span>-100%</span>
                    <span>0%</span>
                    <span>+100%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Area destra - Visualizzazioni */}
          <div className="lg:col-span-3 space-y-6">
            {/* Barre di visualizzazione - 2/3 */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Call Option */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-green-600 dark:text-green-400 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    Call Option
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ValueBar
                    label="Valore Intrinseco"
                    value={callResult.intrinsicValue}
                    maxValue={maxValueCall}
                    color="#10b981"
                  />
                  <ValueBar
                    label="Valore Estrinseco"
                    value={callResult.extrinsicValue}
                    maxValue={maxValueCall}
                    color="#34d399"
                  />
                  <ValueBar
                    label="Valore Totale"
                    value={callResult.price}
                    maxValue={maxValueCall}
                    color="#059669"
                  />
                  <div className="pt-4 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground/60">Premio Iniziale:</span>
                      <span className="font-mono font-semibold">€{callPremium.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-foreground/60">Valore Corrente:</span>
                      <span className="font-mono font-semibold">€{callResult.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-foreground/60">P&L:</span>
                      <span
                        className={`font-mono font-semibold ${
                          callResult.price - callPremium >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        €{(callResult.price - callPremium).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Put Option */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-red-600 dark:text-red-400 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    Put Option
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ValueBar
                    label="Valore Intrinseco"
                    value={putResult.intrinsicValue}
                    maxValue={maxValuePut}
                    color="#ef4444"
                  />
                  <ValueBar
                    label="Valore Estrinseco"
                    value={putResult.extrinsicValue}
                    maxValue={maxValuePut}
                    color="#f87171"
                  />
                  <ValueBar
                    label="Valore Totale"
                    value={putResult.price}
                    maxValue={maxValuePut}
                    color="#dc2626"
                  />
                  <div className="pt-4 border-t border-border">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground/60">Premio Iniziale:</span>
                      <span className="font-mono font-semibold">€{putPremium.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-foreground/60">Valore Corrente:</span>
                      <span className="font-mono font-semibold">€{putResult.price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-foreground/60">P&L:</span>
                      <span
                        className={`font-mono font-semibold ${
                          putResult.price - putPremium >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        €{(putResult.price - putPremium).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pannello Greche - 1/3 */}
            <GreeksPanel callResult={callResult} putResult={putResult} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 mt-12">
        <div className="container py-6 text-center text-sm text-foreground/60">
          <p>Modello Black-Scholes con calcolo della volatilità implicita</p>
          <p className="mt-1">Sviluppato con React e TypeScript</p>
        </div>
      </footer>
    </div>
  );
}

