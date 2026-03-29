/**
 * Aggregate transactions into monthly buckets for the analytics bar chart.
 * Pure computation — no React dependencies.
 */

import type { Transaction } from '../types/transaction';
import type { AnalyticsSummary, MonthlyAggregate } from '../types/analytics';
import { isSpending, isRefund } from './spendingSummary';

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

function buildEmptyMonths(): MonthlyAggregate[] {
  const now = new Date();
  const months: MonthlyAggregate[] = [];

  for (let i = 11; i >= 0; i--) {
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

/**
 * Compute a 12-month spending trend from raw transactions.
 * Optionally filter to a single category.
 */
export function computeAnalyticsSummary(
  transactions: Transaction[],
  categoryFilter: string | null,
): AnalyticsSummary | null {
  if (transactions.length === 0) return null;

  const months = buildEmptyMonths();
  const monthMap = new Map<string, MonthlyAggregate>();
  for (const m of months) {
    monthMap.set(monthKey(m.year, m.month), m);
  }

  for (const tx of transactions) {
    // Subtract refunds from the month they occurred in
    if (isRefund(tx)) {
      const [yearStr, monthStr] = tx.date.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1;
      const key = monthKey(year, month);
      const bucket = monthMap.get(key);

      if (bucket) {
        bucket.total -= Math.abs(parseFloat(tx.amount));
      }
    }

    if (!isSpending(tx)) continue;

    if (categoryFilter) {
      const txCategory = (tx.category ?? '').toLowerCase().trim();
      const filterLower = categoryFilter.toLowerCase().trim();
      // "General" maps to empty/missing category
      const isGeneralFilter = filterLower === 'general';
      const isGeneralTx = txCategory === '' || txCategory === 'general';

      if (isGeneralFilter ? !isGeneralTx : txCategory !== filterLower) continue;
    }

    const [yearStr, monthStr] = tx.date.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed
    const key = monthKey(year, month);
    const bucket = monthMap.get(key);

    if (bucket) {
      bucket.total += parseFloat(tx.amount);
    }
  }

  // Round totals
  for (const m of months) {
    m.total = Math.round(m.total * 100) / 100;
  }

  const twelveMonthTotal = months.reduce((sum, m) => sum + m.total, 0);
  const monthsWithData = months.filter((m) => m.total > 0);
  const monthlyAverage = monthsWithData.length > 0
    ? Math.round((twelveMonthTotal / monthsWithData.length) * 100) / 100
    : 0;

  const highestMonth = months.reduce((max, m) => (m.total > max.total ? m : max), months[0]);
  const lowestMonth = months.reduce((min, m) => (m.total < min.total ? m : min), months[0]);

  return {
    twelveMonthTotal: Math.round(twelveMonthTotal * 100) / 100,
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

    const raw = (tx.category ?? '').trim();
    const name = raw === '' ? 'General' : raw.split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');

    totals.set(name, (totals.get(name) ?? 0) + parseFloat(tx.amount));
  }

  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
}
