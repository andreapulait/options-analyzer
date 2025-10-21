import React, { createContext, useContext, useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { Strategy, OptionLeg, StrategyPnL, StrategyGreeks } from '../types/strategy';
import { calculateCall, calculatePut } from '../lib/blackScholes';

interface StrategyContextType {
  strategy: Strategy;
  setStrategy: (strategy: Strategy) => void;
  addLeg: (leg: Omit<OptionLeg, 'id'>) => void;
  removeLeg: (legId: string) => void;
  updateLeg: (legId: string, updates: Partial<OptionLeg>) => void;
  calculateStrategyPnL: (currentPrice: number, daysElapsed: number, volChange: number) => StrategyPnL;
  calculateStrategyGreeks: (currentPrice: number, daysElapsed: number, volChange: number) => StrategyGreeks;
  resetStrategy: () => void;
}

const StrategyContext = createContext<StrategyContextType | undefined>(undefined);

const DEFAULT_STRATEGY: Strategy = {
  id: nanoid(),
  name: 'Custom Strategy',
  legs: [],
  underlyingPrice: 100,
  underlyingSymbol: 'AAPL'
};

export function StrategyProvider({ children }: { children: React.ReactNode }) {
  const [strategy, setStrategy] = useState<Strategy>(DEFAULT_STRATEGY);

  const addLeg = useCallback((leg: Omit<OptionLeg, 'id'>) => {
    setStrategy(prev => ({
      ...prev,
      legs: [...prev.legs, { ...leg, id: nanoid() }]
    }));
  }, []);

  const removeLeg = useCallback((legId: string) => {
    setStrategy(prev => ({
      ...prev,
      legs: prev.legs.filter(leg => leg.id !== legId)
    }));
  }, []);

  const updateLeg = useCallback((legId: string, updates: Partial<OptionLeg>) => {
    setStrategy(prev => ({
      ...prev,
      legs: prev.legs.map(leg =>
        leg.id === legId ? { ...leg, ...updates } : leg
      )
    }));
  }, []);

  const calculateStrategyPnL = useCallback((
    currentPrice: number,
    daysElapsed: number,
    volChange: number
  ): StrategyPnL => {
    const legsPnL = strategy.legs.map(leg => {
      const timeToExpiry = Math.max(0, (new Date(leg.expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24) - daysElapsed) / 365;
      const adjustedVol = leg.iv + volChange;
      
      const currentValue = leg.type === 'call'
        ? calculateCall({
            S: currentPrice,
            K: leg.strike,
            T: timeToExpiry,
            r: 0.03,
            sigma: adjustedVol
          }).price
        : calculatePut({
            S: currentPrice,
            K: leg.strike,
            T: timeToExpiry,
            r: 0.03,
            sigma: adjustedVol
          }).price;

      const multiplier = leg.position === 'long' ? 1 : -1;
      const pnl = multiplier * (currentValue - leg.premium) * leg.quantity;
      const pnlPercent = leg.premium > 0 ? (pnl / (leg.premium * leg.quantity)) * 100 : 0;

      return {
        legId: leg.id,
        pnl,
        pnlPercent
      };
    });

    const totalPnL = legsPnL.reduce((sum, leg) => sum + leg.pnl, 0);
    const totalCost = strategy.legs.reduce((sum, leg) => {
      const multiplier = leg.position === 'long' ? 1 : -1;
      return sum + multiplier * leg.premium * leg.quantity;
    }, 0);
    const totalPnLPercent = totalCost !== 0 ? (totalPnL / Math.abs(totalCost)) * 100 : 0;

    // Calcolo breakeven points (semplificato - da migliorare)
    const breakEvenPoints: number[] = [];
    
    return {
      totalPnL,
      totalPnLPercent,
      maxProfit: null, // Da implementare
      maxLoss: null, // Da implementare
      breakEvenPoints,
      legsPnL
    };
  }, [strategy]);

  const calculateStrategyGreeks = useCallback((currentPrice: number, daysElapsed: number, volChange: number): StrategyGreeks => {
    let totalDelta = 0;
    let totalGamma = 0;
    let totalTheta = 0;
    let totalVega = 0;
    let totalRho = 0;

    strategy.legs.forEach(leg => {
      const timeToExpiry = Math.max(0, 
        (new Date(leg.expiration).getTime() - Date.now()) / (1000 * 60 * 60 * 24) - daysElapsed
      ) / 365;
      const adjustedVol = leg.iv + volChange;
      
      const result = leg.type === 'call'
        ? calculateCall({ S: currentPrice, K: leg.strike, T: timeToExpiry, r: 0.03, sigma: adjustedVol })
        : calculatePut({ S: currentPrice, K: leg.strike, T: timeToExpiry, r: 0.03, sigma: adjustedVol });

      const multiplier = (leg.position === 'long' ? 1 : -1) * leg.quantity;
      
      totalDelta += result.delta * multiplier;
      totalGamma += result.gamma * multiplier;
      totalTheta += result.theta * multiplier;
      totalVega += result.vega * multiplier;
      totalRho += result.rho * multiplier;
    });

    return { delta: totalDelta, gamma: totalGamma, theta: totalTheta, vega: totalVega, rho: totalRho };
  }, [strategy]);

  const resetStrategy = useCallback(() => {
    setStrategy(DEFAULT_STRATEGY);
  }, []);

  return (
    <StrategyContext.Provider
      value={{
        strategy,
        setStrategy,
        addLeg,
        removeLeg,
        updateLeg,
        calculateStrategyPnL,
        calculateStrategyGreeks,
        resetStrategy
      }}
    >
      {children}
    </StrategyContext.Provider>
  );
}

export function useStrategy() {
  const context = useContext(StrategyContext);
  if (!context) {
    throw new Error('useStrategy must be used within StrategyProvider');
  }
  return context;
}

