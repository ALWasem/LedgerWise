import { useMemo } from 'react';
import { useTransactionData } from '../../contexts/TransactionDataContext';
import { computeAnalyticsSummary, extractCategories } from './utils/analyticsAggregation';
import type { AnalyticsSummary, AnalyticsTimePeriod } from '../../types/analytics';

interface AnalyticsData {
  summary: AnalyticsSummary | null;
  categories: string[];
  loading: boolean;
}

export function useAnalyticsData(
  selectedCategory: string | null,
  timePeriod: AnalyticsTimePeriod = '12m',
): AnalyticsData {
  const { allTransactions, transactionsLoading } = useTransactionData();

  const summary = useMemo(
    () => computeAnalyticsSummary(allTransactions, selectedCategory, timePeriod),
    [allTransactions, selectedCategory, timePeriod],
  );

  const categories = useMemo(
    () => extractCategories(allTransactions),
    [allTransactions],
  );

  return { summary, categories, loading: transactionsLoading };
}
