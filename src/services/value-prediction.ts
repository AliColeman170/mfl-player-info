import 'server-only';
import { Player } from '@/types/global.types';
import { fetchRecentSalesFeed } from '@/lib/pagination';
import { analyzeMarketPrices, transpose, multiply, multiplyVector, inverse } from '@/utils/statistics';

/**
 * Training data point for regression model
 */
interface TrainingDataPoint {
  overall: number;
  age: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defense: number;
  physical: number;
  goalkeeping: number;
  position: string;
  actualPrice: number;
}

// Constants
const MIN_TRAINING_SIZE = 10;
const MIN_SALES_PER_PLAYER = 2;
const DEFAULT_POSITION_ENCODING = 5; // CM

/**
 * Position encoding for regression model
 */
const POSITION_ENCODING = new Map([
  ['GK', 0], ['CB', 1], ['LB', 2], ['RB', 2],
  ['LWB', 3], ['RWB', 3], ['CDM', 4],
  ['CM', 5], ['LM', 5], ['RM', 5], ['CAM', 6],
  ['LW', 7], ['RW', 7], ['CF', 8], ['ST', 9],
]);

/**
 * Regression model coefficients (will be calculated from training data)
 */
interface RegressionModel {
  coefficients: {
    intercept: number;
    overall: number;
    age: number;
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defense: number;
    physical: number;
    goalkeeping: number;
    position: number;
  };
  metadata: {
    trainingSize: number;
    r2Score: number;
    meanAbsoluteError: number;
    lastUpdated: number;
  };
}

/**
 * Prediction result with confidence metrics
 */
export interface PredictionResult {
  predictedPrice: number;
  confidence: 'high' | 'medium' | 'low';
  method: 'regression' | 'position-average' | 'overall-average';
  explanation: string;
  similarPlayersCount: number;
  basedOn: string;
}

/**
 * Get position encoding for regression
 */
function getPositionEncoding(position: string): number {
  return POSITION_ENCODING.get(position) ?? DEFAULT_POSITION_ENCODING;
}

/**
 * Extract features from player for regression
 */
function extractPlayerFeatures(player: Player, useAdvanced: boolean = true): number[] {
  const basic = [
    player.metadata.overall,
    player.metadata.age,
    getPositionEncoding(player.metadata.positions[0]),
  ];

  if (!useAdvanced) return basic;

  return [
    player.metadata.overall,
    player.metadata.age,
    player.metadata.pace,
    player.metadata.shooting,
    player.metadata.passing,
    player.metadata.dribbling,
    player.metadata.defense,
    player.metadata.physical,
    player.metadata.goalkeeping,
    getPositionEncoding(player.metadata.positions[0]),
  ];
}

/**
 * Calculate prediction from features and coefficients
 */
function calculatePrediction(features: number[], coefficients: RegressionModel['coefficients']): number {
  let prediction = coefficients.intercept;
  
  if (features.length >= 10) {
    // Full feature prediction
    prediction += features[0] * coefficients.overall;
    prediction += features[1] * coefficients.age;
    prediction += features[2] * coefficients.pace;
    prediction += features[3] * coefficients.shooting;
    prediction += features[4] * coefficients.passing;
    prediction += features[5] * coefficients.dribbling;
    prediction += features[6] * coefficients.defense;
    prediction += features[7] * coefficients.physical;
    prediction += features[8] * coefficients.goalkeeping;
    prediction += features[9] * coefficients.position;
  } else {
    // Basic feature prediction (overall, age, position)
    prediction += features[0] * coefficients.overall;
    if (features.length > 1) prediction += features[1] * coefficients.age;
    if (features.length > 2) prediction += features[2] * coefficients.position;
  }

  return Math.max(1, Math.round(prediction));
}


/**
 * Train linear regression model
 */
function trainLinearRegression(features: number[][], targets: number[]): {
  coefficients: number[];
  intercept: number;
} {
  if (features.length === 0) return { coefficients: [], intercept: 0 };

  // Add column of 1s for intercept
  const X = features.map(row => [1, ...row]);
  const y = targets;

  // Calculate coefficients using normal equation: (X^T * X)^-1 * X^T * y
  const XTranspose = transpose(X);
  const XTX = multiply(XTranspose, X);
  const XTXInverse = inverse(XTX);
  const XTy = multiplyVector(XTranspose, y);
  const coefficients = multiplyVector(XTXInverse, XTy);

  return {
    intercept: coefficients[0],
    coefficients: coefficients.slice(1),
  };
}

/**
 * Make prediction using trained coefficients
 */
function predict(features: number[], coefficients: number[], intercept: number): number {
  if (coefficients.length === 0) return 0;

  let prediction = intercept;
  for (let i = 0; i < features.length && i < coefficients.length; i++) {
    prediction += features[i] * coefficients[i];
  }

  return Math.max(0, prediction); // Don't predict negative prices
}

/**
 * Calculate R-squared score
 */
function calculateR2(features: number[][], targets: number[], coefficients: number[], intercept: number): number {
  if (targets.length === 0) return 0;

  const predictions = features.map(f => predict(f, coefficients, intercept));
  const meanTarget = targets.reduce((sum, val) => sum + val, 0) / targets.length;

  const totalSumSquares = targets.reduce(
    (sum, val) => sum + Math.pow(val - meanTarget, 2),
    0
  );

  const residualSumSquares = targets.reduce(
    (sum, val, i) => sum + Math.pow(val - predictions[i], 2),
    0
  );

  return totalSumSquares > 0 ? 1 - (residualSumSquares / totalSumSquares) : 0;
}

/**
 * Calculate mean absolute error
 */
function calculateMAE(features: number[][], targets: number[], coefficients: number[], intercept: number): number {
  if (targets.length === 0) return 0;

  const predictions = features.map(f => predict(f, coefficients, intercept));
  const errors = targets.map((target, i) => Math.abs(target - predictions[i]));

  return errors.reduce((sum, error) => sum + error, 0) / errors.length;
}

/**
 * Build training dataset from players with known sales
 */
async function buildTrainingDataset(): Promise<TrainingDataPoint[]> {
  try {
    console.log('Building regression training dataset...');
    
    // Fetch recent sales to get price data
    const recentSales = await fetchRecentSalesFeed({ maxPages: 10, daysBack: 60 });
    console.log(`Found ${recentSales.length} recent sales for training`);

    // Group sales by player ID and calculate average prices
    const playerPrices = new Map<number, number[]>();
    
    recentSales.forEach(sale => {
      if (sale.player?.id && sale.price > 0) {
        const playerId = sale.player.id;
        if (!playerPrices.has(playerId)) {
          playerPrices.set(playerId, []);
        }
        playerPrices.get(playerId)!.push(sale.price);
      }
    });

    // Calculate average price for each player
    const playerAveragePrices = new Map<number, number>();
    playerPrices.forEach((prices, playerId) => {
      const analysis = analyzeMarketPrices(prices);
      if (analysis.finalCount >= MIN_SALES_PER_PLAYER) {
        playerAveragePrices.set(playerId, analysis.average.value);
      }
    });

    console.log(`Found ${playerAveragePrices.size} players with reliable price data`);

    // Create training data points
    const trainingData: TrainingDataPoint[] = [];
    
    for (const [playerId, avgPrice] of playerAveragePrices) {
      // Find the player from the sales data
      const saleWithPlayer = recentSales.find(sale => sale.player?.id === playerId);
      if (saleWithPlayer?.player) {
        const player = saleWithPlayer.player;
        
        trainingData.push({
          overall: player.metadata.overall,
          age: player.metadata.age,
          pace: player.metadata.pace,
          shooting: player.metadata.shooting,
          passing: player.metadata.passing,
          dribbling: player.metadata.dribbling,
          defense: player.metadata.defense,
          physical: player.metadata.physical,
          goalkeeping: player.metadata.goalkeeping,
          position: player.metadata.positions[0],
          actualPrice: avgPrice,
        });
      }
    }

    console.log(`Created ${trainingData.length} training data points`);
    return trainingData;
    
  } catch (error) {
    console.error('Error building training dataset:', error);
    return [];
  }
}

/**
 * Train regression model from market data
 */
export async function trainRegressionModel(): Promise<RegressionModel | null> {
  try {
    const trainingData = await buildTrainingDataset();
    
    if (trainingData.length < MIN_TRAINING_SIZE) {
      console.warn('Insufficient training data for regression model');
      return null;
    }

    // Prepare features and targets
    const features = trainingData.map(point => [
      point.overall,
      point.age,
      point.pace,
      point.shooting,
      point.passing,
      point.dribbling,
      point.defense,
      point.physical,
      point.goalkeeping,
      getPositionEncoding(point.position),
    ]);
    
    const targets = trainingData.map(point => point.actualPrice);

    // Train the model
    const { coefficients, intercept } = trainLinearRegression(features, targets);

    // Calculate model quality metrics
    const r2Score = calculateR2(features, targets, coefficients, intercept);
    const mae = calculateMAE(features, targets, coefficients, intercept);

    console.log(`Regression model trained with R² = ${r2Score.toFixed(3)}, MAE = ${mae.toFixed(2)}`);

    return {
      coefficients: {
        intercept,
        overall: coefficients[0] || 0,
        age: coefficients[1] || 0,
        pace: coefficients[2] || 0,
        shooting: coefficients[3] || 0,
        passing: coefficients[4] || 0,
        dribbling: coefficients[5] || 0,
        defense: coefficients[6] || 0,
        physical: coefficients[7] || 0,
        goalkeeping: coefficients[8] || 0,
        position: coefficients[9] || 0,
      },
      metadata: {
        trainingSize: trainingData.length,
        r2Score,
        meanAbsoluteError: mae,
        lastUpdated: Date.now(),
      },
    };
    
  } catch (error) {
    console.error('Error training regression model:', error);
    return null;
  }
}

/**
 * Predict player value using regression model
 */
export async function predictValueFromStats(
  player: Player,
  options: {
    model?: RegressionModel;
    features?: string[];
    useAdvancedFeatures?: boolean;
  } = {}
): Promise<PredictionResult> {
  try {
    const { model, features, useAdvancedFeatures = true } = options;
    
    // Use provided model or train a new one
    const regressionModel = model || await trainRegressionModel();

    if (!regressionModel) {
      // Fallback to position-based average
      return await fallbackToPositionAverage(player);
    }

    // Extract features and calculate prediction
    const featureVector = extractPlayerFeatures(player, useAdvancedFeatures);
    const predictedPrice = calculatePrediction(featureVector, regressionModel.coefficients);

    // Determine confidence based on model quality and player characteristics
    let confidence: 'high' | 'medium' | 'low' = 'medium';
    if (regressionModel.metadata.r2Score > 0.7 && regressionModel.metadata.trainingSize > 50) {
      confidence = 'high';
    } else if (regressionModel.metadata.r2Score < 0.3 || regressionModel.metadata.trainingSize < 20) {
      confidence = 'low';
    }

    return {
      predictedPrice,
      confidence,
      method: 'regression',
      explanation: `Predicted using regression model trained on ${regressionModel.metadata.trainingSize} players (R² = ${regressionModel.metadata.r2Score.toFixed(2)})`,
      similarPlayersCount: regressionModel.metadata.trainingSize,
      basedOn: 'Statistical model based on overall, age, position, and key stats',
    };

  } catch (error) {
    console.error('Error in regression prediction:', error);
    return await fallbackToPositionAverage(player);
  }
}

/**
 * Fallback method using position-based averages
 */
async function fallbackToPositionAverage(player: Player): Promise<PredictionResult> {
  try {
    // Simple position-based pricing fallback
    const positionMultipliers = {
      'GK': 15,
      'CB': 20,
      'LB': 25, 'RB': 25,
      'LWB': 30, 'RWB': 30,
      'CDM': 35,
      'CM': 25, 'LM': 25, 'RM': 25,
      'CAM': 40,
      'LW': 35, 'RW': 35,
      'CF': 45,
      'ST': 50,
    };

    const baseMultiplier = positionMultipliers[player.metadata.positions[0] as keyof typeof positionMultipliers] || 25;
    const overallFactor = Math.pow(player.metadata.overall / 70, 2.5); // Exponential scaling
    const ageFactor = player.metadata.age <= 24 ? 1.2 : player.metadata.age >= 30 ? 0.8 : 1.0;

    const predictedPrice = Math.round(baseMultiplier * overallFactor * ageFactor);

    return {
      predictedPrice,
      confidence: 'low',
      method: 'position-average',
      explanation: `Estimated using position-based formula (${player.metadata.positions[0]} players typically $${baseMultiplier} base)`,
      similarPlayersCount: 0,
      basedOn: `Position: ${player.metadata.positions[0]}, Overall: ${player.metadata.overall}, Age: ${player.metadata.age}`,
    };

  } catch (error) {
    console.error('Error in fallback prediction:', error);
    
    // Ultimate fallback
    const simplePrice = Math.max(1, player.metadata.overall - 50);
    return {
      predictedPrice: simplePrice,
      confidence: 'low',
      method: 'overall-average',
      explanation: 'Basic estimate based on overall rating only',
      similarPlayersCount: 0,
      basedOn: `Overall rating: ${player.metadata.overall}`,
    };
  }
}