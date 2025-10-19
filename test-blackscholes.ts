import { calculateCall, calculatePut, type OptionInputs } from './client/src/lib/blackScholes';

console.log('=== Test del Modello Black-Scholes ===\n');

// Test 1: Opzione At-The-Money (ATM)
console.log('Test 1: Opzione At-The-Money');
const atmInputs: OptionInputs = {
  S: 100,
  K: 100,
  T: 0.5, // 6 mesi
  r: 0.03,
  sigma: 0.25,
};

const atmCall = calculateCall(atmInputs);
const atmPut = calculatePut(atmInputs);

console.log('Call ATM:', {
  price: atmCall.price.toFixed(4),
  intrinsic: atmCall.intrinsicValue.toFixed(4),
  extrinsic: atmCall.extrinsicValue.toFixed(4),
  delta: atmCall.delta.toFixed(4),
});

console.log('Put ATM:', {
  price: atmPut.price.toFixed(4),
  intrinsic: atmPut.intrinsicValue.toFixed(4),
  extrinsic: atmPut.extrinsicValue.toFixed(4),
  delta: atmPut.delta.toFixed(4),
});

// Test 2: Opzione In-The-Money (ITM) - Call
console.log('\nTest 2: Call In-The-Money');
const itmCallInputs: OptionInputs = {
  S: 110,
  K: 100,
  T: 0.5,
  r: 0.03,
  sigma: 0.25,
};

const itmCall = calculateCall(itmCallInputs);
console.log('Call ITM:', {
  price: itmCall.price.toFixed(4),
  intrinsic: itmCall.intrinsicValue.toFixed(4),
  extrinsic: itmCall.extrinsicValue.toFixed(4),
  delta: itmCall.delta.toFixed(4),
});

// Test 3: Opzione Out-Of-The-Money (OTM) - Call
console.log('\nTest 3: Call Out-Of-The-Money');
const otmCallInputs: OptionInputs = {
  S: 90,
  K: 100,
  T: 0.5,
  r: 0.03,
  sigma: 0.25,
};

const otmCall = calculateCall(otmCallInputs);
console.log('Call OTM:', {
  price: otmCall.price.toFixed(4),
  intrinsic: otmCall.intrinsicValue.toFixed(4),
  extrinsic: otmCall.extrinsicValue.toFixed(4),
  delta: otmCall.delta.toFixed(4),
});

// Test 4: Opzione alla scadenza (T=0)
console.log('\nTest 4: Opzione alla scadenza (T=0)');
const expiryInputs: OptionInputs = {
  S: 110,
  K: 100,
  T: 0,
  r: 0.03,
  sigma: 0.25,
};

const expiryCall = calculateCall(expiryInputs);
const expiryPut = calculatePut(expiryInputs);

console.log('Call alla scadenza:', {
  price: expiryCall.price.toFixed(4),
  intrinsic: expiryCall.intrinsicValue.toFixed(4),
  extrinsic: expiryCall.extrinsicValue.toFixed(4),
});

console.log('Put alla scadenza:', {
  price: expiryPut.price.toFixed(4),
  intrinsic: expiryPut.intrinsicValue.toFixed(4),
  extrinsic: expiryPut.extrinsicValue.toFixed(4),
});

// Test 5: Put-Call Parity
console.log('\nTest 5: Put-Call Parity Verification');
console.log('Formula: C - P = S - K*e^(-rT)');
const parityInputs: OptionInputs = {
  S: 100,
  K: 100,
  T: 1,
  r: 0.05,
  sigma: 0.20,
};

const parityCall = calculateCall(parityInputs);
const parityPut = calculatePut(parityInputs);

const leftSide = parityCall.price - parityPut.price;
const rightSide = parityInputs.S - parityInputs.K * Math.exp(-parityInputs.r * parityInputs.T);

console.log('C - P =', leftSide.toFixed(4));
console.log('S - K*e^(-rT) =', rightSide.toFixed(4));
console.log('Differenza:', Math.abs(leftSide - rightSide).toFixed(6));
console.log('Parity OK:', Math.abs(leftSide - rightSide) < 0.01 ? '✓' : '✗');

// Test 6: Effetto della volatilità
console.log('\nTest 6: Effetto della Volatilità sul Vega');
const lowVolInputs: OptionInputs = { S: 100, K: 100, T: 0.5, r: 0.03, sigma: 0.15 };
const highVolInputs: OptionInputs = { S: 100, K: 100, T: 0.5, r: 0.03, sigma: 0.35 };

const lowVolCall = calculateCall(lowVolInputs);
const highVolCall = calculateCall(highVolInputs);

console.log('Call con volatilità 15%:', {
  price: lowVolCall.price.toFixed(4),
  vega: lowVolCall.vega.toFixed(4),
});

console.log('Call con volatilità 35%:', {
  price: highVolCall.price.toFixed(4),
  vega: highVolCall.vega.toFixed(4),
});

console.log('\n=== Test completati ===');

