import 'server-only';
import { Player, Listing } from '@/types/global.types';
import { getEnhancedMarketDataFromDB, getInterpolatedMarketEstimate } from '@/data/sales';
import { calculateEMA, type EMAResult } from './ema-pricing';
import {
  predictValueFromStats,
  type PredictionResult,
} from './value-prediction';
import { analyzeMarketPrices, calculateCenteredPriceRange } from '@/utils/statistics';
import { calculateStaticEstimate } from './value-estimation';
import { getMarketMultiplierFromDB } from './market-multiplier-updater';
// Simplified caching removed

/**
 * COMPREHENSIVE market multipliers covering ALL possibilities
 * Positions: All 15 valid positions (GK, CB, LB, RB, CDM, CM, CAM, LM, RM, LW, RW, ST, CF, RWB, LWB)
 * Ages: 16-40 (individual ages: 25 different ages)
 * Overall: 40-99 (smaller ranges: 97-99, 94-96, 91-93, etc.)
 * Baseline: 76-78 OVR, age 25, CM position = 1.0
 */
const COMPREHENSIVE_MARKET_MULTIPLIERS = {
  multiplierTable: generateComprehensiveMultipliers()
};

/**
 * Generate comprehensive multipliers for ALL positions, ages, and overall ratings
 * Uses position-based, age-based, and overall-based multipliers with realistic market dynamics
 */
function generateComprehensiveMultipliers(): Record<string, Record<string, Record<string, number>>> {
  // All 15 valid positions (removed AMC)
  const ALL_POSITIONS = ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST', 'CF'];
  
  // Individual ages (16-40)
  const ALL_AGES = Array.from({length: 25}, (_, i) => (16 + i).toString()); // ['16', '17', '18', ..., '40']
  
  // Smaller overall brackets (40-99 in 3-point ranges)
  const OVERALL_BRACKETS = [
    '97-99', '94-96', '91-93', '88-90', '85-87', '82-84', '79-81', '76-78', 
    '73-75', '70-72', '67-69', '64-66', '61-63', '58-60', '55-57', '52-54', 
    '49-51', '46-48', '43-45', '40-42'
  ];
  
  // Position value multipliers (relative to CM = 1.0)
  const POSITION_MULTIPLIERS: Record<string, number> = {
    'ST': 1.25,   // Strikers command premium
    'CF': 1.20,   // Center forwards
    'CAM': 1.15,  // Creative attacking midfielders
    'CM': 1.00,   // BASELINE position
    'LW': 1.10,   // Wingers
    'RW': 1.10,   
    'LM': 0.95,   // Midfield wings
    'RM': 0.95,
    'CDM': 0.90,  // Defensive midfielders
    'RB': 0.85,   // Full backs
    'LB': 0.85,
    'RWB': 0.80,  // Wing backs (less common)
    'LWB': 0.80,
    'CB': 0.75,   // Center backs
    'GK': 0.70    // Goalkeepers (specialized market)
  };
  
  // Age multipliers (individual ages, relative to age 25 = 1.0)
  function getAgeMultiplier(age: number): number {
    if (age <= 20) return 1.50;      // Very young talent
    if (age <= 22) return 1.30;      // Young talent premium
    if (age <= 24) return 1.10;      // Rising stars
    if (age <= 27) return 1.00;      // BASELINE peak years
    if (age <= 29) return 0.85;      // Still good
    if (age <= 32) return 0.65;      // Declining
    if (age <= 35) return 0.45;      // Veteran
    return 0.30;                     // Old veteran
  }
  
  // Overall rating multipliers (relative to 76-78 = 1.0)
  const OVERALL_MULTIPLIERS: Record<string, number> = {
    '97-99': 20.0,  // Legendary players
    '94-96': 12.0,  // Elite players
    '91-93': 8.0,   // World class
    '88-90': 5.5,   // Excellent
    '85-87': 3.8,   // Very good
    '82-84': 2.5,   // Good
    '79-81': 1.6,   // Above average
    '76-78': 1.0,   // BASELINE
    '73-75': 0.65,  // Below average
    '70-72': 0.40,  // Poor
    '67-69': 0.25,  // Very poor
    '64-66': 0.15,  // Bad
    '61-63': 0.10,  // Very bad
    '58-60': 0.06,  // Terrible
    '55-57': 0.04,  // Awful
    '52-54': 0.025, // Horrible
    '49-51': 0.015, // Useless
    '46-48': 0.01,  // Trash
    '43-45': 0.005, // Garbage
    '40-42': 0.002  // Minimum value
  };
  
  const result: Record<string, Record<string, Record<string, number>>> = {};
  
  // Generate multipliers for every combination
  for (const position of ALL_POSITIONS) {
    result[position] = {};
    
    for (const ageStr of ALL_AGES) {
      result[position][ageStr] = {};
      const age = parseInt(ageStr);
      
      for (const overallRange of OVERALL_BRACKETS) {
        // Calculate multiplier: position × age × overall
        const positionMult = POSITION_MULTIPLIERS[position];
        const ageMult = getAgeMultiplier(age);
        const overallMult = OVERALL_MULTIPLIERS[overallRange];
        
        // Apply market dynamics variation
        const marketVariation = getMarketVariation(position, age, overallRange);
        
        const multiplier = positionMult * ageMult * overallMult * marketVariation;
        
        // Round to 4 decimal places and ensure minimum value
        result[position][ageStr][overallRange] = Math.max(0.001, Math.round(multiplier * 10000) / 10000);
      }
    }
  }
  
  return result;
}

/**
 * Apply market variation based on specific combinations
 * Simulates real market dynamics and preferences
 */
function getMarketVariation(position: string, age: number, overallRange: string): number {
  // Base variation of 1.0 (no change)
  let variation = 1.0;
  
  // Young elite players get extra premium
  if (age <= 22 && ['97-99', '94-96', '91-93', '88-90', '85-87'].includes(overallRange)) {
    variation *= 1.15; // +15% for young elite talent
  }
  
  // Goalkeepers peak later, so less age penalty
  if (position === 'GK' && age >= 28 && age <= 32) {
    variation *= 1.20; // GKs maintain value longer
  }
  
  // Defensive players less affected by age
  if (['CB', 'CDM'].includes(position) && age >= 28 && age <= 32) {
    variation *= 1.10; // Experience valued in defense
  }
  
  // Wingers/attackers more affected by age decline
  if (['LW', 'RW', 'ST', 'CF'].includes(position) && age >= 33) {
    variation *= 0.85; // Speed/agility important for attackers
  }
  
  // Very high rated older players still command premium
  if (age >= 33 && ['97-99', '94-96'].includes(overallRange)) {
    variation *= 1.50; // Legendary players maintain value
  }
  
  // Low overall young players get extra discount (projects)
  if (age <= 22 && ['40-42', '43-45', '46-48', '49-51', '52-54'].includes(overallRange)) {
    variation *= 0.75; // Unproven young talent
  }
  
  return variation;
}

/**
 * LEGACY: Keep original multipliers for fallback/comparison
 * This is the old partial coverage system
 */
const REAL_MARKET_MULTIPLIERS = {
  multiplierTable: COMPREHENSIVE_MARKET_MULTIPLIERS.multiplierTable
};

/**
 * Adjust a sale price using the comprehensive 3D market lookup table
 * Uses real sales data from 10,000 transactions
 */
async function adjustPriceForMarketFactors(
  salePrice: number, 
  targetPlayer: { overall: number; age: number; position: string },
  salePlayer: { overall: number; age: number; position: string }
): Promise<number> {
  // Get multipliers from database/market data lookup table
  const targetMultiplier = await getMarketMultiplier(
    targetPlayer.position, 
    targetPlayer.age, 
    targetPlayer.overall
  );
  
  const saleMultiplier = await getMarketMultiplier(
    salePlayer.position, 
    salePlayer.age, 
    salePlayer.overall
  );
  
  if (targetMultiplier === 0 || saleMultiplier === 0) {
    // Fall back to basic overall scaling if no market data
    return Math.round(salePrice * getBasicOverallMultiplier(targetPlayer.overall, salePlayer.overall));
  }
  
  // Calculate adjustment ratio using real market data
  const marketAdjustment = targetMultiplier / saleMultiplier;
  
  // Sanity check: limit extreme adjustments
  const boundedAdjustment = Math.min(10.0, Math.max(0.1, marketAdjustment));
  
  return Math.round(salePrice * boundedAdjustment);
}

/**
 * Get market multiplier from database first, fallback to hardcoded lookup table
 */
async function getMarketMultiplier(position: string, age: number, overall: number): Promise<number> {
  try {
    // Try database first
    const dbMultiplier = await getMarketMultiplierFromDB(position, age, overall);
    if (dbMultiplier > 0) {
      return dbMultiplier;
    }
  } catch (error) {
    console.warn(`Failed to get multiplier from DB for ${position} ${age}y ${overall}ovr, using fallback:`, error);
  }

  // Fallback to hardcoded lookup table
  const ageRange = getAgeRange(age);
  const overallRange = getOverallRange(overall);
  
  const positionData = REAL_MARKET_MULTIPLIERS.multiplierTable[position];
  if (!positionData) return 0;
  
  const ageData = positionData[ageRange];
  if (!ageData) return 0;
  
  const multiplier = ageData[overallRange];
  return multiplier || 0;
}

/**
 * Map age to individual age string (16-40)
 */
function getAgeRange(age: number): string {
  // Clamp age to valid range and return as string
  const clampedAge = Math.max(16, Math.min(40, age));
  return clampedAge.toString();
}

/**
 * Map overall rating to smaller overall range bucket (3-point ranges)
 */
function getOverallRange(overall: number): string {
  if (overall >= 97) return '97-99';
  if (overall >= 94) return '94-96';
  if (overall >= 91) return '91-93';
  if (overall >= 88) return '88-90';
  if (overall >= 85) return '85-87';
  if (overall >= 82) return '82-84';
  if (overall >= 79) return '79-81';
  if (overall >= 76) return '76-78';
  if (overall >= 73) return '73-75';
  if (overall >= 70) return '70-72';
  if (overall >= 67) return '67-69';
  if (overall >= 64) return '64-66';
  if (overall >= 61) return '61-63';
  if (overall >= 58) return '58-60';
  if (overall >= 55) return '55-57';
  if (overall >= 52) return '52-54';
  if (overall >= 49) return '49-51';
  if (overall >= 46) return '46-48';
  if (overall >= 43) return '43-45';
  if (overall >= 40) return '40-42';
  return '40-42'; // Minimum bracket for any valid player
}

/**
 * Basic overall rating multiplier for fallback when no market data exists
 */
function getBasicOverallMultiplier(targetOverall: number, saleOverall: number): number {
  const overallDiff = targetOverall - saleOverall;
  
  // Exponential scaling: each overall point is worth ~12% more
  const multiplier = Math.pow(1.12, overallDiff);
  
  // Bound the adjustment
  return Math.min(8.0, Math.max(0.125, multiplier));
}

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
  method: 'ema' | 'trimmed-mean' | 'regression' | 'interpolated' | 'position-estimate';

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

    console.log(`[Market Value] Calculating market value for player ${player.id} (${player.metadata.overall} overall, ${player.metadata.age} age, ${player.metadata.positions?.[0] || 'unknown'})`);

    // Get enhanced market data from local database
    const marketData = await getEnhancedMarketDataFromDB(player, {
      maxResults: 50,
      expandSearch: true,
    });

    let result: MarketValueResult;

    console.log(`[Market Value] Player ${player.id}: Found ${marketData.sampleSize} sales, criteria: ${marketData.searchCriteria}`);

    // Pre-filter sales to get actual usable count for method selection
    const validSalesForDecision = marketData.sales.filter(sale => 
      sale.purchase_date_time !== null && 
      sale.purchase_date_time !== undefined &&
      sale.price > 0
    );

    // Decision tree based on valid sample size
    if (validSalesForDecision.length >= 5) {
      // Sufficient data for EMA approach
      console.log(`[Market Value] Player ${player.id}: Using EMA approach (${validSalesForDecision.length} valid sales)`);
      result = await calculateWithEMA(player, marketData, testConfigs);
    } else if (validSalesForDecision.length >= 2) {
      // Limited data - use statistical analysis
      console.log(`[Market Value] Player ${player.id}: Using statistical analysis (${validSalesForDecision.length} valid sales)`);
      result = await calculateWithStatistics(player, marketData, testConfigs);
    } else {
      // No/minimal sales data - try interpolation first, then regression
      console.log(`[Market Value] Player ${player.id}: Using interpolation/regression fallback (${validSalesForDecision.length} valid sales)`);
      result = await calculateWithInterpolation(player, marketData, testConfigs);
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

    console.log(`[Market Value] Final result for player ${player.id}: $${result.estimatedValue} (${result.method}, ${result.confidence} confidence, ${result.sampleSize} samples)`);

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
  player: Player,
  marketData: ReturnType<typeof getEnhancedMarketDataFromDB> extends Promise<infer T>
    ? T
    : never,
  testConfigs: Record<string, any> = {}
): Promise<MarketValueResult> {
  // Apply test configurations
  const emaAlpha = testConfigs['ema-alpha-optimization']?.emaAlpha || 0.3;

  // Convert SaleRecord[] to Listing[] format for EMA calculation
  // Filter out sales without purchase timestamps before conversion
  const validSales = marketData.sales.filter(sale => 
    sale.purchase_date_time !== null && 
    sale.purchase_date_time !== undefined &&
    sale.price > 0 &&
    sale.player_overall !== null
  );
  
  // Adjust prices based on comprehensive market factors before EMA calculation
  const adjustedSales = await Promise.all(validSales.map(async sale => {
    const adjustedPrice = await adjustPriceForMarketFactors(
      sale.price,
      {
        overall: player.metadata.overall,
        age: player.metadata.age,
        position: player.metadata.positions?.[0] || 'CM'
      },
      {
        overall: sale.player_overall || 0,
        age: sale.player_age || 25,
        position: sale.player_position || 'CM'
      }
    );
    return { ...sale, price: adjustedPrice };
  }));

  const salesAsListings: Listing[] = adjustedSales.map(sale => ({
    listingResourceId: sale.listing_resource_id,
    status: sale.status,
    price: sale.price, // Using adjusted price
    sellerAddress: sale.seller_wallet_address || '',
    sellerName: '', // Not available in SaleRecord
    buyerAddress: sale.buyer_wallet_address || undefined,
    buyerName: '', // Not available in SaleRecord
    purchaseDateTime: sale.purchase_date_time!, // Now guaranteed to be non-null
    createdDateTime: sale.created_date_time,
  }));
  
  console.log(`[Market Value] Player ${player.id}: Filtered ${marketData.sales.length} -> ${validSales.length} valid sales for EMA`);

  // Log if any sales were filtered out due to missing timestamps
  if (marketData.sales.length !== validSales.length) {
    console.log(`[Market Value] Player ${player.id}: Filtered out ${marketData.sales.length - validSales.length} sales with missing/invalid timestamps`);
  }
  
  // Use longer lookback period for high-rated players (85+ OVR) due to limited sales
  const maxDaysOld = player.metadata.overall >= 85 ? 540 : 180; // 18 months vs 6 months
  
  console.log(`[Market Value] Player ${player.id}: Using ${maxDaysOld} day lookback (${player.metadata.overall >= 85 ? '18 months' : '6 months'}) for ${player.metadata.overall} OVR player`);
  
  const emaResult = calculateEMA(salesAsListings, { 
    alpha: emaAlpha,
    maxDaysOld: maxDaysOld
  });
  const statisticalResult = analyzeMarketPrices(
    adjustedSales.map((sale) => sale.price), // Use adjusted prices for consistency
    { confidenceLevel: 0.8 }  
  );

  const estimatedValue = emaResult.value;
  const confidence = emaResult.confidence;

  // Calculate price range centered on the EMA value
  const centeredRange = calculateCenteredPriceRange(
    adjustedSales.map((sale) => sale.price), // Use adjusted prices
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
  const salesPerDay = validSales.length / Math.max(1, timeSpan);

  if (
    validSales.length >= 15 &&
    emaResult.newestSale <= 7 &&
    timeSpan >= 14 &&
    salesPerDay >= 0.5
  ) {
    // Excellent: Large sample, recent data, good time span coverage, consistent trading
    dataQuality = 'excellent';
  } else if (
    validSales.length >= 10 &&
    emaResult.newestSale <= 14 &&
    timeSpan >= 7
  ) {
    // Good: Decent sample, reasonably recent, adequate time span
    dataQuality = 'good';
  } else if (validSales.length >= 5 && emaResult.newestSale <= 30) {
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
    sampleSize: validSales.length, // Use actual valid sales count
    dataQuality,
    explanation:
      `Based on exponential moving average of ${validSales.length} recent sales. ` +
      `${
        confidence === 'high'
          ? 'High confidence due to good sample size and recent data.'
          : confidence === 'medium'
            ? 'Medium confidence with decent sample size.'
            : 'Lower confidence due to limited or older sales data.'
      }`,
    basedOn: `${validSales.length} sales over last ${Math.ceil(emaResult.oldestSale)} days (${marketData.searchCriteria})`,
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
  player: Player,
  marketData: ReturnType<typeof getEnhancedMarketDataFromDB> extends Promise<infer T>
    ? T
    : never,
  _testConfigs: Record<string, any> = {}
): Promise<MarketValueResult> {
  // Filter out sales without valid data, same as EMA method
  const validSales = marketData.sales.filter(sale => 
    sale.price > 0 &&
    sale.purchase_date_time !== null && 
    sale.purchase_date_time !== undefined &&
    sale.player_overall !== null
  );
  
  // Adjust prices based on comprehensive market factors
  const adjustedPrices = await Promise.all(validSales.map(async (sale) => {
    return await adjustPriceForMarketFactors(
      sale.price,
      {
        overall: player.metadata.overall,
        age: player.metadata.age,
        position: player.metadata.positions?.[0] || 'CM'
      },
      {
        overall: sale.player_overall || 0,
        age: sale.player_age || 25,
        position: sale.player_position || 'CM'
      }
    );
  }));

  const statisticalResult = analyzeMarketPrices(adjustedPrices, {
    confidenceLevel: 0.8,
    removeOutliers: true,
  });

  const estimatedValue = Math.round(statisticalResult.average.value);

  // Calculate price range centered on the statistical estimate
  const centeredRange = calculateCenteredPriceRange(
    adjustedPrices,
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
    sampleSize: validSales.length,
    dataQuality: 'fair',
    explanation:
      `Based on ${statisticalResult.average.method} of ${validSales.length} sales. ` +
      `Limited data available, so estimate has higher uncertainty.`,
    basedOn: `${validSales.length} sales (${marketData.searchCriteria})`,
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
 * Calculate using interpolation for players with no direct sales data
 */
async function calculateWithInterpolation(
  player: Player,
  marketData: ReturnType<typeof getEnhancedMarketDataFromDB> extends Promise<infer T>
    ? T
    : never,
  testConfigs: Record<string, any> = {}
): Promise<MarketValueResult> {
  try {
    // Try interpolation first
    const interpolatedResult = await getInterpolatedMarketEstimate(player);
    
    if (interpolatedResult.sampleSize > 0) {
      // We found enough data for interpolation
      const estimatedValue = interpolatedResult.estimatedValue;
      
      // Calculate price range based on interpolation confidence
      const priceRange = calculateCenteredPriceRange(
        [], // No direct sales data
        estimatedValue,
        0.6 // Lower confidence level for interpolated data
      );

      return {
        estimatedValue,
        priceRange: {
          low: priceRange.low,
          high: priceRange.high,
        },
        confidence: 'low', // Always low confidence for interpolated data
        method: 'interpolated',
        sampleSize: interpolatedResult.sampleSize,
        dataQuality: 'fair',
        explanation: `${interpolatedResult.basedOn}. Estimate based on similar players.`,
        basedOn: interpolatedResult.basedOn,
        breakdown: {
          cacheHit: false,
          calculationTime: 0,
        },
      };
    } else {
      // Fall back to regression if interpolation fails
      return await calculateWithPrediction(player, testConfigs);
    }
  } catch (error) {
    console.error('Error in interpolation calculation:', error);
    // Fall back to regression on error
    return await calculateWithPrediction(player, testConfigs);
  }
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

