/**
 * Client-side spending summary computation.
 * Mirrors backend logic in backend/app/services/spending.py.
 */

import { isSpending, isRefund } from '../../../utils/transactionFilters';
import { normalizeCategory } from '../../../utils/normalizeCategory';
import type { Transaction } from '../../../types/transaction';
import type { SpendingSummaryData, CategoryData } from '../../../types/spending';

export function computeSpendingSummary(
  transactions: Transaction[],
): SpendingSummaryData {
  const categoryMap = new Map<string, { total: number; count: number }>();
  let refundTotal = 0;
  let refundCount = 0;

  for (const tx of transactions) {
    if (isRefund(tx)) {
      refundTotal += Math.abs(parseFloat(tx.amount));
      refundCount++;
    }

    if (!isSpending(tx)) continue;

    const name = normalizeCategory(tx.category);
    const existing = categoryMap.get(name);
    const amount = parseFloat(tx.amount);

    if (existing) {
      existing.total += amount;
      existing.count++;
    } else {
      categoryMap.set(name, { total: amount, count: 1 });
    }
  }

  const totalSpent = [...categoryMap.values()].reduce((s, c) => s + c.total, 0);
  const transactionCount = [...categoryMap.values()].reduce((s, c) => s + c.count, 0);

  const categories: CategoryData[] = [...categoryMap.entries()]
    .map(([name, { total, count }]) => ({
      name,
      total: Math.round(total * 100) / 100,
      count,
      percentage: totalSpent > 0 ? Math.round((total / totalSpent) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total);

  const general = categories.find((c) => c.name === 'General');

  return {
    total_spent: Math.round((totalSpent - refundTotal) * 100) / 100,
    transaction_count: transactionCount,
    category_count: categories.length,
    categories,
    uncategorized_count: general?.count ?? 0,
    uncategorized_percentage: general?.percentage ?? 0,
    refund_total: Math.round(refundTotal * 100) / 100,
    refund_count: refundCount,
  };
}
