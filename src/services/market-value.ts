import 'server-only';
import { Player } from '@/types/global.types';
import { getEnhancedMarketDataFromDB } from '@/data/sales';
import { calculateEMA, type EMAResult } from './ema-pricing';
import {
  predictValueFromStats,
  type PredictionResult,
} from './value-prediction';
import { analyzeMarketPrices, calculateCenteredPriceRange } from '@/utils/statistics';
import { calculateStaticEstimate } from './value-estimation';
// Simplified caching removed

/**
 * Comprehensive market value result
 */
export interface MarketValueResult {
  // Core values
  estimatedValue: number;
  priceRange: {
    low: number;
    high: number;
  };

  // Confidence and methodology
  confidence: 'high' | 'medium' | 'low';
  method: 'ema' | 'trimmed-mean' | 'regression' | 'position-estimate';

  // Supporting data
  sampleSize: number;
  dataQuality: 'excellent' | 'good' | 'fair' | 'poor';

  // User-friendly explanation
  explanation: string;
  basedOn: string;

  // Market context (simplified - no supply analysis)
  marketContext?: {
    summary: string;
    details: string;
  };

  // Detailed breakdown (for debugging/advanced users)
  breakdown: {
    salesData?: {
      ema?: EMAResult;
      statistical?: ReturnType<typeof analyzeMarketPrices>;
    };
    prediction?: PredictionResult;
    cacheHit: boolean;
    calculationTime: number;
  };
}

/**
 * Main market value calculation function with decision tree logic
 */
export async function calculateMarketValue(
  player: Player,
  options: {
    testConfigs?: Record<string, any>;
  } = {}
): Promise<MarketValueResult> {
  const startTime = Date.now();
  const { testConfigs = {} } = options;

  try {

    console.log(`Calculating market value for player ${player.id}`);

    // Get enhanced market data from local database
    const marketData = await getEnhancedMarketDataFromDB(player, {
      maxResults: 50,
      expandSearch: true,
    });

    let result: MarketValueResult;

    // Decision tree based on sample size
    if (marketData.sampleSize >= 5) {
      // Sufficient data for EMA approach
      result = await calculateWithEMA(player, marketData, testConfigs);
    } else if (marketData.sampleSize >= 2) {
      // Limited data - use statistical analysis
      result = await calculateWithStatistics(player, marketData, testConfigs);
    } else {
      // No/minimal sales data - use regression prediction
      result = await calculateWithPrediction(player, testConfigs);
    }

    // Pure historical sales approach - no supply adjustments
    // Add basic market context based on data quality
    if (result.sampleSize >= 10) {
      result.marketContext = {
        summary: `Strong data confidence with ${result.sampleSize} recent sales`,
        details: `Market value based purely on historical transaction data`,
      };
    } else if (result.sampleSize >= 2) {
      result.marketContext = {
        summary: `Limited data with ${result.sampleSize} recent sales`,
        details: `Estimate based on available transaction history`,
      };
    } else {
      result.marketContext = {
        summary: `No recent sales data available`,
        details: `Estimated using player characteristics and market patterns`,
      };
    }

    // Add timing information
    result.breakdown.cacheHit = false;
    result.breakdown.calculationTime = Date.now() - startTime;

    console.log(`Market value calculated for player ${player.id}: $${result.estimatedValue}`);

    return result;
  } catch (error) {
    console.error(`Market value calculation failed for player ${player.id}:`, error);

    // Safe emergency fallback - static estimate based on player overall
    const safeEstimate = calculateStaticEstimate(player);

    return {
      estimatedValue: safeEstimate.value,
      priceRange: safeEstimate.range,
      confidence: 'low',
      method: 'position-estimate',
      sampleSize: 0,
      dataQuality: 'poor',
      explanation: 'System error - using position-based estimate',
      basedOn: 'Overall rating and position multipliers only',
      marketContext: {
        summary: 'System error - limited data available',
        details: 'Emergency fallback pricing based on player attributes only',
      },
      breakdown: {
        calculationTime: Date.now() - startTime,
        cacheHit: false,
      },
    };
  }
}

/**
 * Calculate using EMA for players with sufficient sales data
 */
async function calculateWithEMA(
  _player: Player,
  marketData: ReturnType<typeof getEnhancedMarketDataFromDB> extends Promise<infer T>
    ? T
    : never,
  testConfigs: Record<string, any> = {}
): Promise<MarketValueResult> {
  // Apply test configurations
  const emaAlpha = testConfigs['ema-alpha-optimization']?.emaAlpha || 0.3;

  const emaResult = calculateEMA(marketData.sales, { alpha: emaAlpha });
  const statisticalResult = analyzeMarketPrices(
    marketData.sales.map((sale) => sale.price),
    { confidenceLevel: 0.8 }
  );

  const estimatedValue = emaResult.value;
  const confidence = emaResult.confidence;

  // Calculate price range centered on the EMA value
  const centeredRange = calculateCenteredPriceRange(
    marketData.sales.map((sale) => sale.price),
    estimatedValue,
    0.8
  );
  
  const priceRange = {
    low: centeredRange.low,
    high: centeredRange.high,
  };

  // Enhanced data quality assessment including time span
  let dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  const timeSpan = emaResult.oldestSale - emaResult.newestSale; // Days between oldest and newest sale
  const salesPerDay = marketData.sampleSize / Math.max(1, timeSpan);

  if (
    marketData.sampleSize >= 15 &&
    emaResult.newestSale <= 7 &&
    timeSpan >= 14 &&
    salesPerDay >= 0.5
  ) {
    // Excellent: Large sample, recent data, good time span coverage, consistent trading
    dataQuality = 'excellent';
  } else if (
    marketData.sampleSize >= 10 &&
    emaResult.newestSale <= 14 &&
    timeSpan >= 7
  ) {
    // Good: Decent sample, reasonably recent, adequate time span
    dataQuality = 'good';
  } else if (marketData.sampleSize >= 5 && emaResult.newestSale <= 30) {
    // Fair: Minimum viable sample, not too old
    dataQuality = 'fair';
  } else {
    // Poor: Small sample or very old data
    dataQuality = 'poor';
  }

  return {
    estimatedValue,
    priceRange,
    confidence,
    method: 'ema',
    sampleSize: marketData.sampleSize,
    dataQuality,
    explanation:
      `Based on exponential moving average of ${marketData.sampleSize} recent sales. ` +
      `${
        confidence === 'high'
          ? 'High confidence due to good sample size and recent data.'
          : confidence === 'medium'
            ? 'Medium confidence with decent sample size.'
            : 'Lower confidence due to limited or older sales data.'
      }`,
    basedOn: `${marketData.sampleSize} sales over last ${Math.ceil(emaResult.oldestSale)} days (${marketData.searchCriteria})`,
    breakdown: {
      salesData: {
        ema: emaResult,
        statistical: statisticalResult,
      },
      cacheHit: false,
      calculationTime: 0,
    },
  };
}

/**
 * Calculate using statistical analysis for players with limited sales data
 */
async function calculateWithStatistics(
  _player: Player,
  marketData: ReturnType<typeof getEnhancedMarketDataFromDB> extends Promise<infer T>
    ? T
    : never,
  _testConfigs: Record<string, any> = {}
): Promise<MarketValueResult> {
  const prices = marketData.sales.map((sale) => sale.price);
  const statisticalResult = analyzeMarketPrices(prices, {
    confidenceLevel: 0.8,
    removeOutliers: true,
  });

  const estimatedValue = Math.round(statisticalResult.average.value);

  // Calculate price range centered on the statistical estimate
  const centeredRange = calculateCenteredPriceRange(
    prices,
    estimatedValue,
    0.8
  );

  const priceRange = {
    low: centeredRange.low,
    high: centeredRange.high,
  };

  return {
    estimatedValue,
    priceRange,
    confidence: 'medium',
    method: 'trimmed-mean',
    sampleSize: marketData.sampleSize,
    dataQuality: 'fair',
    explanation:
      `Based on ${statisticalResult.average.method} of ${marketData.sampleSize} sales. ` +
      `Limited data available, so estimate has higher uncertainty.`,
    basedOn: `${marketData.sampleSize} sales (${marketData.searchCriteria})`,
    breakdown: {
      salesData: {
        statistical: statisticalResult,
      },
      cacheHit: false,
      calculationTime: 0,
    },
  };
}

/**
 * Calculate using regression prediction for players with no/minimal sales data
 */
async function calculateWithPrediction(
  player: Player,
  testConfigs: Record<string, any> = {}
): Promise<MarketValueResult> {
  // Apply test configurations for regression features
  const regressionConfig = testConfigs['regression-features'] || {};
  const predictionOptions = {
    features: regressionConfig.features,
    useAdvancedFeatures: regressionConfig.useAdvancedFeatures,
  };

  const prediction = await predictValueFromStats(player, predictionOptions);

  const estimatedValue = prediction.predictedPrice;

  // Calculate price range centered on prediction with confidence-based sizing
  const confidenceLevel = prediction.confidence === 'high' ? 0.8 : 
                         prediction.confidence === 'medium' ? 0.7 : 0.6;
  
  // For predictions, we use a percentage-based approach since we have no actual sales data
  const centeredRange = calculateCenteredPriceRange(
    [], // No sales data for predictions
    estimatedValue,
    confidenceLevel
  );

  const priceRange = {
    low: centeredRange.low,
    high: centeredRange.high,
  };

  let dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  if (prediction.method === 'regression' && prediction.confidence === 'high') {
    dataQuality = 'good';
  } else if (prediction.method === 'regression') {
    dataQuality = 'fair';
  } else {
    dataQuality = 'poor';
  }

  return {
    estimatedValue,
    priceRange,
    confidence: prediction.confidence,
    method: 'regression',
    sampleSize: 0,
    dataQuality,
    explanation:
      prediction.explanation +
      ' ' +
      (prediction.confidence === 'low'
        ? 'This is a rough estimate due to limited market data.'
        : 'Model-based estimate with reasonable accuracy.'),
    basedOn: prediction.basedOn,
    breakdown: {
      prediction,
      cacheHit: false,
      calculationTime: 0,
    },
  };
}

// Caching functions removed for simplicity

/**
 * Format market value for display
 */
export function formatMarketValue(result: MarketValueResult): string {
  const { estimatedValue, priceRange, confidence, sampleSize } = result;

  if (confidence === 'high' && sampleSize >= 10) {
    return `$${estimatedValue} (range: $${priceRange.low}-${priceRange.high})`;
  } else if (confidence === 'medium' || sampleSize >= 3) {
    return `~$${estimatedValue} (estimated range: $${priceRange.low}-${priceRange.high})`;
  } else {
    return `~$${estimatedValue} (rough estimate)`;
  }
}

/**
 * Get market value explanation for users
 */
export function getMarketValueExplanation(result: MarketValueResult): {
  summary: string;
  details: string;
  confidence: string;
} {
  const confidenceExplanations = {
    high: 'High confidence - based on recent sales data with good sample size',
    medium: 'Medium confidence - some market data available',
    low: 'Low confidence - limited market data, estimate based on player characteristics',
  };

  return {
    summary: result.explanation,
    details: `Method: ${result.method}, Sample size: ${result.sampleSize}, Data quality: ${result.dataQuality}`,
    confidence: confidenceExplanations[result.confidence],
  };
}

