import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { useStrategy } from '../contexts/StrategyContext';
import { PRESET_STRATEGIES } from '../lib/presetStrategies';
import { OptionLeg } from '../types/strategy';
import { nanoid } from 'nanoid';
import { PayoffChart } from '../components/PayoffChart';

export default function StrategyBuilder() {
  const { strategy, setStrategy, addLeg, removeLeg, updateLeg, calculateStrategyPnL, calculateStrategyGreeks } = useStrategy();
  const [currentPrice, setCurrentPrice] = useState(strategy.underlyingPrice);
  const [daysElapsed, setDaysElapsed] = useState(0);
  const [volChange, setVolChange] = useState(0);

  const pnl = calculateStrategyPnL(currentPrice, daysElapsed, volChange);
  const greeks = calculateStrategyGreeks(currentPrice, daysElapsed, volChange);

  const handleLoadPreset = (presetType: string) => {
    const preset = PRESET_STRATEGIES.find(s => s.type === presetType);
    if (!preset) return;

    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 60); // 60 giorni default

    const legs: OptionLeg[] = preset.legs.map(leg => ({
      id: nanoid(),
      ...leg,
      expiration: baseDate.toISOString(),
      premium: 5.0, // Default premium
      iv: 0.25 // Default IV 25%
    }));

    setStrategy({
      ...strategy,
      name: preset.name,
      legs
    });
  };

  const handleAddCustomLeg = () => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 60);

    addLeg({
      type: 'call',
      position: 'long',
      strike: strategy.underlyingPrice,
      premium: 5.0,
      quantity: 1,
      expiration: baseDate.toISOString(),
      iv: 0.25
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Strategy Builder</h1>
            <p className="text-slate-400">Costruisci e analizza strategie multi-leg</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Torna a Single Option
            </Button>
          </div>
        </div>

        {/* Preset Strategies */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg">Strategie Predefinite</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {PRESET_STRATEGIES.map(preset => (
                <Button
                  key={preset.type}
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoadPreset(preset.type)}
                  className="text-xs"
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Strategy Configuration */}
          <div className="lg:col-span-2 space-y-4">
            {/* Strategy Info */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{strategy.name}</CardTitle>
                  <Button size="sm" onClick={handleAddCustomLeg}>
                    <Plus className="w-4 h-4 mr-1" />
                    Aggiungi Leg
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Controlli Sottostante */}
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-600">
                  <div>
                    <Label className="text-xs text-slate-400">Simbolo Sottostante</Label>
                    <Input
                      type="text"
                      value={strategy.underlyingSymbol || ''}
                      onChange={(e) => setStrategy({ ...strategy, underlyingSymbol: e.target.value })}
                      placeholder="es. AAPL, SPY"
                      className="h-8 bg-slate-800 uppercase"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">Prezzo Sottostante ($)</Label>
                    <Input
                      type="number"
                      value={strategy.underlyingPrice}
                      onChange={(e) => {
                        const newPrice = Number(e.target.value);
                        setStrategy({ ...strategy, underlyingPrice: newPrice });
                        setCurrentPrice(newPrice);
                      }}
                      className="h-8 bg-slate-800"
                      step="0.01"
                    />
                  </div>
                </div>

                {strategy.legs.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p>Nessun leg presente</p>
                    <p className="text-sm">Seleziona una strategia predefinita o aggiungi un leg custom</p>
                  </div>
                ) : (
                  strategy.legs.map((leg, index) => (
                    <div key={leg.id} className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-2 items-center flex-wrap">
                          <Badge 
                            variant={leg.position === 'long' ? 'default' : 'destructive'}
                            className="cursor-pointer hover:opacity-80"
                            onClick={() => updateLeg(leg.id, { position: leg.position === 'long' ? 'short' : 'long' })}
                          >
                            {leg.position === 'long' ? 'Long' : 'Short'}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className="cursor-pointer hover:opacity-80"
                            onClick={() => updateLeg(leg.id, { type: leg.type === 'call' ? 'put' : 'call' })}
                          >
                            {leg.type === 'call' ? 'Call' : 'Put'}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Label className="text-xs text-slate-400">Strike:</Label>
                            <Input
                              type="number"
                              value={leg.strike}
                              onChange={(e) => updateLeg(leg.id, { strike: Number(e.target.value) })}
                              className="h-6 w-20 bg-slate-800 text-xs"
                              step="1"
                            />
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeLeg(leg.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <Label className="text-xs text-slate-400">Premio</Label>
                          <Input
                            type="number"
                            value={leg.premium}
                            onChange={(e) => updateLeg(leg.id, { premium: Number(e.target.value) })}
                            className="h-8 bg-slate-800"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-400">IV (%)</Label>
                          <Input
                            type="number"
                            value={(leg.iv * 100).toFixed(1)}
                            onChange={(e) => updateLeg(leg.id, { iv: Number(e.target.value) / 100 })}
                            className="h-8 bg-slate-800"
                            step="0.1"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-slate-400">Scadenza</Label>
                          <Input
                            type="date"
                            value={new Date(leg.expiration).toISOString().split('T')[0]}
                            onChange={(e) => {
                              const newDate = new Date(e.target.value);
                              newDate.setHours(23, 59, 59, 999);
                              updateLeg(leg.id, { expiration: newDate.toISOString() });
                            }}
                            className="h-8 bg-slate-800 text-xs"
                            min={new Date().toISOString().split('T')[0]}
                          />
                          <div className="text-xs text-slate-500 mt-0.5">
                            DTE: {Math.ceil((new Date(leg.expiration).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} gg
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-slate-400">Quantità</Label>
                          <Input
                            type="number"
                            value={leg.quantity}
                            onChange={(e) => updateLeg(leg.id, { quantity: Number(e.target.value) })}
                            className="h-8 bg-slate-800"
                            min="1"
                          />
                        </div>
                      </div>

                      {pnl.legsPnL[index] && (
                        <div className="flex justify-between text-sm pt-1 border-t border-slate-600">
                          <span className="text-slate-400">P&L Leg:</span>
                          <span className={pnl.legsPnL[index].pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {pnl.legsPnL[index].pnl >= 0 ? '+' : ''}
                            ${pnl.legsPnL[index].pnl.toFixed(2)} ({pnl.legsPnL[index].pnlPercent.toFixed(1)}%)
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Simulation Controls */}
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Controlli Simulazione</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-4">
                  {/* Slider Prezzo Sottostante */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-sm font-medium">Prezzo Sottostante</Label>
                      <span className="text-lg font-bold text-red-400">
                        {currentPrice.toFixed(2)}
                        <span className="text-sm ml-2">
                          ({((currentPrice - strategy.underlyingPrice) / strategy.underlyingPrice * 100).toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                    <Slider
                      value={[currentPrice]}
                      onValueChange={(value) => setCurrentPrice(value[0])}
                      min={strategy.underlyingPrice * 0.5}
                      max={strategy.underlyingPrice * 1.5}
                      step={0.01}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>{(strategy.underlyingPrice * 0.5).toFixed(0)}</span>
                      <span>{strategy.underlyingPrice.toFixed(0)}</span>
                      <span>{(strategy.underlyingPrice * 1.5).toFixed(0)}</span>
                    </div>
                  </div>

                  {/* Slider Tempo */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-sm font-medium">Tempo (DTE)</Label>
                      <span className="text-lg font-bold text-green-400">
                        {Math.max(0, 60 - daysElapsed)} giorni
                        <span className="text-sm ml-2">
                          ({((daysElapsed / 60) * 100).toFixed(0)}% trascorso)
                        </span>
                      </span>
                    </div>
                    <Slider
                      value={[daysElapsed]}
                      onValueChange={(value) => setDaysElapsed(value[0])}
                      min={0}
                      max={60}
                      step={1}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Inizio (60 DTE)</span>
                      <span>Scadenza (0 DTE)</span>
                    </div>
                  </div>

                  {/* Slider Volatilità */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <Label className="text-sm font-medium">Volatilità</Label>
                      <span className="text-lg font-bold text-blue-400">
                        {(volChange * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Slider
                      value={[volChange * 100]}
                      onValueChange={(value) => setVolChange(value[0] / 100)}
                      min={-50}
                      max={50}
                      step={1}
                      className="py-4"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>-50%</span>
                      <span>0%</span>
                      <span>+50%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: P&L Summary */}
          <div className="space-y-4">
            <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="text-sm text-white/70">P&L Totale Strategia</div>
                  <div className="text-4xl font-bold">
                    ${pnl.totalPnL.toFixed(2)}
                  </div>
                  <div className={`text-lg font-semibold flex items-center justify-center gap-1 ${pnl.totalPnL >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {pnl.totalPnL >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    {pnl.totalPnL >= 0 ? '+' : ''}{pnl.totalPnLPercent.toFixed(1)}%
                  </div>
                </div>
                <Separator className="my-4 bg-white/20" />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Numero Legs:</span>
                    <span className="font-semibold">{strategy.legs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Prezzo Corrente:</span>
                    <span className="font-semibold">${currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Prezzo Iniziale:</span>
                    <span className="font-semibold">${strategy.underlyingPrice.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Analisi Rischio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Profit:</span>
                  <span className="font-semibold">
                    {pnl.maxProfit === null ? 'Illimitato' : `$${pnl.maxProfit.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Loss:</span>
                  <span className="font-semibold text-red-400">
                    {pnl.maxLoss === null ? 'Illimitato' : `$${pnl.maxLoss.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Break-Even:</span>
                  <span className="font-semibold">
                    {pnl.breakEvenPoints.length === 0 ? 'N/A' : pnl.breakEvenPoints.map(p => `$${p.toFixed(2)}`).join(', ')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Pannello Greeks Strategia */}
            {strategy.legs.length > 0 && (
              <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-700/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span className="text-purple-400">⚡</span>
                    Greeks Strategia
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Delta (Δ)</span>
                    <span className={`font-semibold ${greeks.delta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {greeks.delta >= 0 ? '+' : ''}{greeks.delta.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Gamma (Γ)</span>
                    <span className="font-semibold text-blue-400">
                      {greeks.gamma.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Theta (Θ)</span>
                    <span className={`font-semibold ${greeks.theta >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {greeks.theta >= 0 ? '+' : ''}{greeks.theta.toFixed(2)}/giorno
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Vega (ν)</span>
                    <span className="font-semibold text-purple-400">
                      {greeks.vega >= 0 ? '+' : ''}{greeks.vega.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Rho (ρ)</span>
                    <span className="font-semibold text-gray-400">
                      {greeks.rho >= 0 ? '+' : ''}{greeks.rho.toFixed(3)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Grafico Payoff */}
        <PayoffChart 
          legs={strategy.legs}
          currentPrice={currentPrice}
          daysElapsed={daysElapsed}
          volChange={volChange}
        />
      </div>
    </div>
  );
}

