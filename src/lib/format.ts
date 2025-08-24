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
  // Convert to BigInt if it's a string
  const amount = typeof rawAmount === 'string' ? BigInt(rawAmount) : rawAmount;
  
  // If the amount is 0, return "0"
  if (amount === 0n) {
    return "0";
  }
  
  // Handle negative amounts
  const isNegative = amount < 0n;
  const absAmount = isNegative ? -amount : amount;
  
  // Calculate the divisor
  const divisor = 10n ** BigInt(decimals);
  const integerPart = absAmount / divisor;
  const decimalPart = absAmount % divisor;
  
  // Format the integer part
  let result = integerPart.toString();
  
  // Format the decimal part if it exists
  if (decimalPart !== 0n) {
    let decimalStr = decimalPart.toString();
    // Pad with leading zeros to ensure we have `decimals` digits
    decimalStr = decimalStr.padStart(decimals, '0');
    // Remove trailing zeros
    decimalStr = decimalStr.replace(/0+$/, '');
    result += '.' + decimalStr;
  }
  
  // Add the negative sign if needed
  if (isNegative) {
    result = '-' + result;
  }
  
  return result;
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
  
  // Check if negative
  const isNegative = humanReadableAmount.startsWith('-');
  const numericStr = isNegative ? humanReadableAmount.substring(1) : humanReadableAmount;
  
  // Split the number at the decimal point.
  const parts = numericStr.split('.');
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
  
  let result = BigInt(combinedStr);
  if (isNegative) {
    result = -result;
  }
  
  return result;
};

// Token decimals constants
export const ETH_DECIMALS = 18;
export const USDT_DECIMALS = 6;
export const PRICE_DECIMALS = 8;


/**
 * Calculates the required collateral based on position size, current price, and leverage
 * @param positionSizeETH Position size in ETH (human-readable)
 * @param currentPrice Current ETH price in USDT (human-readable)
 * @param leverage Leverage amount (e.g., 10 for 10x)
 * @returns Collateral amount in USDT (on-chain value)
 */
export const calculateRequiredCollateral = (
  positionSizeETH: string,
  currentPrice: string,
  leverage: number
): bigint => {
  const positionSize = parseFloat(positionSizeETH);
  const price = parseFloat(currentPrice);
  if (isNaN(positionSize) || isNaN(price) || leverage === 0) {
    return 0n;
  }
  
  // Calculate collateral in USDT (human-readable)
  const collateralUSDT = (positionSize * price) / leverage;
  
  // Convert to on-chain value with USDT decimals
  return parseTokenAmount(collateralUSDT.toFixed(USDT_DECIMALS), USDT_DECIMALS);
};

/**
 * Formats a signed token amount (like PnL) for display
 * @param rawAmount The on-chain amount (can be negative)
 * @param decimals The number of decimals for the token
 * @returns Formatted string with sign
 */
export const formatSignedTokenAmount = (rawAmount: bigint | string, decimals: number): string => {
  const amount = BigInt(rawAmount);
  const sign = amount < 0n ? '-' : '';
  const absAmount = amount < 0n ? -amount : amount;
  return sign + formatTokenAmount(absAmount, decimals);
};