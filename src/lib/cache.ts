import { unstable_cache, revalidateTag } from 'next/cache';
import 'server-only';

/**
 * Cache configuration constants
 */
export const CACHE_KEYS = {
  PLAYER_SALES: (playerId: number) => `player-sales-${playerId}`,
  MARKET_VALUE: (playerId: number) => `market-value-${playerId}`,
} as const;

export const CACHE_TTL = {
  RAW_SALES_DATA: 300, // 5 minutes
  MARKET_VALUES: 3600, // 1 hour
} as const;

/**
 * Cached fetch wrapper for API calls with automatic tagging
 */
export async function cachedFetch<T>(
  url: string,
  options: {
    tags: string[];
    revalidate: number;
    init?: RequestInit;
  }
): Promise<T> {
  const response = await fetch(url, {
    ...options.init,
    next: {
      revalidate: options.revalidate,
      tags: options.tags,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Cache a computed market value with appropriate tags
 */
export function cacheMarketValue<T>(
  playerId: number,
  calculator: () => Promise<T>,
  tags?: string[]
): Promise<T> {
  return unstable_cache(
    calculator,
    [`market-value-${playerId}`],
    {
      tags: tags || [CACHE_KEYS.MARKET_VALUE(playerId)],
      revalidate: CACHE_TTL.MARKET_VALUES,
    }
  )();
}
