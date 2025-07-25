export type TierName =
  | 'common'
  | 'limited'
  | 'uncommon'
  | 'rare'
  | 'legendary'
  | 'ultimate';

export interface TierColors {
  name: TierName;
  light: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
    border: string;
  };
  dark: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
    border: string;
  };
}

export function getTierFromOverall(overall: number): TierColors {
  if (overall >= 95) {
    return {
      name: 'ultimate',
      light: {
        primary: '#0d7377',
        secondary: '#14a085',
        text: '#0d7377',
        background: '#f0fdfc',
        border: '#5eead4',
      },
      dark: {
        primary: '#83ebe2',
        secondary: '#7dd1ca',
        text: '#d9ece7',
        background: '#042f2e',
        border: '#134e4a',
      },
    };
  } else if (overall >= 85) {
    return {
      name: 'legendary',
      light: {
        primary: '#7c2d92',
        secondary: '#a855f7',
        text: '#7c2d92',
        background: '#faf5ff',
        border: '#c084fc',
      },
      dark: {
        primary: '#b137f1',
        secondary: '#e63df8',
        text: '#d6d6d6',
        background: '#2e1065',
        border: '#6b21a8',
      },
    };
  } else if (overall >= 75) {
    return {
      name: 'rare',
      light: {
        primary: '#1d4ed8',
        secondary: '#3b82f6',
        text: '#1d4ed8',
        background: '#eff6ff',
        border: '#93c5fd',
      },
      dark: {
        primary: '#1f8eff',
        secondary: '#3992ff',
        text: '#97e5ff',
        background: '#1e3a8a',
        border: '#3b82f6',
      },
    };
  } else if (overall >= 65) {
    return {
      name: 'uncommon',
      light: {
        primary: '#16a34a',
        secondary: '#22c55e',
        text: '#16a34a',
        background: '#f0fdf4',
        border: '#86efac',
      },
      dark: {
        primary: '#38ff7a',
        secondary: '#37cb6f',
        text: '#bfffd9',
        background: '#14532d',
        border: '#16a34a',
      },
    };
  } else if (overall >= 55) {
    return {
      name: 'limited',
      light: {
        primary: '#a16207',
        secondary: '#ca8a04',
        text: '#a16207',
        background: '#fffbeb',
        border: '#fcd34d',
      },
      dark: {
        primary: '#ecd27e',
        secondary: '#cdb66b',
        text: '#d6d6d6',
        background: '#451a03',
        border: '#a16207',
      },
    };
  } else {
    return {
      name: 'common',
      light: {
        primary: '#374151',
        secondary: '#6b7280',
        text: '#374151',
        background: '#f9fafb',
        border: '#d1d5db',
      },
      dark: {
        primary: '#ffffff',
        secondary: '#cecece',
        text: '#ffffff',
        background: '#111827',
        border: '#374151',
      },
    };
  }
}

// Static Tailwind classes for each tier (Tailwind can detect these at compile time)
const TIER_CLASSES = {
  common:
    'text-[var(--tier-common-foreground)] bg-[var(--tier-common)] border-[var(--tier-common-foreground)]/15',
  limited:
    'text-[var(--tier-limited-foreground)] bg-[var(--tier-limited)] border-[var(--tier-common-foreground)]/15',
  uncommon:
    'text-[var(--tier-uncommon-foreground)] bg-[var(--tier-uncommon)] border-[var(--tier-common-foreground)]/15',
  rare: 'text-[var(--tier-rare-foreground)] bg-[var(--tier-rare)] border-[var(--tier-common-foreground)]/15',
  legendary:
    'text-[var(--tier-legendary-foreground)] bg-[var(--tier-legendary)] border-[var(--tier-common-foreground)]/15',
  ultimate:
    'text-[var(--tier-ultimate-foreground)] bg-[var(--tier-ultimate)] border-[var(--tier-common-foreground)]/15',
} as const;

const TIER_TEXT_CLASSES = {
  common: 'text-[var(--tier-common)]',
  limited: 'text-[var(--tier-limited)]',
  uncommon: 'text-[var(--tier-uncommon)]',
  rare: 'text-[var(--tier-rare)]',
  legendary: 'text-[var(--tier-legendary)]',
  ultimate: 'text-[var(--tier-ultimate)]',
} as const;

// Get predefined Tailwind classes
export function getTierClasses(tier: TierColors): string {
  return TIER_CLASSES[tier.name];
}

// Text color only using predefined Tailwind classes
export function getTierTextClasses(tier: TierColors): string {
  return TIER_TEXT_CLASSES[tier.name];
}

// Convenience functions that return Tailwind classes
export function getTierColor(overall: number): string {
  const tier = getTierFromOverall(overall);
  return getTierClasses(tier);
}

export function getTierTextColor(overall: number): string {
  const tier = getTierFromOverall(overall);
  return getTierTextClasses(tier);
}

// Get just the CSS variable name if needed
export function getTierCSSVariable(overall: number): string {
  const tier = getTierFromOverall(overall);
  return `var(--tier-${tier.name})`;
}
