/** Normalizes a category string to title case. Returns 'General' for empty/null values. */
export function normalizeCategory(category: string | null | undefined): string {
  if (!category || category.trim() === '') return 'General';
  return category
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}
