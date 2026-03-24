const CATEGORY_COLORS = [
  '#F59E0B', // amber (General / Uncategorized)
  '#10B981', // green (Groceries)
  '#EF4444', // red (Restaurants & Dining)
  '#3B82F6', // blue (Transportation)
  '#8B5CF6', // purple (Entertainment)
  '#EC4899', // pink (Shopping)
  '#06B6D4', // cyan (Utilities & Bills)
  '#84CC16', // lime
];

const UNCATEGORIZED_COLOR = '#F59E0B';

export function getCategoryColor(name: string, index: number): string {
  if (name === 'General') return UNCATEGORIZED_COLOR;
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}
