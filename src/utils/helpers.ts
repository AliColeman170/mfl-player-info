import { attributeWeighting } from "@/config";
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
  stats?: PlayerStats
) {
  const positionRatings = attributeWeighting.map(({ positions, weighting }) => {
    const {
      passing,
      shooting,
      defense,
      dribbling,
      pace,
      physical,
      goalkeeping = 0,
    } = stats || player.metadata;

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

export function findByTemplate(objects, template) {
  return (
    objects?.filter((obj) => {
      return Object.keys(template).every(
        (propertyName) => obj[propertyName] === template[propertyName]
      );
    }) || []
  );
}
