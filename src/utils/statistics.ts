/**
 * Statistical utility functions for market value calculations
 */

/**
 * Calculate trimmed mean by removing top and bottom percentiles
 */
export function calculateTrimmedMean(
  values: number[],
  trimPercent: number = 0.1 // Remove 10% from each end by default
): number {
  if (values.length === 0) return 0;
  if (values.length <= 2) return calculateMean(values); // Too few values to trim

  const sorted = [...values].sort((a, b) => a - b);
  const trimCount = Math.floor(sorted.length * trimPercent);
  
  // Remove trimCount elements from each end
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);
  
  if (trimmed.length === 0) return calculateMean(values); // Fallback if over-trimmed
  
  return calculateMean(trimmed);
}

/**
 * Calculate simple arithmetic mean
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Calculate median value
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

/**
 * Calculate standard deviation
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length <= 1) return 0;
  
  const mean = calculateMean(values);
  const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
  const variance = calculateMean(squaredDifferences);
  
  return Math.sqrt(variance);
}

/**
 * Calculate robust average using trimmed mean with median fallback
 */
export function calculateRobustAverage(
  values: number[],
  options: {
    trimPercent?: number;
    useMedianFallback?: boolean;
    minSampleSize?: number;
  } = {}
): {
  value: number;
  method: 'trimmed-mean' | 'median' | 'mean';
  confidence: 'high' | 'medium' | 'low';
} {
  const {
    trimPercent = 0.1,
    useMedianFallback = true,
    minSampleSize = 5,
  } = options;

  if (values.length === 0) {
    return { value: 0, method: 'mean', confidence: 'low' };
  }

  // For very small samples, use median or mean
  if (values.length < minSampleSize) {
    if (useMedianFallback && values.length >= 3) {
      return {
        value: calculateMedian(values),
        method: 'median',
        confidence: 'low'
      };
    } else {
      return {
        value: calculateMean(values),
        method: 'mean',
        confidence: 'low'
      };
    }
  }

  // For larger samples, use trimmed mean
  const trimmedMean = calculateTrimmedMean(values, trimPercent);
  const confidence = values.length >= 15 ? 'high' : values.length >= 8 ? 'medium' : 'low';
  
  return {
    value: trimmedMean,
    method: 'trimmed-mean',
    confidence
  };
}

/**
 * Remove extreme outliers using interquartile range method
 */
export function removeOutliersByIQR(
  values: number[],
  multiplier: number = 1.5
): {
  filtered: number[];
  removed: number[];
  stats: {
    q1: number;
    q3: number;
    iqr: number;
    lowerBound: number;
    upperBound: number;
  };
} {
  if (values.length < 4) {
    return {
      filtered: values,
      removed: [],
      stats: { q1: 0, q3: 0, iqr: 0, lowerBound: 0, upperBound: 0 }
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const q1Index = Math.floor(sorted.length * 0.25);
  const q3Index = Math.floor(sorted.length * 0.75);
  
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;
  
  const lowerBound = q1 - multiplier * iqr;
  const upperBound = q3 + multiplier * iqr;
  
  const filtered: number[] = [];
  const removed: number[] = [];
  
  values.forEach(value => {
    if (value >= lowerBound && value <= upperBound) {
      filtered.push(value);
    } else {
      removed.push(value);
    }
  });

  return {
    filtered,
    removed,
    stats: { q1, q3, iqr, lowerBound, upperBound }
  };
}


/**
 * Calculate confidence factor based on sample size
 */
export function calculateConfidenceFactor(
  sampleSize: number,
  idealSampleSize: number = 15
): number {
  if (sampleSize >= idealSampleSize) return 1.0;
  if (sampleSize === 0) return 0.0;
  
  // Square root relationship for confidence
  return Math.sqrt(sampleSize / idealSampleSize);
}

/**
 * Calculate price range (confidence interval) based on standard deviation
 */
export function calculatePriceRange(
  values: number[],
  confidenceLevel: number = 0.8
): {
  low: number;
  high: number;
  center: number;
  range: number;
  volatility: 'low' | 'medium' | 'high';
  method: 'dynamic' | 'fallback';
} {
  if (values.length === 0) {
    return { low: 0, high: 0, center: 0, range: 0, volatility: 'medium', method: 'fallback' };
  }

  const mean = calculateMean(values);
  const stdDev = calculateStandardDeviation(values);
  
  // Dynamic range calculation based on actual market volatility
  let multiplier: number;
  let volatility: 'low' | 'medium' | 'high';
  
  if (values.length >= 5) {
    // Calculate coefficient of variation (CV) to assess volatility
    const coefficientOfVariation = stdDev / mean;
    
    if (coefficientOfVariation < 0.15) {
      // Low volatility market - tighter range
      volatility = 'low';
      multiplier = confidenceLevel === 0.9 ? 1.2 : 0.8;
    } else if (coefficientOfVariation > 0.35) {
      // High volatility market - wider range
      volatility = 'high';
      multiplier = confidenceLevel === 0.9 ? 2.2 : 1.8;
    } else {
      // Medium volatility market - standard range
      volatility = 'medium';
      multiplier = confidenceLevel === 0.9 ? 1.64 : 1.28;
    }
  } else {
    // Fallback to standard confidence intervals for small samples
    volatility = 'medium';
    multiplier = confidenceLevel === 0.9 ? 1.64 : 1.28;
  }
  
  const range = stdDev * multiplier;
  const low = Math.max(0, mean - range); // Don't go below 0
  const high = mean + range;

  return { 
    low, 
    high, 
    center: mean, 
    range: range * 2,
    volatility,
    method: values.length >= 5 ? 'dynamic' : 'fallback'
  };
}

/**
 * Calculate price range centered around a specific estimated value
 * This ensures the estimated value always falls within the range
 */
export function calculateCenteredPriceRange(
  values: number[],
  estimatedValue: number,
  confidenceLevel: number = 0.8
): {
  low: number;
  high: number;
  center: number;
  range: number;
  volatility: 'low' | 'medium' | 'high';
  method: 'dynamic' | 'fallback';
} {
  if (values.length === 0) {
    // Fallback range for when we have no data - use percentage-based range
    const fallbackRange = estimatedValue * 0.3; // ±30% range
    return { 
      low: Math.max(1, Math.round(estimatedValue - fallbackRange)), 
      high: Math.round(estimatedValue + fallbackRange), 
      center: estimatedValue, 
      range: fallbackRange * 2,
      volatility: 'medium',
      method: 'fallback'
    };
  }

  // Get the market volatility information from the data
  const baseRange = calculatePriceRange(values, confidenceLevel);
  const stdDev = calculateStandardDeviation(values);
  const mean = calculateMean(values);
  
  // Calculate range size based on market volatility, but center it on our estimated value
  let rangeSize: number;
  
  if (values.length >= 5 && stdDev > 0) {
    // Use actual market volatility to determine range size
    const coefficientOfVariation = stdDev / mean;
    
    if (coefficientOfVariation < 0.15) {
      // Low volatility - tighter range (±15-20%)
      rangeSize = estimatedValue * (confidenceLevel === 0.9 ? 0.2 : 0.15);
    } else if (coefficientOfVariation > 0.35) {
      // High volatility - wider range (±35-50%)
      rangeSize = estimatedValue * (confidenceLevel === 0.9 ? 0.5 : 0.35);
    } else {
      // Medium volatility - standard range (±20-30%)
      rangeSize = estimatedValue * (confidenceLevel === 0.9 ? 0.3 : 0.2);
    }
  } else {
    // Fallback to percentage-based range for small samples
    rangeSize = estimatedValue * (confidenceLevel === 0.9 ? 0.3 : 0.25);
  }
  
  const low = Math.max(1, Math.round(estimatedValue - rangeSize));
  const high = Math.round(estimatedValue + rangeSize);

  return { 
    low, 
    high, 
    center: estimatedValue, 
    range: rangeSize * 2,
    volatility: baseRange.volatility,
    method: values.length >= 5 ? 'dynamic' : 'fallback'
  };
}

/**
 * Detect if prices have suspicious patterns (e.g., too many round numbers)
 */
export function detectSuspiciousPatterns(values: number[]): {
  suspiciousCount: number;
  patterns: string[];
  cleanValues: number[];
} {
  const patterns: string[] = [];
  const suspicious: number[] = [];
  const clean: number[] = [];

  values.forEach(value => {
    let isSuspicious = false;

    // Check for very round numbers (multiples of 10, 25, 50, 100)
    if (value % 100 === 0 && value > 0) {
      patterns.push(`Round hundred: $${value}`);
      isSuspicious = true;
    } else if (value % 50 === 0 && value > 0) {
      patterns.push(`Round fifty: $${value}`);
      isSuspicious = true;
    }

    // Check for suspiciously low values that might be private trades
    if (value === 1) {
      patterns.push(`Potential private trade: $${value}`);
      isSuspicious = true;
    }

    if (isSuspicious) {
      suspicious.push(value);
    } else {
      clean.push(value);
    }
  });

  return {
    suspiciousCount: suspicious.length,
    patterns: [...new Set(patterns)], // Remove duplicates
    cleanValues: clean
  };
}

/**
 * Comprehensive price analysis combining multiple statistical methods
 */
export function analyzeMarketPrices(
  values: number[],
  options: {
    removeOutliers?: boolean;
    confidenceLevel?: number;
    detectSuspicious?: boolean;
  } = {}
): {
  originalCount: number;
  finalCount: number;
  average: ReturnType<typeof calculateRobustAverage>;
  priceRange: ReturnType<typeof calculatePriceRange>;
  confidenceFactor: number;
  standardDeviation: number;
  outliers?: ReturnType<typeof removeOutliersByIQR>;
  suspicious?: ReturnType<typeof detectSuspiciousPatterns>;
  recommendation: string;
} {
  const {
    removeOutliers = true,
    confidenceLevel = 0.8,
    detectSuspicious = true,
  } = options;

  let workingValues = [...values];
  const originalCount = values.length;

  // Step 1: Remove suspicious patterns if enabled
  let suspicious;
  if (detectSuspicious) {
    suspicious = detectSuspiciousPatterns(workingValues);
    if (suspicious.cleanValues.length >= Math.max(2, workingValues.length * 0.7)) {
      workingValues = suspicious.cleanValues;
    }
  }

  // Step 2: Remove outliers if enabled
  let outliers;
  if (removeOutliers && workingValues.length >= 5) {
    outliers = removeOutliersByIQR(workingValues);
    if (outliers.filtered.length >= Math.max(2, workingValues.length * 0.6)) {
      workingValues = outliers.filtered;
    }
  }

  // Step 3: Calculate robust average
  const average = calculateRobustAverage(workingValues);

  // Step 4: Calculate price range
  const priceRange = calculatePriceRange(workingValues, confidenceLevel);

  // Step 5: Calculate confidence factor
  const confidenceFactor = calculateConfidenceFactor(workingValues.length);

  // Step 5.5: Calculate standard deviation for volatility analysis
  const standardDeviation = workingValues.length > 1 ? 
    calculateStandardDeviation(workingValues) : 0;

  // Step 6: Generate recommendation
  let recommendation = '';
  if (workingValues.length === 0) {
    recommendation = 'Insufficient data for reliable estimate';
  } else if (workingValues.length < 3) {
    recommendation = 'Low confidence - very limited sales data';
  } else if (workingValues.length < 8) {
    recommendation = 'Medium confidence - some recent sales available';
  } else {
    recommendation = 'High confidence - good sample of recent sales';
  }

  return {
    originalCount,
    finalCount: workingValues.length,
    average,
    priceRange,
    confidenceFactor,
    standardDeviation,
    outliers,
    suspicious,
    recommendation,
  };
}

// Matrix operations for linear regression

/**
 * Matrix transpose
 */
export function transpose(matrix: number[][]): number[][] {
  if (matrix.length === 0) return [];
  return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
}

/**
 * Matrix multiplication
 */
export function multiply(a: number[][], b: number[][]): number[][] {
  const result: number[][] = [];
  for (let i = 0; i < a.length; i++) {
    result[i] = [];
    for (let j = 0; j < b[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < b.length; k++) {
        sum += a[i][k] * b[k][j];
      }
      result[i][j] = sum;
    }
  }
  return result;
}

/**
 * Matrix-vector multiplication
 */
export function multiplyVector(matrix: number[][], vector: number[]): number[] {
  return matrix.map(row =>
    row.reduce((sum, val, i) => sum + val * vector[i], 0)
  );
}

/**
 * Matrix inverse using Gauss-Jordan elimination
 */
export function inverse(matrix: number[][]): number[][] {
  const n = matrix.length;
  const identity = Array(n).fill(0).map((_, i) => 
    Array(n).fill(0).map((_, j) => i === j ? 1 : 0)
  );
  
  const augmented = matrix.map((row, i) => [...row, ...identity[i]]);
  
  // Gauss-Jordan elimination
  for (let i = 0; i < n; i++) {
    // Find pivot
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(augmented[k][i]) > Math.abs(augmented[maxRow][i])) {
        maxRow = k;
      }
    }
    
    // Swap rows
    [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]];
    
    // Make diagonal element 1
    const pivot = augmented[i][i];
    if (Math.abs(pivot) < 1e-10) {
      // Singular matrix - return identity as fallback
      return identity;
    }
    
    for (let j = 0; j < 2 * n; j++) {
      augmented[i][j] /= pivot;
    }
    
    // Eliminate column
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = augmented[k][i];
        for (let j = 0; j < 2 * n; j++) {
          augmented[k][j] -= factor * augmented[i][j];
        }
      }
    }
  }
  
  // Extract inverse matrix
  return augmented.map(row => row.slice(n));
}