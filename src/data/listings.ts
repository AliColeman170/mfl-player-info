import 'server-only';
import { Listing, Player } from '@/types/global.types';
import { cachedFetch, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';
import { fetchAllPlayerSales } from '@/lib/pagination';

/**
 * Get minimum price threshold based on player overall rating
 */
function getMinimumPriceThreshold(overall: number): number {
  if (overall >= 85) return 25;
  if (overall >= 75) return 10;
  if (overall >= 65) return 5;
  if (overall >= 55) return 1;
  return 0;
}

/**
 * Legacy function - get market price listings for a player (limited to 3 results)
 * @deprecated Use getEnhancedMarketData for better results
 */
export const getMarketPriceListingsForPlayer = async (player: Player): Promise<Listing[]> => {
  try {
    // Use cached fetch with proper tagging
    const listings: Listing[] = await cachedFetch(
      `https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod/listings?limit=50&status=BOUGHT&type=PLAYER&ageMin=${
        player.metadata.age - 1
      }&ageMax=${player.metadata.age + 1}&overallMin=${
        player.metadata.overall - 1
      }&overallMax=${player.metadata.overall + 1}&positions=${player.metadata.positions[0]}&marketplace=all`,
      {
        tags: [CACHE_KEYS.PLAYER_SALES(player.id)],
        revalidate: CACHE_TTL.RAW_SALES_DATA,
      }
    );

    // Fix the filter bug - assign the filtered result back to listings
    const minPrice = getMinimumPriceThreshold(player.metadata.overall);
    const filteredListings = listings.filter((listing) => listing.price > minPrice);

    console.log(`Found ${filteredListings.length} valid sales for player ${player.id} (min price: $${minPrice})`);

    return filteredListings.slice(0, 3);
  } catch (error) {
    console.error(`Error fetching market data for player ${player.id}:`, error);
    return [];
  }
};

/**
 * Enhanced function to get comprehensive market data for a player
 */
export const getEnhancedMarketData = async (
  player: Player,
  options: {
    maxResults?: number;
    expandSearch?: boolean;
  } = {}
): Promise<{
  sales: Listing[];
  sampleSize: number;
  searchCriteria: string;
  minPrice: number;
}> => {
  const { maxResults = 50, expandSearch = true } = options;

  try {
    let sales: Listing[] = [];
    let searchAttempt = 0;
    const maxAttempts = expandSearch ? 3 : 1;

    while (sales.length < 5 && searchAttempt < maxAttempts) {
      const ageRange = 1 + searchAttempt;
      const overallRange = 1 + searchAttempt;

      console.log(`Search attempt ${searchAttempt + 1}: age ±${ageRange}, overall ±${overallRange}`);

      const fetchedSales = await fetchAllPlayerSales(
        player.metadata.age - ageRange,
        player.metadata.age + ageRange,
        player.metadata.overall - overallRange,
        player.metadata.overall + overallRange,
        player.metadata.positions[0],
        { maxPages: 5 }
      );

      // Apply price filtering
      const minPrice = getMinimumPriceThreshold(player.metadata.overall);
      sales = fetchedSales.filter((listing) => listing.price > minPrice);

      searchAttempt++;
    }

    // Sort by purchase date (most recent first) and limit results
    const sortedSales = sales
      .filter(sale => sale.purchaseDateTime)
      .sort((a, b) => (b.purchaseDateTime || 0) - (a.purchaseDateTime || 0))
      .slice(0, maxResults);

    const searchCriteria = `±${searchAttempt} age/overall, ${player.metadata.positions[0]}`;
    const minPrice = getMinimumPriceThreshold(player.metadata.overall);

    console.log(`Enhanced search found ${sortedSales.length} sales for player ${player.id}`);

    return {
      sales: sortedSales,
      sampleSize: sortedSales.length,
      searchCriteria,
      minPrice,
    };
  } catch (error) {
    console.error(`Error in enhanced market data fetch for player ${player.id}:`, error);
    return {
      sales: [],
      sampleSize: 0,
      searchCriteria: 'Error occurred',
      minPrice: getMinimumPriceThreshold(player.metadata.overall),
    };
  }
};
