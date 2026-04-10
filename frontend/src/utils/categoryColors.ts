// Category color palette — ordered for max adjacent contrast in charts.
// Gold is reserved for uncategorized. Colors are assigned by name hash
// so the same category always gets the same color across all pages.

const CATEGORY_COLORS = [
  '#9333EA', // 1.  Purple (brand primary)
  '#10B981', // 2.  Emerald
  '#F43F5E', // 3.  Rose
  '#0EA5E9', // 4.  Sky
  '#F97316', // 5.  Coral
  '#14B8A6', // 6.  Teal
  '#D946EF', // 7.  Fuchsia
  '#84CC16', // 8.  Lime
  '#3B82F6', // 9.  Blue
  '#DC2626', // 10. Crimson
  '#06B6D4', // 11. Cyan
  '#E67E22', // 12. Amber
  '#6366F1', // 13. Indigo
  '#22C55E', // 14. Green
  '#EC4899', // 15. Pink
  '#65A30D', // 16. Olive
  '#818CF8', // 17. Slate Blue
  '#EF4444', // 18. Red
  '#16A34A', // 19. Warm Green
  '#7C3AED', // 20. Violet
  '#B45309', // 21. Bronze
  '#64748B', // 22. Steel
  '#475569', // 23. Graphite
] as const;

const UNCATEGORIZED_COLOR = '#F59E0B'; // Brand gold — exclusive to uncategorized

/** Simple string hash → stable index into the color palette. */
function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Returns a deterministic color for a spending category.
 * If userCategories is provided, user-defined colors take precedence over hash-based ones.
 */
export function getCategoryColor(
  name: string,
  userCategories?: readonly { name: string; color: string }[],
): string {
  if (userCategories) {
    const match = userCategories.find(
      (uc) => uc.name.toLowerCase() === name.toLowerCase(),
    );
    if (match) return match.color;
  }
  if (name === 'General') return UNCATEGORIZED_COLOR;
  return CATEGORY_COLORS[hashName(name) % CATEGORY_COLORS.length];
}
