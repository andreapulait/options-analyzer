import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card } from '@/components/ui/card';
import type { OptionLeg } from '@/types/strategy';
import { calculateCall, calculatePut } from '@/lib/blackScholes';

interface PayoffChartProps {
  legs: OptionLeg[];
  currentPrice: number;
  daysElapsed: number;
  volChange: number;
}

export function PayoffChart({ legs, currentPrice, daysElapsed, volChange }: PayoffChartProps) {
  // Genera dati per il grafico
  const chartData = useMemo(() => {
    if (legs.length === 0) return [];

    // Determina il range di prezzi da visualizzare
    const strikes = legs.map(leg => leg.strike);
    const minStrike = Math.min(...strikes);
    const maxStrike = Math.max(...strikes);
    const range = maxStrike - minStrike || 50;
    const minPrice = Math.max(0, minStrike - range);
    const maxPrice = maxStrike + range;
    const step = (maxPrice - minPrice) / 100;

    const data = [];
    for (let price = minPrice; price <= maxPrice; price += step) {
      const point: any = { price: price };

      // Calcola P&L per ogni leg
      let totalPnL = 0;
      legs.forEach((leg, index) => {
        // Calcola giorni alla scadenza dalla data di expiration
        const expirationDate = new Date(leg.expiration);
        const today = new Date();
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

        const legPnL = leg.position === 'long' 
          ? (optionPrice - leg.premium) * leg.quantity
          : (leg.premium - optionPrice) * leg.quantity;

        point[`leg${index}`] = legPnL;
        totalPnL += legPnL;
      });

      point.total = totalPnL;
      data.push(point);
    }

    return data;
  }, [legs, daysElapsed, volChange]);

  // Calcola break-even points
  const breakEvenPoints = useMemo(() => {
    const points: number[] = [];
    for (let i = 1; i < chartData.length; i++) {
      const prev = chartData[i - 1];
      const curr = chartData[i];
      if ((prev.total <= 0 && curr.total >= 0) || (prev.total >= 0 && curr.total <= 0)) {
        // Interpolazione lineare per trovare il punto esatto
        const ratio = Math.abs(prev.total) / (Math.abs(prev.total) + Math.abs(curr.total));
        const breakEven = prev.price + (curr.price - prev.price) * ratio;
        points.push(breakEven);
      }
    }
    return points;
  }, [chartData]);

  // Calcola max profit e max loss
  const { maxProfit, maxLoss } = useMemo(() => {
    if (chartData.length === 0) return { maxProfit: 0, maxLoss: 0 };
    const profits = chartData.map(d => d.total);
    return {
      maxProfit: Math.max(...profits),
      maxLoss: Math.min(...profits)
    };
  }, [chartData]);

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
            
            {/* Linea prezzo corrente */}
            <ReferenceLine 
              x={currentPrice} 
              stroke="#fbbf24" 
              strokeDasharray="5 5"
              label={{ value: 'Prezzo Corrente', fill: '#fbbf24', position: 'top' }}
            />

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
                strokeOpacity={0.5}
              />
            ))}

            {/* Linea totale */}
            <Line
              type="monotone"
              dataKey="total"
              name="Totale Strategia"
              stroke="#10b981"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

