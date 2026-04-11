import { useCallback, useMemo, useState } from 'react';
import { useTransactionData } from '../../contexts/TransactionDataContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  createCategoryApi,
  deleteCategoryApi,
  updateCategoryApi,
  updateTransactionCategory,
} from '../../api/client';
import { isSpending } from '../../utils/transactionFilters';
import { getCategoryColor, hashCategoryColorId } from '../../utils/categoryColors';
import { normalizeCategory } from '../../utils/normalizeCategory';
import type { Transaction } from '../../types/transaction';
import type { CategoryInfo, TransactionFilter } from '../../types/categorize';

export default function useCategorizeData() {
  const { allTransactions, transactionsLoading, updateTransactionLocally, refresh, userCategories, setUserCategories } =
    useTransactionData();
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

    // Merge user-defined categories that have no transactions yet
    // Use normalizeCategory so the key matches transaction-derived keys (title-case)
    for (const uc of userCategories) {
      const normalized = normalizeCategory(uc.name);
      if (!catMap.has(normalized) && normalized !== 'General') {
        catMap.set(normalized, { count: 0, totalAmount: 0 });
      }
    }

    const sorted = [...catMap.entries()].sort((a, b) => b[1].totalAmount - a[1].totalAmount);
    let spendingTotal = 0;

    const cats = sorted.map(([name, info]): CategoryInfo => {
      spendingTotal += info.totalAmount;

      // Find matching user category for the DB id and color_id
      const userCat = userCategories.find(
        (uc) => uc.name.toLowerCase() === name.toLowerCase(),
      );

      return {
        id: userCat?.id ?? name.toLowerCase().replace(/\s+/g, '-'),
        name,
        colorId: userCat?.color_id ?? hashCategoryColorId(name),
        transactionCount: info.count,
        totalAmount: info.totalAmount,
        lastAssignedMerchant: info.lastTx?.description,
        lastAssignedDate: info.lastTx?.date,
      };
    });

    return { categories: cats, totalSpendingAmount: spendingTotal };
  }, [spendingTransactions, reassigned, userCategories]);

  const totalSpending = spendingTransactions.length;
  const categorizedCount = totalSpending - uncategorized.length;

  // Filter mode: 'uncategorized' (default), 'all', or a specific category name
  const [filterMode, setFilterMode] = useState<TransactionFilter>('uncategorized');

  const filteredByMode = useMemo(() => {
    if (filterMode === 'uncategorized') return uncategorized;
    if (filterMode === 'all') return spendingTransactions;
    // Specific category — match by normalized name
    return spendingTransactions.filter((tx) => {
      const name = reassigned.has(tx.id)
        ? reassigned.get(tx.id)!
        : normalizeCategory(tx.category);
      return name === filterMode;
    });
  }, [filterMode, uncategorized, spendingTransactions, reassigned]);

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
          .catch(() => {
            // Silently revert — error details stay server-side
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

  // --- Category CRUD ---

  const createCategory = useCallback(
    async (name: string, colorId: number) => {
      if (!token) return;
      const created = await createCategoryApi(token, name, colorId);
      setUserCategories((prev) => [...prev, created]);
    },
    [token],
  );

  const updateCategory = useCallback(
    async (id: string, updates: { name?: string; color_id?: number }, oldName?: string) => {
      if (!token) return;

      // Resolve the DB UUID — prefer the id if already a UUID, otherwise look up by name
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let resolvedId = isUuid ? id : null;

      if (!resolvedId && oldName) {
        // Check if category already exists in DB under this name
        const existing = userCategories.find(
          (uc) => uc.name.toLowerCase() === oldName.toLowerCase(),
        );
        if (existing) {
          resolvedId = existing.id;
        } else {
          // Create a new DB entry for this transaction-derived category
          const created = await createCategoryApi(token, oldName, updates.color_id ?? hashCategoryColorId(oldName));
          setUserCategories((prev) => [...prev, created]);
          // If only color changed, we're done
          if (!updates.name || updates.name === oldName) return;
          resolvedId = created.id;
        }
      }

      if (!resolvedId) return;

      const updated = await updateCategoryApi(token, resolvedId, updates);
      setUserCategories((prev) =>
        prev.map((uc) => (uc.id === resolvedId ? updated : uc)),
      );

      // If name changed, refresh transactions so the renamed category reflects
      if (updates.name && oldName && updates.name !== oldName) {
        refresh();
      }
    },
    [token, refresh, userCategories],
  );

  const deleteCategory = useCallback(
    async (id: string, categoryName?: string) => {
      if (!token) return;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      let resolvedId = isUuid ? id : null;

      // If slug ID, try to find the DB entry by name
      if (!resolvedId && categoryName) {
        const existing = userCategories.find(
          (uc) => uc.name.toLowerCase() === categoryName.toLowerCase(),
        );
        if (existing) resolvedId = existing.id;
      }

      if (!resolvedId) return; // No DB entry to delete
      await deleteCategoryApi(token, resolvedId);
      setUserCategories((prev) => prev.filter((uc) => uc.id !== resolvedId));
      refresh();
    },
    [token, refresh, userCategories],
  );

  // Search/filter
  const [transactionSearch, setTransactionSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  const filteredTransactions = useMemo(() => {
    if (!transactionSearch) return filteredByMode;
    const search = transactionSearch.toLowerCase();
    return filteredByMode.filter(
      (t: Transaction) =>
        t.description.toLowerCase().includes(search) ||
        t.amount.includes(search),
    );
  }, [filteredByMode, transactionSearch]);

  const filteredCategories = useMemo(() => {
    if (!categorySearch) return categories;
    const search = categorySearch.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(search));
  }, [categories, categorySearch]);

  return {
    transactions: filteredTransactions,
    categories: filteredCategories,
    allCategories: categories,
    userCategories,
    categorizedCount,
    totalTransactions: totalSpending,
    totalSpendingAmount,
    loading: transactionsLoading,
    filterMode,
    setFilterMode,
    transactionSearch,
    categorySearch,
    setTransactionSearch,
    setCategorySearch,
    assignToCategory,
    createCategory,
    updateCategory,
    deleteCategory,
  };
}
