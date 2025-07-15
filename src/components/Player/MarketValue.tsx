import { Player } from '@/types/global.types';
import {
  calculateMarketValue,
  type MarketValueResult,
} from '@/services/market-value';

interface MarketValueProps {
  player: Player;
}

// Helper functions for consistent descriptions
function getMethodDescription(method: string): string {
  switch (method) {
    case 'ema':
      return 'Based on exponential moving average of recent sales data';
    case 'trimmed-mean':
      return 'Statistical analysis of limited sales data';
    case 'regression':
      return 'Predicted using player characteristics and market patterns';
    case 'position-estimate':
      return 'Fallback estimate based on position and overall rating';
    default:
      return 'Market value estimate';
  }
}

function getConfidenceDescription(confidence: string): string {
  switch (confidence) {
    case 'high':
      return 'High confidence based on recent sales with good sample size';
    case 'medium':
      return 'Medium confidence with some market data available';
    case 'low':
      return 'Low confidence due to limited data, estimate based on player characteristics';
    default:
      return '';
  }
}

export async function MarketValue({ player }: MarketValueProps) {
  try {
    const marketValue: MarketValueResult = await calculateMarketValue(player);

    if (marketValue.estimatedValue <= 0) {
      return (
        <div className='text-gray-500'>
          <span>Unavailable</span>
        </div>
      );
    }

    return (
      <div className='flex flex-col items-end'>
        <div className='flex items-center gap-2'>
          <ConfidenceBadge confidence={marketValue.confidence} />
          <span className='font-medium'>~${marketValue.estimatedValue}</span>
        </div>
        <div className='mt-1 text-xs text-gray-500'>
          Range: ${marketValue.priceRange.low}-$
          {marketValue.priceRange.high}
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className='text-red-500'>
        <span>Error calculating value</span>
      </div>
    );
  }
}

/**
 * Generate tooltip text for market value explanation
 */
export async function getMarketValueTooltip(player: Player): Promise<string> {
  try {
    const marketValue = await calculateMarketValue(player);

    if (marketValue.estimatedValue <= 0) {
      return 'No recent sales data available for market value calculation.';
    }

    return `${getMethodDescription(marketValue.method)} from ${marketValue.basedOn}. ${getConfidenceDescription(marketValue.confidence)}.`;
  } catch (error) {
    return 'Unable to calculate market value at this time.';
  }
}

/**
 * Confidence indicator badge
 */
function ConfidenceBadge({
  confidence,
}: {
  confidence: 'high' | 'medium' | 'low';
}) {
  const styles = {
    high: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20',
    medium:
      'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-400/10 dark:text-yellow-500 dark:ring-yellow-400/20',
    low: 'bg-red-50 text-red-700 ring-red-600/10 dark:bg-red-400/10 dark:text-red-400 dark:ring-red-400/20',
  };

  const labels = {
    high: 'High confidence',
    medium: 'Medium confidence',
    low: 'Low confidence',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${styles[confidence]}`}
      title={labels[confidence]}
    >
      {confidence.charAt(0).toUpperCase() + confidence.slice(1)}
    </span>
  );
}
