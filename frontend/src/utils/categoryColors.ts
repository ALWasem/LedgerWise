// Canonical 24-color palette for user-assignable category colors.
// This file is the single source of truth — no category color hex values
// should be hardcoded anywhere else in the frontend.

export const CATEGORY_COLORS = [
  // Warm → cool → purple/pink, neutrals last (rainbow hue order)
  { id: 1, name: 'Red', hex: '#EF4444' },
  { id: 2, name: 'Orange', hex: '#F97316' },
  { id: 20, name: 'Tangerine', hex: '#FB923C' },
  { id: 15, name: 'Yellow', hex: '#EAB308' },
  { id: 14, name: 'Lime', hex: '#84CC16' },
  { id: 22, name: 'Mint', hex: '#4ADE80' },
  { id: 13, name: 'Green', hex: '#22C55E' },
  { id: 12, name: 'Emerald', hex: '#10B981' },
  { id: 24, name: 'Aqua', hex: '#2DD4BF' },
  { id: 11, name: 'Teal', hex: '#14B8A6' },
  { id: 10, name: 'Cyan', hex: '#06B6D4' },
  { id: 21, name: 'Light Blue', hex: '#38BDF8' },
  { id: 9, name: 'Sky', hex: '#0EA5E9' },
  { id: 8, name: 'Blue', hex: '#3B82F6' },
  { id: 7, name: 'Indigo', hex: '#6366F1' },
  { id: 19, name: 'Lavender', hex: '#A78BFA' },
  { id: 6, name: 'Violet', hex: '#8B5CF6' },
  { id: 5, name: 'Fuchsia', hex: '#D946EF' },
  { id: 4, name: 'Pink', hex: '#EC4899' },
  { id: 3, name: 'Rose', hex: '#F43F5E' },
  { id: 23, name: 'Coral', hex: '#FB7185' },
  { id: 16, name: 'Stone', hex: '#78716C' },
  { id: 17, name: 'Gray', hex: '#6B7280' },
  { id: 18, name: 'Slate', hex: '#64748B' },
] as const;

export type CategoryColor = (typeof CATEGORY_COLORS)[number];

/** Brand colors — reserved for UI elements, never assignable to categories. */
const BRAND_COLORS = {
  purple: '#9333EA',
  purpleLight: '#A855F7',
  gold: '#F59E0B',
} as const;

// --- Lookup helpers ---

/** Get the hex string for a color_id. Used everywhere we render a category color. */
export function getCategoryColorHex(colorId: number): string | undefined {
  return CATEGORY_COLORS.find((c) => c.id === colorId)?.hex;
}

/** Return the first color not in use — for auto-selecting on new category creation. */
export function getFirstAvailableColor(takenColorIds: number[]): CategoryColor | undefined {
  const taken = new Set(takenColorIds);
  return CATEGORY_COLORS.find((c) => !taken.has(c.id));
}

// --- Hash-based fallback ---
// Used for display only: categories from transaction data that don't have
// a user-assigned color_id yet (e.g. Teller/Plaid-provided categories).

const UNCATEGORIZED_COLOR = BRAND_COLORS.gold;

/** Simple string hash → stable index into the color palette. */
function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Hash a category name to a color_id (1-24). Display-only fallback. */
export function hashCategoryColorId(name: string): number {
  return (hashName(name) % CATEGORY_COLORS.length) + 1;
}

/**
 * Resolve the display hex color for a category.
 * Priority: user-defined color_id > hash-based fallback > uncategorized gold.
 */
export function getCategoryColor(
  name: string,
  userCategories?: readonly { name: string; color_id: number }[],
): string {
  if (userCategories) {
    const match = userCategories.find(
      (uc) => uc.name.toLowerCase() === name.toLowerCase(),
    );
    if (match) return getCategoryColorHex(match.color_id) ?? UNCATEGORIZED_COLOR;
  }
  if (name === 'General') return UNCATEGORIZED_COLOR;
  const fallbackId = hashCategoryColorId(name);
  return getCategoryColorHex(fallbackId) ?? UNCATEGORIZED_COLOR;
}
