import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import ValueBar from '@/components/ValueBar';
import GreeksPanel from '@/components/GreeksPanel';
import { calculateCall, calculatePut, type OptionInputs } from '@/lib/blackScholes';

export default function Home() {
  // Valori iniziali
  const initialSpotPrice = 100;
  const initialStrike = 100;
  const initialVolatility = 0.25; // 25%
  const initialRiskFreeRate = 0.03; // 3%
  const maxDaysToExpiry = 365;

  // Stati per i parametri
  const [spotPrice, setSpotPrice] = useState(initialSpotPrice);
  const [strike, setStrike] = useState(initialStrike);
  const [daysToExpiry, setDaysToExpiry] = useState(180); // 6 mesi
  const [volatilityAdjustment, setVolatilityAdjustment] = useState(0); // Percentuale di aggiustamento
  const [riskFreeRate, setRiskFreeRate] = useState(initialRiskFreeRate);

  // Calcolo della volatilità effettiva
  const effectiveVolatility = useMemo(() => {
    const adjusted = initialVolatility * (1 + volatilityAdjustment / 100);
    return Math.max(adjusted, 0.01); // Minimo 1%
  }, [volatilityAdjustment]);

  // Calcolo del tempo alla scadenza in anni
  const timeToExpiry = daysToExpiry / 365;

  // Input per Black-Scholes
  const inputs: OptionInputs = useMemo(
    () => ({
      S: spotPrice,
      K: strike,
      T: timeToExpiry,
      r: riskFreeRate,
      sigma: effectiveVolatility,
    }),
    [spotPrice, strike, timeToExpiry, riskFreeRate, effectiveVolatility]
  );

  // Calcolo dei risultati
  const callResult = useMemo(() => calculateCall(inputs), [inputs]);
  const putResult = useMemo(() => calculatePut(inputs), [inputs]);

  // Valore massimo per le barre (il maggiore tra call e put)
  const maxValue = Math.max(callResult.price, putResult.price, 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-4">
          <h1 className="text-3xl font-bold text-foreground">Options Analyzer</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Analisi interattiva delle opzioni con modello Black-Scholes
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Pannello di controllo - sinistra */}
          <div className="lg:col-span-2 space-y-6">
            {/* Parametri principali */}
            <Card>
              <CardHeader>
                <CardTitle>Parametri dell'Opzione</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Strike e Scadenza */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <Label htmlFor="days">Giorni alla Scadenza</Label>
                    <Input
                      id="days"
                      type="number"
                      value={daysToExpiry}
                      onChange={(e) => setDaysToExpiry(Number(e.target.value))}
                      step={7}
                      min={0}
                      max={maxDaysToExpiry}
                      className="font-mono"
                    />
                  </div>
                </div>

                {/* Tasso risk-free */}
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

            {/* Slider interattivi */}
            <Card>
              <CardHeader>
                <CardTitle>Controlli Dinamici</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Slider Prezzo Sottostante */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Prezzo Sottostante</Label>
                    <span className="font-mono text-lg font-semibold text-foreground">
                      €{spotPrice.toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    value={[spotPrice]}
                    onValueChange={(val) => setSpotPrice(val[0])}
                    min={0}
                    max={initialSpotPrice * 5}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-foreground/60">
                    <span>€0</span>
                    <span>€{(initialSpotPrice * 5).toFixed(0)}</span>
                  </div>
                </div>

                {/* Slider Tempo */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Tempo Rimanente</Label>
                    <span className="font-mono text-lg font-semibold text-foreground">
                      {daysToExpiry} giorni
                    </span>
                  </div>
                  <Slider
                    value={[daysToExpiry]}
                    onValueChange={(val) => setDaysToExpiry(val[0])}
                    min={0}
                    max={maxDaysToExpiry}
                    step={7}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-foreground/60">
                    <span>Oggi</span>
                    <span>1 anno</span>
                  </div>
                </div>

                {/* Slider Volatilità */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label>Aggiustamento Volatilità</Label>
                    <span className="font-mono text-lg font-semibold text-foreground">
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
                    <span className="font-medium">
                      Base: {(initialVolatility * 100).toFixed(0)}%
                    </span>
                    <span>+100%</span>
                  </div>
                  <div className="text-center text-sm text-foreground/70 mt-1">
                    Volatilità effettiva: {(effectiveVolatility * 100).toFixed(1)}%
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Barre di visualizzazione */}
            <Card>
              <CardHeader>
                <CardTitle>Composizione del Valore</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Call Option */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    Call Option
                  </h3>
                  <ValueBar
                    label="Valore Intrinseco"
                    value={callResult.intrinsicValue}
                    maxValue={maxValue}
                    color="#10b981"
                  />
                  <ValueBar
                    label="Valore Estrinseco (Time Value)"
                    value={callResult.extrinsicValue}
                    maxValue={maxValue}
                    color="#34d399"
                  />
                  <ValueBar
                    label="Valore Totale (Premio)"
                    value={callResult.price}
                    maxValue={maxValue}
                    color="#059669"
                  />
                </div>

                {/* Put Option */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    Put Option
                  </h3>
                  <ValueBar
                    label="Valore Intrinseco"
                    value={putResult.intrinsicValue}
                    maxValue={maxValue}
                    color="#ef4444"
                  />
                  <ValueBar
                    label="Valore Estrinseco (Time Value)"
                    value={putResult.extrinsicValue}
                    maxValue={maxValue}
                    color="#f87171"
                  />
                  <ValueBar
                    label="Valore Totale (Premio)"
                    value={putResult.price}
                    maxValue={maxValue}
                    color="#dc2626"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pannello Greche - destra */}
          <div className="lg:col-span-1">
            <GreeksPanel callResult={callResult} putResult={putResult} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-background/50 mt-12">
        <div className="container py-6 text-center text-sm text-foreground/60">
          <p>Modello Black-Scholes per opzioni europee</p>
          <p className="mt-1">Sviluppato con React e TypeScript</p>
        </div>
      </footer>
    </div>
  );
}

