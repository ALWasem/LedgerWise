import { useCallback, useEffect, useState } from 'react';
import {
  fetchAccounts,
  fetchTransactions,
  fetchSpendingSummary,
  UnauthorizedError,
} from '../api/client';
import { supabase } from '../api/supabase';
import type { Account } from '../types/account';
import type { SpendingSummaryData } from '../types/spending';
import type { Transaction } from '../types/transaction';

interface DateRange {
  startDate?: string;
  endDate?: string;
}

interface UseTransactionsReturn {
  transactions: Transaction[];
  accounts: Account[];
  loading: boolean;
  error: string | null;
  hasAccounts: boolean;
  summaryData: SpendingSummaryData | null;
  summaryLoading: boolean;
  refresh: () => void;
}

export function useTransactions(
  token: string | null,
  dateRange?: DateRange,
): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAccounts, setHasAccounts] = useState(false);
  const [summaryData, setSummaryData] = useState<SpendingSummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const accts = await fetchAccounts(token!);
        if (cancelled) return;

        setAccounts(accts);
        setHasAccounts(accts.length > 0);

        if (accts.length === 0) {
          setLoading(false);
          return;
        }

        setSummaryLoading(true);
        const [txns, summary] = await Promise.allSettled([
          fetchTransactions(token!, dateRange?.startDate, dateRange?.endDate),
          fetchSpendingSummary(token!, dateRange?.startDate, dateRange?.endDate),
        ]);
        if (cancelled) return;

        if (txns.status === 'fulfilled') {
          setTransactions(txns.value);
        } else {
          setError(
            txns.reason instanceof Error
              ? txns.reason.message
              : 'Failed to load transactions',
          );
        }

        if (summary.status === 'fulfilled') {
          setSummaryData(summary.value);
        } else {
          console.warn('Failed to load spending summary:', summary.reason);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof UnauthorizedError) {
            await supabase.auth.signOut();
            return;
          }
          setError(
            err instanceof Error ? err.message : 'Failed to load accounts',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setSummaryLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [token, refreshKey, dateRange?.startDate, dateRange?.endDate]);

  return {
    transactions,
    accounts,
    loading,
    error,
    hasAccounts,
    summaryData,
    summaryLoading,
    refresh,
  };
}
