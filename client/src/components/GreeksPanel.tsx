import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { OptionResult } from '@/lib/blackScholes';

interface GreeksPanelProps {
  callResult: OptionResult;
  putResult: OptionResult;
}

interface GreekDisplay {
  name: string;
  symbol: string;
  callValue: number;
  putValue: number;
  description: string;
  format: (val: number) => string;
}

export default function GreeksPanel({ callResult, putResult }: GreeksPanelProps) {
  const greeks: GreekDisplay[] = [
    {
      name: 'Delta',
      symbol: 'Δ',
      callValue: callResult.delta,
      putValue: putResult.delta,
      description: 'Variazione del prezzo per 1€ di movimento del sottostante',
      format: (val) => val.toFixed(4),
    },
    {
      name: 'Gamma',
      symbol: 'Γ',
      callValue: callResult.gamma,
      putValue: putResult.gamma,
      description: 'Variazione del Delta per 1€ di movimento del sottostante',
      format: (val) => val.toFixed(4),
    },
    {
      name: 'Theta',
      symbol: 'Θ',
      callValue: callResult.theta,
      putValue: putResult.theta,
      description: 'Decadimento temporale giornaliero',
      format: (val) => val.toFixed(4),
    },
    {
      name: 'Vega',
      symbol: 'ν',
      callValue: callResult.vega,
      putValue: putResult.vega,
      description: 'Variazione del prezzo per 1% di variazione della volatilità',
      format: (val) => val.toFixed(4),
    },
    {
      name: 'Rho',
      symbol: 'ρ',
      callValue: callResult.rho,
      putValue: putResult.rho,
      description: 'Variazione del prezzo per 1% di variazione del tasso risk-free',
      format: (val) => val.toFixed(4),
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Greche delle Opzioni</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {greeks.map((greek) => (
          <div key={greek.name} className="space-y-2 pb-4 border-b border-border last:border-0 last:pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-light text-foreground/60">{greek.symbol}</span>
                <span className="font-semibold text-foreground">{greek.name}</span>
              </div>
            </div>
            <p className="text-xs text-foreground/60">{greek.description}</p>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="space-y-1">
                <div className="text-xs font-medium text-green-600 dark:text-green-400">Call</div>
                <div className="font-mono text-sm font-semibold text-foreground">
                  {greek.format(greek.callValue)}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs font-medium text-red-600 dark:text-red-400">Put</div>
                <div className="font-mono text-sm font-semibold text-foreground">
                  {greek.format(greek.putValue)}
                </div>
              </div>
            </div>
            {/* Barra visiva per confronto */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="h-2 bg-green-500/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{
                    width: `${Math.min(Math.abs(greek.callValue) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="h-2 bg-red-500/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{
                    width: `${Math.min(Math.abs(greek.putValue) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

