import 'server-only';
import { Player } from '@/types/global.types';

/**
 * Calculates a fast, static, ballpark estimate for a player's value based on their core attributes.
 * This is used to determine if a listing price is realistic enough to be considered part of the true market supply.
 * It does not require any API calls.
 */
export function calculateStaticEstimate(player: Player): { value: number; range: { low: number; high: number } } {
  // Base value calculation using overall rating
  let baseValue = Math.max(1, Math.pow(player.metadata.overall / 10, 2.5)) * 100;
  
  // Position multiplier (safe fallback values)
  const positionMultipliers: Record<string, number> = {
    'GK': 1.0,
    'CB': 1.05,
    'LB': 1.1,
    'RB': 1.1,
    'CDM': 1.15,
    'CM': 1.0,
    'CAM': 1.2,
    'LM': 1.1,
    'RM': 1.1,
    'LW': 1.15,
    'RW': 1.15,
    'ST': 1.25,
  };
  
  const positionMultiplier = positionMultipliers[player.metadata.positions[0]] || 1.0;
  
  // Age penalty (older players worth less)
  const ageMultiplier = player.metadata.age <= 28 ? 1.0 : 1.0 - ((player.metadata.age - 28) * 0.02);
  
  // Overall tier bonus
  const overallBonus = player.metadata.overall >= 85 ? 1.5 : player.metadata.overall >= 80 ? 1.2 : 1.0;
  
  const finalValue = Math.round(baseValue * positionMultiplier * ageMultiplier * overallBonus);
  
  // Wide range since we have no market data
  return {
    value: finalValue,
    range: {
      low: Math.round(finalValue * 0.6),
      high: Math.round(finalValue * 1.4)
    }
  };
}