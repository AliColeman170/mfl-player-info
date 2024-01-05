import {
  attributeWeighting,
  captainBoost,
  positionalFamiliarity,
} from "@/config";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface PlayerStats {
  pace: number;
  dribbling: number;
  passing: number;
  shooting: number;
  defense: number;
  physical: number;
}

export const positionOrderArray = [
  "GK",
  "RB",
  "LB",
  "CB",
  "RWB",
  "LWB",
  "CDM",
  "RM",
  "LM",
  "CM",
  "CAM",
  "RW",
  "LW",
  "CF",
  "ST",
];

export function getRarityClassNames(rating) {
  if (rating >= 85) return "bg-[#ca1afc] text-white";
  if (rating >= 75) return "bg-[#016bd5] text-white";
  if (rating >= 65) return "bg-[#35ae25] text-white";
  return "bg-slate-200 text-slate-900";
}

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getPlayerPositionRatings(
  player,
  sorted?: boolean,
  stats?: PlayerStats,
  isCaptain: boolean = false,
  captainPosition: string = ""
) {
  const positionRatings = attributeWeighting.map(({ positions, weighting }) => {
    const adjustedStats = stats ? { ...stats } : { ...player.metadata };

    if (isCaptain) {
      Object.keys(adjustedStats).forEach(function (key, index) {
        adjustedStats[key] = +adjustedStats[key] + 2;
      });
    } else {
      if (captainPosition) {
        const boost = captainBoost.find((boost) =>
          boost.positions.includes(captainPosition)
        );
        Object.keys(boost.adjustment).forEach(function (key, index) {
          adjustedStats[key] = +adjustedStats[key] + boost.adjustment[key];
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
      positions,
      rating,
      difference: rating - player.metadata.overall,
    };
  });

  if (sorted) return positionRatings.sort((a, b) => b.rating - a.rating);

  return positionRatings;
}

export function getPlayerPositionFamiliarityRatings(
  player,
  sorted?: boolean,
  stats?: PlayerStats,
  isCaptain: boolean = false,
  captainPosition: string = ""
) {
  const playerPrimaryPosition = player.metadata.positions[0];
  const playerSecondaryPositions = player.metadata.positions.slice(1);

  const positionRatings = positionalFamiliarity.map(
    ({ primaryPosition, adjustment }) => {
      const adjustedStats = stats ? { ...stats } : { ...player.metadata };

      const isSecondaryPosition =
        playerSecondaryPositions.includes(primaryPosition);

      const ratingAdjustment = isSecondaryPosition
        ? -1
        : adjustment[playerPrimaryPosition];

      const { weighting } = attributeWeighting.find((w) =>
        w.positions.includes(primaryPosition)
      );

      Object.keys(adjustedStats).forEach(function (key, index) {
        adjustedStats[key] = +adjustedStats[key] + ratingAdjustment;
      });

      if (isCaptain) {
        Object.keys(adjustedStats).forEach(function (key, index) {
          adjustedStats[key] = +adjustedStats[key] + 2;
        });
      } else {
        if (captainPosition) {
          const boost = captainBoost.find((boost) =>
            boost.positions.includes(captainPosition)
          );
          Object.keys(boost.adjustment).forEach(function (key, index) {
            adjustedStats[key] = +adjustedStats[key] + boost.adjustment[key];
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

export function findByTemplate(objects, template) {
  return (
    objects?.filter((obj) => {
      return Object.keys(template).every(
        (propertyName) => obj[propertyName] === template[propertyName]
      );
    }) || []
  );
}
