import { useMemo, useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut } from 'lucide-react';
import type { OptionLeg } from '@/types/strategy';
import { calculateCall, calculatePut } from '@/lib/blackScholes';

interface PayoffChartProps {
  legs: OptionLeg[];
  currentPrice: number;
  daysElapsed: number;
  volChange: number;
  multiplier: number;
  onStatsCalculated?: (stats: { maxProfit: number; maxLoss: number; breakEvenPoints: number[] }) => void;
}

export function PayoffChart({ legs, currentPrice, daysElapsed, volChange, multiplier, onStatsCalculated }: PayoffChartProps) {
  const [zoomLevel, setZoomLevel] = useState(100); // 100 = default, 50 = zoom in 2x, 200 = zoom out 2x

  // Funzioni per gestire lo zoom
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.max(20, prev - 20)); // Min 20% (zoom in massimo)
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.min(300, prev + 20)); // Max 300% (zoom out massimo)
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  // Genera dati per il grafico
  const chartData = useMemo(() => {
    if (legs.length === 0) return [];

    // Trova la scadenza più vicina per il calcolo "a scadenza"
    const today = new Date();
    const expirationDates = legs.map(leg => new Date(leg.expiration).getTime());
    const nearestExpiration = Math.min(...expirationDates);
    const nearestExpirationDays = Math.max(0, Math.floor((nearestExpiration - today.getTime()) / (1000 * 60 * 60 * 24)));

    // Determina il range di prezzi da visualizzare con zoom
    const strikes = legs.map(leg => leg.strike);
    const minStrike = Math.min(...strikes);
    const maxStrike = Math.max(...strikes);
    const baseRange = maxStrike - minStrike || 50;
    const zoomFactor = zoomLevel / 100;
    const range = baseRange * zoomFactor;
    const centerPrice = currentPrice; // Centra sul prezzo corrente
    const minPrice = Math.max(0, centerPrice - range);
    const maxPrice = centerPrice + range;
    const step = (maxPrice - minPrice) / 100;

    const data = [];
    for (let price = minPrice; price <= maxPrice; price += step) {
      const point: any = { price: price };

      // Calcola P&L per ogni leg (corrente e a scadenza)
      let totalPnL = 0;
      let totalPnLAtExpiry = 0;
      legs.forEach((leg, index) => {
        // Calcola giorni alla scadenza dalla data di expiration
        const expirationDate = new Date(leg.expiration);
        const daysToExpiry = Math.max(0, Math.floor((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
        const timeToExpiry = Math.max(0, (daysToExpiry - daysElapsed) / 365);
        const iv = leg.iv + volChange / 100;

        let optionPrice = 0;
        if (leg.type === 'call') {
          const result = calculateCall({
            S: price,
            K: leg.strike,
            T: Math.max(0, timeToExpiry),
            sigma: Math.max(0.01, iv),
            r: 0.03
          });
          optionPrice = result.price;
        } else {
          const result = calculatePut({
            S: price,
            K: leg.strike,
            T: Math.max(0, timeToExpiry),
            sigma: Math.max(0.01, iv),
            r: 0.03
          });
          optionPrice = result.price;
        }

        const legPnL = (leg.position === 'long' 
          ? (optionPrice - leg.premium) * leg.quantity
          : (leg.premium - optionPrice) * leg.quantity) * multiplier;

        // Calcola P&L "a scadenza" della prima opzione
        // Se questo leg scade alla stessa data della scadenza più vicina, usa valore intrinseco
        // Altrimenti, calcola il valore con il tempo residuo
        let optionPriceAtNearestExpiry = 0;
        const isNearestExpiry = Math.abs(expirationDate.getTime() - nearestExpiration) < 24 * 60 * 60 * 1000; // Tolleranza 1 giorno
        
        if (isNearestExpiry) {
          // Questa opzione scade: usa solo valore intrinseco
          if (leg.type === 'call') {
            optionPriceAtNearestExpiry = Math.max(0, price - leg.strike);
          } else {
            optionPriceAtNearestExpiry = Math.max(0, leg.strike - price);
          }
        } else {
          // Questa opzione ha ancora tempo: calcola valore con tempo residuo
          const remainingDays = daysToExpiry - nearestExpirationDays;
          const remainingTime = Math.max(0, remainingDays / 365);
          
          if (leg.type === 'call') {
            const result = calculateCall({
              S: price,
              K: leg.strike,
              T: remainingTime,
              sigma: Math.max(0.01, leg.iv), // Usa IV originale senza volChange
              r: 0.03
            });
            optionPriceAtNearestExpiry = result.price;
          } else {
            const result = calculatePut({
              S: price,
              K: leg.strike,
              T: remainingTime,
              sigma: Math.max(0.01, leg.iv), // Usa IV originale senza volChange
              r: 0.03
            });
            optionPriceAtNearestExpiry = result.price;
          }
        }
        
        const legPnLAtExpiry = (leg.position === 'long'
          ? (optionPriceAtNearestExpiry - leg.premium) * leg.quantity
          : (leg.premium - optionPriceAtNearestExpiry) * leg.quantity) * multiplier;

        point[`leg${index}`] = legPnL;
        totalPnL += legPnL;
        totalPnLAtExpiry += legPnLAtExpiry;
      });

      point.total = totalPnL;
      point.totalAtExpiry = totalPnLAtExpiry;
      data.push(point);
    }

    return data;
  }, [legs, daysElapsed, volChange, zoomLevel, currentPrice, multiplier]);

  // Calcola break-even points
  const breakEvenPoints = useMemo(() => {
    const points: number[] = [];
    let wasNegative = false;
    let wasPositive = false;
    
    for (let i = 0; i < chartData.length; i++) {
      const point = chartData[i];
      
      // Verifica che i valori siano validi
      if (!isFinite(point.total) || !isFinite(point.price)) {
        continue;
      }
      
      // Traccia se abbiamo visto valori positivi o negativi
      if (point.total > 0.01) wasPositive = true;
      if (point.total < -0.01) wasNegative = true;
      
      // Cerca attraversamenti dello zero solo se ci sono sia valori positivi che negativi
      if (i > 0 && wasPositive && wasNegative) {
        const prev = chartData[i - 1];
        
        // Verifica attraversamento dello zero con soglia più stretta
        if ((prev.total < -0.01 && point.total > 0.01) || (prev.total > 0.01 && point.total < -0.01)) {
          // Interpolazione lineare per trovare il punto esatto
          const denominator = Math.abs(prev.total) + Math.abs(point.total);
          
          if (denominator > 0.01) {
            const ratio = Math.abs(prev.total) / denominator;
            const breakEven = prev.price + (point.price - prev.price) * ratio;
            
            // Verifica che il break-even sia valido e non troppo vicino ad altri
            if (isFinite(breakEven)) {
              const isDuplicate = points.some(p => Math.abs(p - breakEven) < 0.5);
              if (!isDuplicate) {
                points.push(breakEven);
              }
            }
          }
        }
      }
    }
    
    return points;
  }, [chartData]);

  // Calcola max profit e max loss
  const { maxProfit, maxLoss } = useMemo(() => {
    if (chartData.length === 0) return { maxProfit: 0, maxLoss: 0 };
    
    // Filtra solo valori finiti
    const profits = chartData
      .map(d => d.total)
      .filter(p => isFinite(p));
    
    if (profits.length === 0) return { maxProfit: 0, maxLoss: 0 };
    
    const maxP = Math.max(...profits);
    const maxL = Math.min(...profits);
    
    return {
      maxProfit: isFinite(maxP) ? maxP : 0,
      maxLoss: isFinite(maxL) ? maxL : 0
    };
  }, [chartData]);

  // Notifica i valori calcolati al componente padre
  useEffect(() => {
    if (onStatsCalculated) {
      onStatsCalculated({ maxProfit, maxLoss, breakEvenPoints });
    }
  }, [maxProfit, maxLoss, breakEvenPoints, onStatsCalculated]);

  if (legs.length === 0) {
    return (
      <Card className="bg-slate-900 border-slate-800 p-6">
        <div className="text-center text-slate-400">
          <p>Aggiungi almeno un leg per visualizzare il grafico payoff</p>
        </div>
      </Card>
    );
  }

  const colors = ['#3b82f6', '#f97316', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <Card className="bg-slate-900 border-slate-800 p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Grafico Payoff</h3>
          <p className="text-sm text-slate-400">P&L vs Prezzo Sottostante</p>
        </div>

        {/* Controlli Zoom */}
        <div className="flex items-center justify-between bg-slate-800/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel <= 20}
              className="h-8 w-8 p-0"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel >= 300}
              className="h-8 w-8 p-0"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomReset}
              className="h-8 px-3 text-xs"
            >
              Reset
            </Button>
          </div>
          
          <div className="flex items-center gap-3 flex-1 ml-6">
            <span className="text-xs text-slate-400 whitespace-nowrap">Range:</span>
            <input
              type="range"
              min="20"
              max="300"
              step="10"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(Number(e.target.value))}
              className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((zoomLevel - 20) / 280) * 100}%, #475569 ${((zoomLevel - 20) / 280) * 100}%, #475569 100%)`
              }}
            />
            <span className="text-xs text-slate-300 font-mono whitespace-nowrap min-w-[60px] text-right">
              {zoomLevel}%
            </span>
          </div>
        </div>

        {/* Statistiche */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-400">Max Profit</p>
            <p className={`text-lg font-bold ${maxProfit > 0 ? 'text-green-400' : 'text-slate-400'}`}>
              {maxProfit === Infinity ? 'Illimitato' : `$${maxProfit.toFixed(2)}`}
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-400">Max Loss</p>
            <p className={`text-lg font-bold ${maxLoss < 0 ? 'text-red-400' : 'text-slate-400'}`}>
              {maxLoss === -Infinity ? 'Illimitato' : `$${maxLoss.toFixed(2)}`}
            </p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-400">Break-Even</p>
            <p className="text-lg font-bold text-blue-400">
              {breakEvenPoints.length > 0 ? `$${breakEvenPoints[0].toFixed(2)}` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Grafico */}
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="price" 
              stroke="#94a3b8"
              label={{ value: 'Prezzo Sottostante ($)', position: 'insideBottom', offset: -5, fill: '#94a3b8' }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <YAxis 
              stroke="#94a3b8"
              label={{ value: 'P&L ($)', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
              labelFormatter={(value) => `Prezzo: $${Number(value).toFixed(2)}`}
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
            />
            <Legend />
            
            {/* Linea zero */}
            <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" />

            {/* Linee break-even */}
            {breakEvenPoints.map((point, i) => (
              <ReferenceLine 
                key={i}
                x={point} 
                stroke="#3b82f6" 
                strokeDasharray="5 5"
                label={{ value: 'B/E', fill: '#3b82f6', position: 'top' }}
              />
            ))}

            {/* Linee per ogni leg */}
            {legs.map((leg, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey={`leg${index}`}
                name={`${leg.position === 'long' ? 'Long' : 'Short'} ${leg.type === 'call' ? 'Call' : 'Put'} $${leg.strike}`}
                stroke={colors[index % colors.length]}
                strokeWidth={1}
                dot={false}
                strokeOpacity={0.3}
              />
            ))}

            {/* Linea totale corrente */}
            <Line
              type="monotone"
              dataKey="total"
              name="Payoff Corrente"
              stroke="#10b981"
              strokeWidth={3}
              dot={false}
            />

            {/* Linea totale a scadenza */}
            <Line
              type="monotone"
              dataKey="totalAtExpiry"
              name="Payoff a Scadenza"
              stroke="#94a3b8"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            
            {/* Linea prezzo corrente - renderizzata per ultima per essere sempre visibile */}
            <ReferenceLine 
              x={currentPrice} 
              stroke="#fb923c" 
              strokeWidth={1}
              strokeDasharray="5 5"
              label={{ 
                value: `Corrente: $${currentPrice.toFixed(2)}`, 
                fill: '#fb923c', 
                position: 'top',
                style: { fontWeight: 'bold', fontSize: '12px' }
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

