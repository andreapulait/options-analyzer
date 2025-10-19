/**
 * Black-Scholes Option Pricing Model
 * Calcola il prezzo teorico delle opzioni europee e le relative Greche
 */

/**
 * Funzione di distribuzione cumulativa normale standard
 */
function normCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

/**
 * Funzione di densità di probabilità normale standard
 */
function normPDF(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export interface OptionInputs {
  S: number;      // Prezzo corrente del sottostante
  K: number;      // Strike price
  T: number;      // Tempo alla scadenza (in anni)
  r: number;      // Tasso risk-free (in decimale, es. 0.03 per 3%)
  sigma: number;  // Volatilità implicita (in decimale, es. 0.25 per 25%)
}

export interface OptionResult {
  price: number;           // Prezzo totale dell'opzione (premio)
  intrinsicValue: number;  // Valore intrinseco
  extrinsicValue: number;  // Valore estrinseco (time value)
  delta: number;           // Delta
  gamma: number;           // Gamma
  theta: number;           // Theta (per giorno)
  vega: number;            // Vega (per 1% di variazione di volatilità)
  rho: number;             // Rho (per 1% di variazione del tasso)
}

/**
 * Calcola d1 per il modello Black-Scholes
 */
function calculateD1(S: number, K: number, T: number, r: number, sigma: number): number {
  if (T <= 0 || sigma <= 0) return 0;
  return (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
}

/**
 * Calcola d2 per il modello Black-Scholes
 */
function calculateD2(d1: number, sigma: number, T: number): number {
  if (T <= 0) return 0;
  return d1 - sigma * Math.sqrt(T);
}

/**
 * Calcola il prezzo e le Greche per una Call Option
 */
export function calculateCall(inputs: OptionInputs): OptionResult {
  const { S, K, T, r, sigma } = inputs;

  // Caso particolare: scadenza raggiunta
  if (T <= 0) {
    const intrinsicValue = Math.max(S - K, 0);
    return {
      price: intrinsicValue,
      intrinsicValue,
      extrinsicValue: 0,
      delta: S > K ? 1 : 0,
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0,
    };
  }

  // Caso particolare: volatilità zero
  if (sigma <= 0) {
    const intrinsicValue = Math.max(S - K, 0);
    const futureValue = Math.max(S - K * Math.exp(-r * T), 0);
    return {
      price: futureValue,
      intrinsicValue,
      extrinsicValue: futureValue - intrinsicValue,
      delta: S > K ? 1 : 0,
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: T * K * Math.exp(-r * T) * (S > K ? 1 : 0),
    };
  }

  const d1 = calculateD1(S, K, T, r, sigma);
  const d2 = calculateD2(d1, sigma, T);

  const Nd1 = normCDF(d1);
  const Nd2 = normCDF(d2);
  const nd1 = normPDF(d1);

  // Prezzo della Call
  const price = S * Nd1 - K * Math.exp(-r * T) * Nd2;

  // Valore intrinseco
  const intrinsicValue = Math.max(S - K, 0);

  // Valore estrinseco
  const extrinsicValue = price - intrinsicValue;

  // Greche
  const delta = Nd1;
  const gamma = nd1 / (S * sigma * Math.sqrt(T));
  const theta = (-(S * nd1 * sigma) / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * Nd2) / 365; // Per giorno
  const vega = (S * nd1 * Math.sqrt(T)) / 100; // Per 1% di variazione
  const rho = (K * T * Math.exp(-r * T) * Nd2) / 100; // Per 1% di variazione

  return {
    price: Math.max(price, 0),
    intrinsicValue,
    extrinsicValue: Math.max(extrinsicValue, 0),
    delta,
    gamma,
    theta,
    vega,
    rho,
  };
}

/**
 * Calcola il prezzo e le Greche per una Put Option
 */
export function calculatePut(inputs: OptionInputs): OptionResult {
  const { S, K, T, r, sigma } = inputs;

  // Caso particolare: scadenza raggiunta
  if (T <= 0) {
    const intrinsicValue = Math.max(K - S, 0);
    return {
      price: intrinsicValue,
      intrinsicValue,
      extrinsicValue: 0,
      delta: S < K ? -1 : 0,
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: 0,
    };
  }

  // Caso particolare: volatilità zero
  if (sigma <= 0) {
    const intrinsicValue = Math.max(K - S, 0);
    const futureValue = Math.max(K * Math.exp(-r * T) - S, 0);
    return {
      price: futureValue,
      intrinsicValue,
      extrinsicValue: futureValue - intrinsicValue,
      delta: S < K ? -1 : 0,
      gamma: 0,
      theta: 0,
      vega: 0,
      rho: -T * K * Math.exp(-r * T) * (S < K ? 1 : 0),
    };
  }

  const d1 = calculateD1(S, K, T, r, sigma);
  const d2 = calculateD2(d1, sigma, T);

  const Nd1 = normCDF(-d1);
  const Nd2 = normCDF(-d2);
  const nd1 = normPDF(d1);

  // Prezzo della Put
  const price = K * Math.exp(-r * T) * Nd2 - S * Nd1;

  // Valore intrinseco
  const intrinsicValue = Math.max(K - S, 0);

  // Valore estrinseco
  const extrinsicValue = price - intrinsicValue;

  // Greche
  const delta = -Nd1;
  const gamma = nd1 / (S * sigma * Math.sqrt(T));
  const theta = (-(S * nd1 * sigma) / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * Nd2) / 365; // Per giorno
  const vega = (S * nd1 * Math.sqrt(T)) / 100; // Per 1% di variazione
  const rho = -(K * T * Math.exp(-r * T) * Nd2) / 100; // Per 1% di variazione

  return {
    price: Math.max(price, 0),
    intrinsicValue,
    extrinsicValue: Math.max(extrinsicValue, 0),
    delta,
    gamma,
    theta,
    vega,
    rho,
  };
}

