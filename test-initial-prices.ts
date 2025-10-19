import { calculateCall, calculatePut, type OptionInputs } from './client/src/lib/blackScholes';

const initialSpotPrice = 100;
const initialStrike = 100;
const initialRiskFreeRate = 0.03;
const initialIV = 0.25;
const timeToExpiry = 60 / 365;

const inputs: OptionInputs = {
  S: initialSpotPrice,
  K: initialStrike,
  T: timeToExpiry,
  r: initialRiskFreeRate,
  sigma: initialIV,
};

const callResult = calculateCall(inputs);
const putResult = calculatePut(inputs);

console.log('Call price:', callResult.price);
console.log('Put price:', putResult.price);
console.log('Call price (2 decimals):', Number(callResult.price.toFixed(2)));
console.log('Put price (2 decimals):', Number(putResult.price.toFixed(2)));
