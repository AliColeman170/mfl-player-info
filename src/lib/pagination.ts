import { Listing, Player } from '@/types/global.types';

/**
 * Simple fetch wrapper for MFL API calls
 */
async function simpleFetch<T>(url: string): Promise<T> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API call failed: ${url}`, error);
    throw error;
  }
}


/**
 * Configuration for pagination behavior
 */
const PAGINATION_CONFIG = {
  maxPages: 20, // Safety limit to prevent infinite loops
  defaultLimit: 50, // MFL API max limit
  maxRetries: 3,
} as const;

/**
 * Generic pagination helper for MFL API endpoints
 */
export async function fetchAllPages<T extends Record<string, any>>(
  baseEndpoint: string,
  params: Record<string, string | number | boolean> = {},
  options: {
    maxPages?: number;
    limit?: number;
    idField?: string; // Field to use for pagination (e.g., 'beforePlayerId', 'beforeListingId')
  } = {}
): Promise<T[]> {
  const {
    maxPages = PAGINATION_CONFIG.maxPages,
    limit = PAGINATION_CONFIG.defaultLimit,
    idField = 'beforeId',
  } = options;

  const allResults: T[] = [];
  let currentParams = { ...params, limit };
  let pageCount = 0;

  while (pageCount < maxPages) {
    try {
      // Build query string
      const queryString = new URLSearchParams(
        Object.entries(currentParams).map(([key, value]) => [key, String(value)])
      ).toString();
      
      const endpoint = `${baseEndpoint}${queryString ? `?${queryString}` : ''}`;
      
      console.log(`Fetching page ${pageCount + 1} from: ${endpoint}`);
      
      // Fetch page
      const baseUrl = 'https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod';
      const fullUrl = `${baseUrl}${endpoint}`;
      const results: T[] = await simpleFetch<T[]>(fullUrl);

      // Handle empty response
      if (!results || results.length === 0) {
        console.log(`No more results found on page ${pageCount + 1}. Stopping pagination.`);
        break;
      }

      allResults.push(...results);
      pageCount++;

      // Check if we got fewer results than the limit (indicates last page)
      if (results.length < limit) {
        console.log(`Received ${results.length} results (less than limit ${limit}). Last page reached.`);
        break;
      }

      // Set up pagination for next request using the last item's ID
      const lastItem = results[results.length - 1];
      
      // Determine which ID field to use based on the idField parameter
      let idValue: number | undefined;
      if (idField === 'beforeListingId' && 'listingResourceId' in lastItem) {
        idValue = lastItem.listingResourceId;
      } else if (idField === 'beforePlayerId' && 'id' in lastItem) {
        idValue = lastItem.id;
      } else if ('id' in lastItem) {
        idValue = lastItem.id;
      }
      
      if (idValue) {
        (currentParams as any)[idField] = idValue;
      } else {
        console.warn('Last item missing ID field for pagination. Stopping.');
        break;
      }

      // Small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`Error fetching page ${pageCount + 1}:`, error);
      
      // If we have some results, return what we have
      if (allResults.length > 0) {
        console.warn(`Returning ${allResults.length} results despite pagination error.`);
        break;
      }
      
      throw error;
    }
  }

  if (pageCount >= maxPages) {
    console.warn(`Pagination stopped after reaching maximum pages (${maxPages}). Results may be incomplete.`);
  }

  console.log(`Pagination complete. Fetched ${allResults.length} total results across ${pageCount} pages.`);
  return allResults;
}

/**
 * Fetch all sales listings for a player with similar characteristics
 */
export async function fetchAllPlayerSales(
  ageMin: number,
  ageMax: number,
  overallMin: number,
  overallMax: number,
  positions: string,
  options: {
    maxPages?: number;
    includeAll?: boolean;
  } = {}
): Promise<Listing[]> {
  const { maxPages = 10, includeAll = false } = options;

  const params = {
    limit: 50,
    status: 'BOUGHT',
    type: 'PLAYER',
    ageMin,
    ageMax,
    overallMin,
    overallMax,
    positions,
    ...(includeAll ? {} : { marketplace: 'all' }),
  };

  return fetchAllPages<Listing>(
    '/listings',
    params,
    {
      maxPages,
      limit: 50,
      idField: 'beforeListingId',
    }
  );
}



/**
 * Fetch recent sales feed for trend analysis
 */
export async function fetchRecentSalesFeed(
  options: {
    maxPages?: number;
    daysBack?: number;
  } = {}
): Promise<Listing[]> {
  const { maxPages = 20, daysBack = 30 } = options;

  // Calculate timestamp for X days ago
  const cutoffDate = Date.now() - (daysBack * 24 * 60 * 60 * 1000);

  const allSales: Listing[] = [];
  let pageCount = 0;
  let beforeListingId: number | undefined;

  while (pageCount < maxPages) {
    try {
      const params: Record<string, string | number> = {
        limit: 25, // Feed endpoint max limit
      };
      
      if (beforeListingId) {
        params.beforeListingId = beforeListingId;
      }

      const queryString = new URLSearchParams(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      ).toString();
      
      const baseUrl = 'https://z519wdyajg.execute-api.us-east-1.amazonaws.com/prod';
      const fullUrl = `${baseUrl}/listings/feed?${queryString}`;
      const results: Listing[] = await simpleFetch<Listing[]>(fullUrl);

      if (!results || results.length === 0) {
        break;
      }

      // Filter out sales older than our cutoff
      const recentSales = results.filter(sale => {
        return sale.purchaseDateTime && sale.purchaseDateTime > cutoffDate;
      });

      // If no recent sales in this batch, we've gone too far back
      if (recentSales.length === 0) {
        console.log(`No recent sales found in page ${pageCount + 1}. Stopping feed fetch.`);
        break;
      }

      allSales.push(...recentSales);
      
      // If we got fewer recent sales than total results, we're reaching the cutoff
      if (recentSales.length < results.length) {
        console.log(`Reached sales older than ${daysBack} days. Stopping feed fetch.`);
        break;
      }

      beforeListingId = results[results.length - 1]?.listingResourceId;
      pageCount++;

      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`Error fetching sales feed page ${pageCount + 1}:`, error);
      break;
    }
  }

  console.log(`Fetched ${allSales.length} recent sales from the last ${daysBack} days.`);
  return allSales;
}