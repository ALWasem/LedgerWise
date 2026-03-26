import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  clearApiCache,
  fetchAccounts,
  fetchTransactions,
  UnauthorizedError,
} from '../api/client';
import { supabase } from '../api/supabase';
import { computeSpendingSummary } from '../utils/spendingSummary';
import type { Account } from '../types/account';
import type { SpendingSummaryData } from '../types/spending';
import type { Transaction } from '../types/transaction';

interface DateRange {
  startDate?: string;
  endDate?: string;
}

interface TransactionDataContextValue {
  accounts: Account[];
  allTransactions: Transaction[];
  hasAccounts: boolean;
  accountsLoading: boolean;
  transactionsLoading: boolean;
  error: string | null;
  refresh: () => void;
}

const TransactionDataContext = createContext<TransactionDataContextValue | null>(null);

interface ProviderProps {
  token: string | null;
  children: ReactNode;
}

export function TransactionDataProvider({ token, children }: ProviderProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [hasAccounts, setHasAccounts] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    clearApiCache();
    setAllTransactions([]);
    setRefreshKey((k) => k + 1);
  }, []);

  // Fetch accounts once
  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setAccountsLoading(true);
    setError(null);

    async function loadAccounts() {
      try {
        const accts = await fetchAccounts(token!);
        if (cancelled) return;
        setAccounts(accts);
        setHasAccounts(accts.length > 0);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof UnauthorizedError) {
          await supabase.auth.signOut();
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load accounts');
      } finally {
        if (!cancelled) setAccountsLoading(false);
      }
    }

    void loadAccounts();
    return () => { cancelled = true; };
  }, [token, refreshKey]);

  // Fetch ALL transactions once (after accounts are loaded)
  useEffect(() => {
    if (!token || !hasAccounts) return;

    let cancelled = false;
    setTransactionsLoading(true);

    async function loadTransactions() {
      try {
        const txns = await fetchTransactions(token!);
        if (cancelled) return;
        setAllTransactions(txns);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof UnauthorizedError) {
          await supabase.auth.signOut();
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load transactions');
      } finally {
        if (!cancelled) setTransactionsLoading(false);
      }
    }

    void loadTransactions();
    return () => { cancelled = true; };
  }, [token, hasAccounts, refreshKey]);

  const value = useMemo(
    () => ({
      accounts,
      allTransactions,
      hasAccounts,
      accountsLoading,
      transactionsLoading,
      error,
      refresh,
    }),
    [accounts, allTransactions, hasAccounts, accountsLoading, transactionsLoading, error, refresh],
  );

  return (
    <TransactionDataContext.Provider value={value}>
      {children}
    </TransactionDataContext.Provider>
  );
}

export function useTransactionData() {
  const ctx = useContext(TransactionDataContext);
  if (!ctx) {
    throw new Error('useTransactionData must be used within TransactionDataProvider');
  }
  return ctx;
}

/** Filter transactions by date range and compute spending summary — pure client-side, instant. */
export function useDataSlice(dateRange?: DateRange) {
  const { allTransactions, transactionsLoading } = useTransactionData();

  return useMemo(() => {
    const filtered = filterByDateRange(allTransactions, dateRange);
    const summaryData = allTransactions.length > 0
      ? computeSpendingSummary(filtered)
      : null;

    return {
      transactions: filtered,
      summaryData,
      loading: transactionsLoading,
    };
  }, [allTransactions, dateRange?.startDate, dateRange?.endDate, transactionsLoading]);
}

function filterByDateRange(
  transactions: Transaction[],
  dateRange?: DateRange,
): Transaction[] {
  if (!dateRange?.startDate && !dateRange?.endDate) return transactions;

  return transactions.filter((tx) => {
    if (dateRange.startDate && tx.date < dateRange.startDate) return false;
    if (dateRange.endDate && tx.date > dateRange.endDate) return false;
    return true;
  });
}
