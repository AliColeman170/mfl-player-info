import { Player } from '@/types/global.types';
import { getPlayerPositionFamiliarityRatings } from '@/utils/helpers';
import { calculateMarketValue } from '@/services/market-value';
import { getListingByPlayerId } from '@/data/players';
import { getPositionIndex } from '@/lib/constants';

export interface ComputedPlayerFields {
  // Basic computed fields
  best_position: string;
  best_ovr: number;
  ovr_difference: number;
  position_index: number;
  best_position_index: number;

  // Market value data
  market_value_estimate: number;
  market_value_low: number;
  market_value_high: number;
  market_value_confidence: string;
  market_value_method: string;
  market_value_sample_size: number;
  market_value_based_on: string;
  market_value_updated_at: string;

  // Position ratings
  position_ratings: any[];
  best_position_rating: number;
  best_position_difference: number;

  // Additional fields
  goalkeeping: number;
  resistance: number;

  // Contract info
  has_pre_contract: boolean;
  energy: number;
  offer_status: number;
  offer_min_division: number | null;
  offer_min_revenue_share: number | null;
  offer_auto_accept: boolean | null;

  // Active contract data
  contract_id: number | null;
  contract_status: string | null;
  contract_kind: string | null;
  revenue_share: number | null;
  total_revenue_share_locked: number | null;
  start_season: number | null;
  nb_seasons: number | null;
  auto_renewal: boolean | null;
  contract_created_date_time: number | null;
  clauses: any[] | null;

  // Club information
  club_id: number | null;
  club_name: string | null;
  club_main_color: string | null;
  club_secondary_color: string | null;
  club_city: string | null;
  club_division: number | null;
  club_logo_version: string | null;
  club_country: string | null;
  club_type: string | null;

  // Owner information
  owner_wallet_address: string | null;
  owner_name: string | null;
  owner_twitter: string | null;
  owner_last_active: number | null;

  // Market/listing data
  current_listing_id: number | null;
  current_listing_price: number | null;
  current_listing_status: string | null;
  listing_created_date_time: number | null;
  price_difference: number | null;
  last_sale_price: number | null;
  last_sale_date: number | null;

  // Sync metadata
  data_hash: string;
}

/**
 * Calculate all computed fields for a player
 */
export async function calculateComputedFields(
  player: Player
): Promise<ComputedPlayerFields> {
  console.log(`Computing fields for player ${player.id}...`);

  try {
    // Calculate position ratings (most common computed field)
    const positionRatings = getPlayerPositionFamiliarityRatings(player, true); // true = sorted
    const bestPositionData = positionRatings?.[0] || {
      position: player.metadata.positions?.[0] || 'Unknown',
      rating: player.metadata.overall || 0,
      difference: 0,
    };

    // Extract nationality and positions for simplified schema
    const nationality = player.metadata.nationalities?.[0] || null;
    const primaryPosition = player.metadata.positions?.[0] || null;
    const secondaryPositions = player.metadata.positions?.slice(1) || [];

    // Calculate market value (most expensive computation)
    let marketValue;
    try {
      marketValue = await calculateMarketValue(player);
    } catch (error) {
      console.error(
        `Market value calculation failed for player ${player.id}:`,
        error
      );
      // Fallback to basic market value estimation
      marketValue = {
        estimatedValue: player.metadata.overall * 1000, // Simple fallback
        priceRange: {
          low: player.metadata.overall * 800,
          high: player.metadata.overall * 1200,
        },
        confidence: 'low',
        method: 'fallback',
        sampleSize: 0,
      };
    }

    // Extract contract information
    const contract = player.activeContract;
    const club = contract?.club;
    const owner = player.ownedBy;

    // Fetch current listing data to populate sale price in table
    // This checks if the player is currently for sale on the MFL marketplace
    let listingData: {
      current_listing_id: number | null;
      current_listing_price: number | null;
      current_listing_status: string | null;
      listing_created_date_time: number | null;
    } = {
      current_listing_id: null,
      current_listing_price: null,
      current_listing_status: null,
      listing_created_date_time: null,
    };

    try {
      const listing = await getListingByPlayerId(player.id);
      if (listing) {
        listingData = {
          current_listing_id: listing.listingResourceId,
          current_listing_price: listing.price,
          current_listing_status: listing.status,
          listing_created_date_time: listing.createdDateTime,
        };
        console.log(`Found listing for player ${player.id}: $${listing.price}`);
      }
    } catch (error) {
      console.error(
        `Failed to fetch listing data for player ${player.id}:`,
        error
      );
      // Keep default null values
    }

    // Generate data hash for change detection
    const dataHash = generateDataHash(player);

    const computedFields: ComputedPlayerFields = {
      // Basic computed fields
      best_position: bestPositionData.position || 'Unknown',
      best_ovr: bestPositionData.rating || 0,
      ovr_difference: bestPositionData.difference || 0,
      position_index: getPositionIndex(primaryPosition || 'Unknown'),
      best_position_index: getPositionIndex(
        bestPositionData.position || 'Unknown'
      ),

      // Market value data
      market_value_estimate: marketValue.estimatedValue,
      market_value_low: marketValue.priceRange.low,
      market_value_high: marketValue.priceRange.high,
      market_value_confidence: marketValue.confidence,
      market_value_method: marketValue.method,
      market_value_sample_size: marketValue.sampleSize,
      market_value_based_on: marketValue.basedOn || 'unknown',
      market_value_updated_at: new Date().toISOString(),

      // Position ratings
      position_ratings: positionRatings,
      best_position_rating: bestPositionData.rating,
      best_position_difference: bestPositionData.difference,

      // Additional fields from metadata
      goalkeeping: player.metadata.goalkeeping || 0,
      resistance: player.metadata.resistance || 0,

      // Contract info
      has_pre_contract: player.hasPreContract || false,
      energy: player.energy || 0,
      offer_status: player.offerStatus || 0,
      offer_min_division: player.offerMinDivision || null,
      offer_min_revenue_share: player.offerMinRevenueShare || null,
      offer_auto_accept: player.offerAutoAccept || null,

      // Active contract data
      contract_id: contract?.id || null,
      contract_status: contract?.status || null,
      contract_kind: contract?.kind || null,
      revenue_share: contract?.revenueShare || null,
      total_revenue_share_locked: contract?.totalRevenueShareLocked || null,
      start_season: contract?.startSeason || null,
      nb_seasons: contract?.nbSeasons || null,
      auto_renewal: contract?.autoRenewal || null,
      contract_created_date_time: contract?.createdDateTime || null,
      clauses: contract?.clauses || null,

      // Club information
      club_id: club?.id || null,
      club_name: club?.name || null,
      club_main_color: club?.mainColor || null,
      club_secondary_color: club?.secondaryColor || null,
      club_city: club?.city || null,
      club_division: club?.division || null,
      club_logo_version: club?.logoVersion || null,
      club_country: club?.country || null,
      club_type: club?.type || null,

      // Owner information
      owner_wallet_address: owner?.walletAddress || null,
      owner_name: owner?.name || null,
      owner_twitter: owner?.twitter || null,
      owner_last_active: owner?.lastActive || null,

      // Market/listing data
      current_listing_id: listingData.current_listing_id,
      current_listing_price: listingData.current_listing_price,
      current_listing_status: listingData.current_listing_status,
      listing_created_date_time: listingData.listing_created_date_time,
      price_difference:
        listingData.current_listing_price && marketValue.estimatedValue
          ? listingData.current_listing_price - marketValue.estimatedValue
          : null,
      last_sale_price: null, // TODO: This would need historical sales data
      last_sale_date: null, // TODO: This would need historical sales data

      // Sync metadata
      data_hash: dataHash,
    };

    console.log(`Successfully computed fields for player ${player.id}`);
    return computedFields;
  } catch (error) {
    console.error(`Error computing fields for player ${player.id}:`, error);
    throw error;
  }
}

/**
 * Generate a hash of the player data for change detection
 */
function generateDataHash(player: Player): string {
  const relevantData = {
    id: player.id,
    metadata: player.metadata,
    activeContract: player.activeContract,
    ownedBy: player.ownedBy,
    energy: player.energy,
    offerStatus: player.offerStatus,
    hasPreContract: player.hasPreContract,
  };

  return hashObject(relevantData);
}

/**
 * Simple hash function for objects
 */
function hashObject(obj: any): string {
  const str = JSON.stringify(obj, Object.keys(obj).sort());
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

/**
 * Check if player data has changed based on hash
 */
export function hasPlayerDataChanged(
  player: Player,
  storedHash: string
): boolean {
  const currentHash = generateDataHash(player);
  return currentHash !== storedHash;
}
