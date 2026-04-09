/**
 * Aggregate transactions into monthly buckets for the analytics bar chart.
 * Pure computation — no React dependencies.
 */

import type { Transaction } from '../../../types/transaction';
import type { AnalyticsSummary, AnalyticsTimePeriod, MonthlyAggregate } from '../../../types/analytics';
import { isSpending, isRefund } from '../../../utils/transactionFilters';
import { normalizeCategory } from '../../../utils/normalizeCategory';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

function buildMonthsForPeriod(
  period: AnalyticsTimePeriod,
  transactions: Transaction[],
): MonthlyAggregate[] {
  const now = new Date();
  const months: MonthlyAggregate[] = [];

  if (period === 'ytd') {
    // January of current year through current month
    for (let m = 0; m <= now.getMonth(); m++) {
      months.push({
        year: now.getFullYear(),
        month: m,
        label: MONTH_LABELS[m],
        total: 0,
      });
    }
    return months;
  }

  if (period === 'all') {
    // Find earliest transaction date, build months from there
    let earliest = now;
    for (const tx of transactions) {
      const txDate = new Date(tx.date);
      if (txDate < earliest) earliest = txDate;
    }
    const startYear = earliest.getFullYear();
    const startMonth = earliest.getMonth();
    const endYear = now.getFullYear();
    const endMonth = now.getMonth();

    let y = startYear;
    let m = startMonth;
    while (y < endYear || (y === endYear && m <= endMonth)) {
      months.push({
        year: y,
        month: m,
        label: MONTH_LABELS[m],
        total: 0,
      });
      m++;
      if (m > 11) { m = 0; y++; }
    }
    return months;
  }

  // '6m' or '12m'
  const count = period === '6m' ? 6 : 12;
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: MONTH_LABELS[d.getMonth()],
      total: 0,
    });
  }

  return months;
}

function monthKey(year: number, month: number): string {
  return `${year}-${month}`;
}

/** Parse a YYYY-MM-DD date string into { year, month } (0-indexed month). */
function parseTxMonth(dateStr: string): { year: number; month: number } {
  const [yearStr, monthStr] = dateStr.split('-');
  return { year: parseInt(yearStr, 10), month: parseInt(monthStr, 10) - 1 };
}

/**
 * Compute a spending trend from raw transactions for the given time period.
 * Optionally filter to a single category.
 */
export function computeAnalyticsSummary(
  transactions: Transaction[],
  categoryFilter: string | null,
  period: AnalyticsTimePeriod = '12m',
): AnalyticsSummary | null {
  if (transactions.length === 0) return null;

  const months = buildMonthsForPeriod(period, transactions);
  const monthMap = new Map<string, MonthlyAggregate>();
  for (const m of months) {
    monthMap.set(monthKey(m.year, m.month), m);
  }

  const filterLower = categoryFilter?.toLowerCase().trim() ?? null;
  const isGeneralFilter = filterLower === 'general';

  const matchesCategory = (tx: Transaction): boolean => {
    if (!filterLower) return true;
    const txCategory = (tx.category ?? '').toLowerCase().trim();
    const isGeneralTx = txCategory === '' || txCategory === 'general';
    return isGeneralFilter ? isGeneralTx : txCategory === filterLower;
  };

  for (const tx of transactions) {
    if (!matchesCategory(tx)) continue;

    const { year, month } = parseTxMonth(tx.date);
    const bucket = monthMap.get(monthKey(year, month));
    if (!bucket) continue;

    if (isRefund(tx)) {
      bucket.total -= Math.abs(parseFloat(tx.amount));
    } else if (isSpending(tx)) {
      bucket.total += parseFloat(tx.amount);
    }
  }

  // Round totals and clamp to zero (refunds can't make a month negative)
  for (const m of months) {
    m.total = Math.max(0, Math.round(m.total * 100) / 100);
  }

  const periodTotal = months.reduce((sum, m) => sum + m.total, 0);
  const monthsWithData = months.filter((m) => m.total > 0);
  const monthlyAverage = monthsWithData.length > 0
    ? Math.round((periodTotal / monthsWithData.length) * 100) / 100
    : 0;

  const highestMonth = months.reduce((max, m) => (m.total > max.total ? m : max), months[0]);
  const lowestMonth = months.reduce((min, m) => (m.total < min.total ? m : min), months[0]);

  return {
    periodTotal: Math.round(periodTotal * 100) / 100,
    monthlyAverage,
    highestMonth,
    lowestMonth,
    months,
  };
}

/**
 * Extract unique spending category names from transactions, sorted by total spend.
 */
export function extractCategories(transactions: Transaction[]): string[] {
  const totals = new Map<string, number>();

  for (const tx of transactions) {
    if (!isSpending(tx)) continue;

    const name = normalizeCategory(tx.category);

    totals.set(name, (totals.get(name) ?? 0) + parseFloat(tx.amount));
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
}
