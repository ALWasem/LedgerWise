/** Format a number as USD currency string (e.g. "$1,234.56"). */
export function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Parse a "YYYY-MM-DD" string as local time and format it.
 * The `T00:00:00` suffix prevents timezone-shift issues with Date.parse.
 */
export function formatLocalDate(
  iso: string,
  options?: { includeYear?: boolean },
): string {
  const date = new Date(iso + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(options?.includeYear ? { year: 'numeric' } : {}),
  });
}
