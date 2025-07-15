import 'server-only';
import { Listing } from '@/types/global.types';

/**
 * Configuration for EMA calculations
 */
const EMA_CONFIG = {
  alpha: 0.3, // Smoothing factor (0.1 = slow, 0.5 = fast)
  maxDaysOld: 60, // Exclude sales older than 60 days
  minSampleSize: 2, // Minimum sales needed for EMA
} as const;

/**
 * Sale data with computed time weight
 */
interface WeightedSale {
  price: number;
  timestamp: number;
  daysOld: number;
  timeWeight: number;
}

/**
 * EMA calculation result
 */
export interface EMAResult {
  value: number;
  confidence: 'high' | 'medium' | 'low';
  sampleSize: number;
  oldestSale: number; // Days
  newestSale: number; // Days
  method: 'ema' | 'weighted-average' | 'simple-average';
}

/**
 * Calculate time weight for a sale based on how recent it is
 */
function calculateTimeWeight(daysOld: number): number {
  // Exponential decay: weight = e^(-0.05 * days_old)
  // This gives ~60% weight to 10-day-old sales
  const lambda = 0.05;
  return Math.exp(-lambda * daysOld);
}

/**
 * Convert sales to weighted sales with time calculations
 */
function prepareWeightedSales(sales: Listing[]): WeightedSale[] {
  const now = Date.now();
  const maxAge = EMA_CONFIG.maxDaysOld * 24 * 60 * 60 * 1000; // Convert to milliseconds

  return sales
    .filter(sale => sale.purchaseDateTime && sale.price > 0)
    .map(sale => {
      const timestamp = sale.purchaseDateTime!;
      const ageMs = now - timestamp;
      const daysOld = ageMs / (24 * 60 * 60 * 1000);
      
      return {
        price: sale.price,
        timestamp,
        daysOld,
        timeWeight: calculateTimeWeight(daysOld),
      };
    })
    .filter(sale => sale.daysOld <= EMA_CONFIG.maxDaysOld) // Remove sales older than max age
    .sort((a, b) => a.timestamp - b.timestamp); // Sort oldest to newest for EMA calculation
}

/**
 * Calculate Exponential Moving Average from sales data
 */
export function calculateEMA(
  sales: Listing[],
  options: {
    alpha?: number;
    maxDaysOld?: number;
    minSampleSize?: number;
  } = {}
): EMAResult {
  const {
    alpha = EMA_CONFIG.alpha,
    maxDaysOld = EMA_CONFIG.maxDaysOld,
    minSampleSize = EMA_CONFIG.minSampleSize,
  } = options;

  const weightedSales = prepareWeightedSales(sales);

  if (weightedSales.length === 0) {
    return {
      value: 0,
      confidence: 'low',
      sampleSize: 0,
      oldestSale: 0,
      newestSale: 0,
      method: 'simple-average',
    };
  }

  if (weightedSales.length < minSampleSize) {
    // Fall back to simple average for very small samples
    const simpleAverage = weightedSales.reduce((sum, sale) => sum + sale.price, 0) / weightedSales.length;
    
    return {
      value: simpleAverage,
      confidence: 'low',
      sampleSize: weightedSales.length,
      oldestSale: Math.max(...weightedSales.map(s => s.daysOld)),
      newestSale: Math.min(...weightedSales.map(s => s.daysOld)),
      method: 'simple-average',
    };
  }

  // Calculate EMA or weighted average based on sample size
  let finalValue: number;
  let method: 'ema' | 'weighted-average';

  if (weightedSales.length >= 5) {
    // Use true EMA for larger samples
    finalValue = calculateTrueEMA(weightedSales, alpha);
    method = 'ema';
  } else {
    // Use weighted average for smaller samples
    finalValue = calculateTimeWeightedAverage(weightedSales);
    method = 'weighted-average';
  }

  // Determine confidence based on sample size and recency
  const confidence = determineConfidence(weightedSales);

  return {
    value: Math.round(finalValue),
    confidence,
    sampleSize: weightedSales.length,
    oldestSale: Math.max(...weightedSales.map(s => s.daysOld)),
    newestSale: Math.min(...weightedSales.map(s => s.daysOld)),
    method,
  };
}

/**
 * Calculate true Exponential Moving Average
 */
function calculateTrueEMA(weightedSales: WeightedSale[], alpha: number): number {
  if (weightedSales.length === 0) return 0;
  
  // Start with the first sale price
  let ema = weightedSales[0].price;
  
  // Apply EMA formula for each subsequent sale
  for (let i = 1; i < weightedSales.length; i++) {
    const currentPrice = weightedSales[i].price;
    ema = alpha * currentPrice + (1 - alpha) * ema;
  }
  
  return ema;
}

/**
 * Calculate time-weighted average for smaller samples
 */
function calculateTimeWeightedAverage(weightedSales: WeightedSale[]): number {
  const totalWeightedValue = weightedSales.reduce(
    (sum, sale) => sum + sale.price * sale.timeWeight,
    0
  );
  
  const totalWeight = weightedSales.reduce(
    (sum, sale) => sum + sale.timeWeight,
    0
  );
  
  return totalWeight > 0 ? totalWeightedValue / totalWeight : 0;
}

/**
 * Determine confidence level based on sample characteristics
 */
function determineConfidence(weightedSales: WeightedSale[]): 'high' | 'medium' | 'low' {
  const sampleSize = weightedSales.length;
  const newestSale = Math.min(...weightedSales.map(s => s.daysOld));
  const averageWeight = weightedSales.reduce((sum, sale) => sum + sale.timeWeight, 0) / sampleSize;

  // High confidence: Large sample with recent sales
  if (sampleSize >= 10 && newestSale <= 7 && averageWeight >= 0.5) {
    return 'high';
  }
  
  // Medium confidence: Decent sample or very recent sales
  if (sampleSize >= 5 || (newestSale <= 3 && sampleSize >= 3)) {
    return 'medium';
  }
  
  // Low confidence: Small sample or old sales
  return 'low';
}

