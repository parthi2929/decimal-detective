import { MathProblem } from '../types';

export const generateProblem = (): MathProblem => {
  const decimalFirst = true; // Always put decimal first for consistent UI flow (e.g. 3.9 x 5)
  
  // Generate a friendly decimal number: 1.1 to 9.9 or 0.1 to 0.9
  // We want to create scenarios like 3.9 (becomes 39)
  let floatVal = Number((Math.random() * 9.8 + 0.1).toFixed(1));
  
  // Generate a friendly integer: 2 to 9 (single digit)
  // This makes the column multiplication visualization much cleaner for this age group
  let intVal = Math.floor(Math.random() * 8) + 2; // 2 to 9

  return {
    num1: floatVal,
    num2: intVal,
    id: Date.now().toString(),
  };
};

export const countDecimalPlaces = (num: number): number => {
  if (Math.floor(num) === num) return 0;
  const str = num.toString();
  if (str.indexOf('.') === -1) return 0;
  return str.split(".")[1].length;
};

export const removeDecimals = (num: number): number => {
  const decimals = countDecimalPlaces(num);
  return Math.round(num * Math.pow(10, decimals));
};