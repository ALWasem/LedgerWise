import { useCallback, useMemo, useState } from 'react';
import { useTransactionData } from '../../contexts/TransactionDataContext';
import { useAuth } from '../../contexts/AuthContext';
import { updateTransactionCategory } from '../../api/client';
import { isSpending } from '../../utils/transactionFilters';
import { getCategoryColor } from '../../utils/categoryColors';
import { normalizeCategory } from './utils/normalizeCategory';
import type { Transaction } from '../../types/transaction';
import type { CategoryInfo } from '../../types/categorize';

export default function useCategorizeData() {
  const { allTransactions, transactionsLoading, updateTransactionLocally } = useTransactionData();
  const { session } = useAuth();
  const token = session?.access_token ?? null;

  // Track locally reassigned transaction IDs for optimistic UI
  const [reassigned, setReassigned] = useState<Map<string, string>>(new Map());

  const spendingTransactions = useMemo(
    () => allTransactions.filter(isSpending),
    [allTransactions],
  );

  const uncategorized = useMemo(
    () =>
      spendingTransactions.filter(
        (tx) => normalizeCategory(tx.category) === 'General' && !reassigned.has(tx.id),
      ),
    [spendingTransactions, reassigned],
  );

  const { categories, totalSpendingAmount } = useMemo(() => {
    const catMap = new Map<string, { count: number; totalAmount: number; lastTx?: Transaction }>();

    for (const tx of spendingTransactions) {
      const name = reassigned.has(tx.id)
        ? reassigned.get(tx.id)!
        : normalizeCategory(tx.category);

      if (name === 'General') continue;

      const existing = catMap.get(name);
      const txAmount = Math.abs(parseFloat(tx.amount));
      const txDate = tx.date;

      if (existing) {
        existing.count += 1;
        existing.totalAmount += txAmount;
        if (!existing.lastTx || txDate > existing.lastTx.date) {
          existing.lastTx = tx;
        }
      } else {
        catMap.set(name, { count: 1, totalAmount: txAmount, lastTx: tx });
      }
    }

    const sorted = [...catMap.entries()].sort((a, b) => b[1].totalAmount - a[1].totalAmount);
    let spendingTotal = 0;

    const cats = sorted.map(([name, info]): CategoryInfo => {
      spendingTotal += info.totalAmount;
      return {
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        color: getCategoryColor(name),
        transactionCount: info.count,
        totalAmount: info.totalAmount,
        lastAssignedMerchant: info.lastTx?.description,
        lastAssignedDate: info.lastTx?.date,
      };
    });

    return { categories: cats, totalSpendingAmount: spendingTotal };
  }, [spendingTransactions, reassigned]);

  const totalSpending = spendingTransactions.length;
  const categorizedCount = totalSpending - uncategorized.length;

  const assignToCategory = useCallback(
    (transactionId: string, categoryName: string) => {
      // Find the original category before any updates (needed for revert on failure)
      const originalTx = allTransactions.find((tx) => tx.id === transactionId);
      const originalCategory = originalTx?.category ?? '';

      // Optimistic update — update both local tracking and global state immediately
      setReassigned((prev) => {
        const next = new Map(prev);
        next.set(transactionId, categoryName);
        return next;
      });
      updateTransactionLocally(transactionId, { category: categoryName });

      // Persist to backend
      if (token) {
        updateTransactionCategory(token, transactionId, categoryName)
          .then(() => {
            // Success — clean up reassigned entry (global state is already correct)
            setReassigned((prev) => {
              const next = new Map(prev);
              next.delete(transactionId);
              return next;
            });
          })
          .catch((err) => {
            console.error('Failed to update transaction category:', err);
            // Revert both optimistic updates on failure
            setReassigned((prev) => {
              const next = new Map(prev);
              next.delete(transactionId);
              return next;
            });
            updateTransactionLocally(transactionId, { category: originalCategory });
          });
      }
    },
    [token, allTransactions, updateTransactionLocally],
  );

  // Search/filter
  const [transactionSearch, setTransactionSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  const filteredTransactions = useMemo(() => {
    if (!transactionSearch) return uncategorized;
    const search = transactionSearch.toLowerCase();
    return uncategorized.filter(
      (t: Transaction) =>
        t.description.toLowerCase().includes(search) ||
        t.amount.includes(search),
    );
  }, [uncategorized, transactionSearch]);

  const filteredCategories = useMemo(() => {
    if (!categorySearch) return categories;
    const search = categorySearch.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(search));
  }, [categories, categorySearch]);

  return {
    transactions: filteredTransactions,
    categories: filteredCategories,
    categorizedCount,
    totalTransactions: totalSpending,
    totalSpendingAmount,
    loading: transactionsLoading,
    transactionSearch,
    categorySearch,
    setTransactionSearch,
    setCategorySearch,
    assignToCategory,
  };
}
