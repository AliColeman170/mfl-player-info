import {
  attributeWeighting,
  captainBoost,
  positionalFamiliarity,
} from '@/config';
import { Player } from '@/types/global.types';
import { ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface PlayerStats {
  pace: number;
  dribbling: number;
  passing: number;
  shooting: number;
  defense: number;
  physical: number;
  goalkeeping: number;
}

export const positionOrderArray = [
  'GK',
  'RB',
  'LB',
  'CB',
  'RWB',
  'LWB',
  'CDM',
  'RM',
  'LM',
  'CM',
  'CAM',
  'RW',
  'LW',
  'CF',
  'ST',
];

export function getRarityClassNames(rating: number) {
  if (rating >= 85) return 'bg-[#ca1afc] text-white';
  if (rating >= 75) return 'bg-[#016bd5] text-white';
  if (rating >= 65) return 'bg-[#35ae25] text-white';
  return 'bg-slate-200 text-slate-900';
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPlayerPositionRatings(
  player: Player,
  sorted?: boolean,
  stats?: PlayerStats,
  isCaptain: boolean = false,
  captainPosition: string = ''
) {
  const positionRatings = attributeWeighting.map(({ positions, weighting }) => {
    const { metadata } = player;

    const adjustedStats = stats
      ? { ...stats }
      : {
          passing: metadata.passing,
          shooting: metadata.shooting,
          defense: metadata.defense,
          dribbling: metadata.dribbling,
          pace: metadata.pace,
          physical: metadata.physical,
          goalkeeping: metadata.goalkeeping,
        };

    if (isCaptain) {
      Object.keys(adjustedStats).forEach(function (key) {
        const statKey = key as keyof PlayerStats;
        adjustedStats[statKey] = +adjustedStats[statKey] + 2;
      });
    } else {
      if (captainPosition) {
        const boost = captainBoost.find((boost) =>
          boost.positions.includes(captainPosition)
        );
        if (boost) {
          Object.keys(boost.adjustment).forEach((key) => {
            const statKey = key as keyof PlayerStats;
            adjustedStats[statKey] =
              +adjustedStats[statKey] + boost.adjustment[statKey];
          });
        }
      }
    }

    const {
      passing,
      shooting,
      defense,
      dribbling,
      pace,
      physical,
      goalkeeping = 0,
    } = adjustedStats;

    const rating = Math.round(
      passing * weighting[0] +
        shooting * weighting[1] +
        defense * weighting[2] +
        dribbling * weighting[3] +
        pace * weighting[4] +
        physical * weighting[5] +
        goalkeeping * weighting[6]
    );
    return {
      positions,
      rating,
      difference: rating - player.metadata.overall,
    };
  });

  if (sorted) return positionRatings.sort((a, b) => b.rating - a.rating);

  return positionRatings;
}

export function getPlayerPositionFamiliarityRatings(
  player: Player,
  sorted?: boolean,
  stats?: PlayerStats,
  isCaptain: boolean = false,
  captainPosition: string = ''
) {
  const playerPrimaryPosition = player.metadata.positions[0];
  const playerSecondaryPositions = player.metadata.positions.slice(1);

  const positionRatings = positionalFamiliarity.map(
    ({ primaryPosition, adjustment }) => {
      const adjustedStats: PlayerStats = stats
        ? { ...stats }
        : { ...player.metadata };

      const isSecondaryPosition =
        playerSecondaryPositions.includes(primaryPosition);

      const ratingAdjustment = isSecondaryPosition
        ? -1
        : adjustment[playerPrimaryPosition as keyof typeof adjustment];

      const { weighting } = attributeWeighting.find((w) =>
        w.positions.includes(primaryPosition)
      )!;

      Object.keys(adjustedStats).forEach((key) => {
        const statKey = key as keyof PlayerStats;
        adjustedStats[statKey] = +adjustedStats[statKey] + ratingAdjustment;
      });

      if (isCaptain) {
        Object.keys(adjustedStats).forEach((key) => {
          const statKey = key as keyof PlayerStats;
          adjustedStats[statKey] = +adjustedStats[statKey] + 2;
        });
      } else {
        if (captainPosition) {
          const boost = captainBoost.find((boost) =>
            boost.positions.includes(captainPosition)
          )!;
          Object.keys(boost.adjustment).forEach((key) => {
            const statKey = key as keyof PlayerStats;
            adjustedStats[statKey] =
              +adjustedStats[statKey] + boost.adjustment[statKey];
          });
        }
      }

      const {
        passing,
        shooting,
        defense,
        dribbling,
        pace,
        physical,
        goalkeeping = 0,
      } = adjustedStats;

      const rating = Math.round(
        passing * weighting[0] +
          shooting * weighting[1] +
          defense * weighting[2] +
          dribbling * weighting[3] +
          pace * weighting[4] +
          physical * weighting[5] +
          goalkeeping * weighting[6]
      );

      return {
        position: primaryPosition,
        rating,
        difference: rating - player.metadata.overall,
      };
    }
  );

  if (sorted) return positionRatings.sort((a, b) => b.rating - a.rating);

  return positionRatings;
}

export function isPositiveInteger(number: number) {
  const isInteger = Number.isInteger(number);
  const isPositive = number > 0;

  return isInteger && isPositive;
}
