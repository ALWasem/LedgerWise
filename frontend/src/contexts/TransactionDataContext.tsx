import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  clearApiCache,
  fetchAccounts,
  fetchCategories,
  fetchTransactions,
  UnauthorizedError,
} from '../api/client';
import { supabase } from '../api/supabase';
import { computeSpendingSummary } from '../features/spending/utils/spendingSummary';
import type { TimePeriod } from '../components/TimePeriodSelector';
import type { Account } from '../types/account';
import type { UserCategory } from '../types/categorize';
import type { Transaction } from '../types/transaction';

const DEFAULT_PERIOD: TimePeriod = {
  type: 'month',
  month: new Date().getMonth(),
  year: new Date().getFullYear(),
};

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
  updateTransactionLocally: (transactionId: string, updates: Partial<Transaction>) => void;
  selectedPeriod: TimePeriod;
  setSelectedPeriod: (period: TimePeriod) => void;
  highlightCategory: string | null;
  setHighlightCategory: (category: string | null) => void;
  userCategories: UserCategory[];
  setUserCategories: React.Dispatch<React.SetStateAction<UserCategory[]>>;
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
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(DEFAULT_PERIOD);
  const [highlightCategory, setHighlightCategory] = useState<string | null>(null);
  const [userCategories, setUserCategories] = useState<UserCategory[]>([]);

  const refresh = useCallback(() => {
    clearApiCache();
    setAllTransactions([]);
    setRefreshKey((k) => k + 1);
  }, []);

  const updateTransactionLocally = useCallback(
    (transactionId: string, updates: Partial<Transaction>) => {
      setAllTransactions((prev) =>
        prev.map((tx) => (tx.id === transactionId ? { ...tx, ...updates } : tx)),
      );
    },
    [],
  );

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

  // Fetch user-defined categories (for color overrides across all pages)
  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchCategories(token)
      .then((cats) => {
        if (!cancelled) setUserCategories(cats);
      })
      .catch(() => {
        // Categories are an optional enhancement — silent fail
      });
    return () => { cancelled = true; };
  }, [token, refreshKey]);

  // Auto-select the most recent month with data on first load
  const hasAutoSelected = useRef(false);
  useEffect(() => {
    if (hasAutoSelected.current || allTransactions.length === 0) return;
    hasAutoSelected.current = true;

    // Find the most recent transaction date
    let latestDate = allTransactions[0].date;
    for (const tx of allTransactions) {
      if (tx.date > latestDate) latestDate = tx.date;
    }

    const latestYear = parseInt(latestDate.substring(0, 4), 10);
    const latestMonth = parseInt(latestDate.substring(5, 7), 10) - 1; // 0-indexed

    // Only update if different from current default
    if (latestYear !== selectedPeriod.year || latestMonth !== selectedPeriod.month) {
      setSelectedPeriod({ type: 'month', month: latestMonth, year: latestYear });
    }
  }, [allTransactions]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(
    () => ({
      accounts,
      allTransactions,
      hasAccounts,
      accountsLoading,
      transactionsLoading,
      error,
      refresh,
      updateTransactionLocally,
      selectedPeriod,
      setSelectedPeriod,
      highlightCategory,
      setHighlightCategory,
      userCategories,
      setUserCategories,
    }),
    [accounts, allTransactions, hasAccounts, accountsLoading, transactionsLoading, error, refresh, updateTransactionLocally, selectedPeriod, setSelectedPeriod, highlightCategory, setHighlightCategory, userCategories, setUserCategories],
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
