/**
 * @fileoverview Utility functions for handling token decimal conversions.
 */

/**
 * Formats a raw, on-chain token amount (a large integer) into a human-readable string.
 * This is used for displaying balances on the front end.
 * @param {BigInt | string} rawAmount The on-chain amount, typically a BigInt.
 * @param {number} decimals The number of decimals for the token (e.g., 6 for USDC/USDT).
 * @returns {string} The formatted, human-readable amount.
 */
export const formatTokenAmount = (rawAmount: bigint | string, decimals: number): string => {
  // Ensure the input is a string to handle BigInts correctly.
  let amountStr = String(rawAmount);

  // Handle the case where the amount is smaller than the number of decimals
  if (amountStr.length <= decimals) {
    amountStr = amountStr.padStart(decimals + 1, '0');
  }
  
  // Split the string into the integer and decimal parts.
  const integerPart = amountStr.slice(0, amountStr.length - decimals);
  const decimalPart = amountStr.slice(amountStr.length - decimals);

  // Return the formatted string, removing trailing zeros from the decimal part for cleaner display.
  const trimmedDecimalPart = decimalPart.replace(/0+$/, '');
  
  if (trimmedDecimalPart.length === 0) {
    return integerPart;
  }

  return `${integerPart}.${trimmedDecimalPart}`;
};

/**
 * Parses a human-readable amount (a string) into a raw, on-chain integer.
 * This is used for preparing transaction data to be sent to a smart contract.
 * @param {string} humanReadableAmount The user-entered amount, e.g., "1.5" or "1000".
 * @param {number} decimals The number of decimals for the token.
 * @returns {BigInt} The on-chain BigInt value.
 */
export const parseTokenAmount = (humanReadableAmount: string, decimals: number): bigint => {
  if (!humanReadableAmount || isNaN(parseFloat(humanReadableAmount))) {
    throw new Error('Invalid number format.');
  }

  // Split the number at the decimal point.
  const parts = humanReadableAmount.split('.');
  const integerPart = parts[0] || '0';
  let decimalPart = parts[1] || '';

  // Ensure the decimal part is not longer than the allowed decimals.
  if (decimalPart.length > decimals) {
    decimalPart = decimalPart.substring(0, decimals);
  }

  // Pad the decimal part with zeros to match the token's precision.
  decimalPart = decimalPart.padEnd(decimals, '0');

  // Concatenate parts and create a BigInt.
  const combinedStr = integerPart + decimalPart;
  
  return BigInt(combinedStr);
};
