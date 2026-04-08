import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTransactionData } from '../../contexts/TransactionDataContext';
import { useThemeStyles } from '../../hooks/useThemeStyles';
import { usePlaidLink } from '../../hooks/usePlaidLink';
import { createCategorizeStyles } from './styles/categorize.styles';
import { isHovered } from '../../utils/pressable';
import { formatCurrency } from '../../utils/formatters';
import { COMPACT_BREAKPOINT, SIDEBAR_BREAKPOINT } from '../../utils/responsive';
import StaggeredView from '../../components/StaggeredView';
import EmptyState from '../../components/EmptyState';
import PlaidModal from '../../components/PlaidModal';
import BrandedToast from '../../components/BrandedToast';
import type { ToastData } from '../../components/BrandedToast';
import useCategorizeData from './useCategorizeData';
import TransactionRow from './components/TransactionRow';
import CategoryTarget from './components/CategoryTarget';
import ProgressHeader from './components/ProgressHeader';
import MobileCategorizeList from './components/MobileCategorizeList';
import type { Transaction } from '../../types/transaction';
import type { CategoryInfo } from '../../types/categorize';

type CategoryListItem = CategoryInfo | { id: '__spacer__'; _spacer: true };
const SPACER: CategoryListItem = { id: '__spacer__', _spacer: true };

function isSpacer(item: CategoryListItem): item is typeof SPACER {
  return '_spacer' in item;
}

export default function Categorize() {
  const colors = useColors();
  const styles = useThemeStyles(createCategorizeStyles);
  const { width: windowWidth } = useWindowDimensions();
  const compactCards = windowWidth < COMPACT_BREAKPOINT;
  const { hasAccounts, accountsLoading, refresh } = useTransactionData();
  const { session } = useAuth();
  const token = session?.access_token ?? null;
  const [linkError, setLinkError] = useState<string | null>(null);
  const { openPlaidLink, linkLoading, enrolling, mobileLinkToken, handleMobileSuccess, handleMobileExit } = usePlaidLink(token, refresh, setLinkError);

  const {
    transactions,
    categories,
    categorizedCount,
    totalTransactions,
    totalSpendingAmount,
    loading,
    transactionSearch,
    categorySearch,
    setTransactionSearch,
    setCategorySearch,
    assignToCategory,
  } = useCategorizeData();

  const isMobile = windowWidth < SIDEBAR_BREAKPOINT;

  // Toast state for desktop drag & drop confirmation
  const [toast, setToast] = useState<ToastData | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  const handleAssignToCategory = useCallback(
    (transactionId: string, categoryName: string) => {
      const tx = transactions.find((t) => t.id === transactionId);
      assignToCategory(transactionId, categoryName);
      if (tx) {
        setToast({
          categoryName,
          merchant: tx.description,
          amount: formatCurrency(parseFloat(tx.amount)),
        });
      }
    },
    [transactions, assignToCategory],
  );

  const renderTransaction = useCallback(
    ({ item }: { item: Transaction }) => <TransactionRow transaction={item} />,
    [],
  );

  const categoryData: CategoryListItem[] = useMemo(() => {
    if (categories.length % 2 === 0) return categories;
    return [...categories, SPACER];
  }, [categories]);

  const renderCategory = useCallback(
    ({ item }: { item: CategoryListItem }) => {
      if (isSpacer(item)) {
        return <View style={styles.categoryCardSpacer} />;
      }
      return (
        <CategoryTarget
          category={item}
          totalSpending={totalSpendingAmount}
          onDrop={handleAssignToCategory}
          compact={compactCards}
        />
      );
    },
    [handleAssignToCategory, totalSpendingAmount, compactCards, styles.categoryCardSpacer],
  );

  const keyExtractorTx = useCallback((item: Transaction) => item.id, []);
  const keyExtractorCat = useCallback((item: CategoryListItem) => item.id, []);

  const transactionEmptyState = (
    <View style={styles.emptyContainer}>
      <Ionicons name="checkmark-circle-outline" size={48} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>
        {transactionSearch ? 'No matches found' : 'All done!'}
      </Text>
      <Text style={styles.emptyText}>
        {transactionSearch
          ? 'Try a different search term'
          : 'All transactions have been categorized'}
      </Text>
    </View>
  );

  if (loading || accountsLoading || enrolling || linkLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  if (!hasAccounts) {
    return (
      <View style={styles.container}>
        <StaggeredView index={0}>
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Categorize Transactions</Text>
            <Text style={styles.pageSubtitle}>
              Organize your uncategorized transactions to improve insights
            </Text>
          </View>
        </StaggeredView>
        <EmptyState onConnect={openPlaidLink} />
        {linkError && <Text style={styles.errorText}>{linkError}</Text>}
        <PlaidModal
          visible={mobileLinkToken !== null}
          linkToken={mobileLinkToken}
          onSuccess={handleMobileSuccess}
          onExit={handleMobileExit}
        />
      </View>
    );
  }

  if (isMobile) {
    return (
      <MobileCategorizeList
        transactions={transactions}
        categories={categories}
        categorizedCount={categorizedCount}
        totalTransactions={totalTransactions}
        transactionSearch={transactionSearch}
        setTransactionSearch={setTransactionSearch}
        assignToCategory={assignToCategory}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Page Header */}
      <StaggeredView index={0}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Categorize Transactions</Text>
          <Text style={styles.pageSubtitle}>
            Organize your uncategorized transactions to improve insights
          </Text>
        </View>
      </StaggeredView>

      {/* Progress Bar + Two Panel Layout */}
      <View style={styles.panelOuterContainer}>
        <StaggeredView index={1}>
          <ProgressHeader
            categorizedCount={categorizedCount}
            totalCount={totalTransactions}
          />
        </StaggeredView>

        <View style={styles.panelRow}>
          {/* Left Panel — Uncategorized Transactions */}
          <StaggeredView index={2} style={styles.transactionsPanelWrapper}>
            <View style={styles.transactionsPanel}>
              <View style={styles.panelHeader}>
                <View style={styles.panelHeaderRow}>
                  <Text style={styles.panelTitle}>Uncategorized Transactions</Text>
                  <Text style={styles.countBadge}>{transactions.length}</Text>
                </View>
                <View style={styles.searchContainer}>
                  <Ionicons
                    name="search"
                    size={16}
                    color={colors.text.tertiary}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search transactions..."
                    placeholderTextColor={colors.text.tertiary}
                    value={transactionSearch}
                    onChangeText={setTransactionSearch}
                    accessibilityLabel="Search transactions"
                  />
                </View>
              </View>

              <FlatList
                data={transactions}
                renderItem={renderTransaction}
                keyExtractor={keyExtractorTx}
                style={styles.transactionList}
                contentContainerStyle={
                  transactions.length === 0 ? styles.transactionListEmpty : styles.transactionListContent
                }
                ListEmptyComponent={transactionEmptyState}
                showsVerticalScrollIndicator={true}
              />
            </View>
          </StaggeredView>

          {/* Right Panel — Categories */}
          <StaggeredView index={3} style={styles.categoriesPanelWrapper}>
            <View style={styles.categoriesPanel}>
              <View style={styles.panelHeader}>
                <View style={styles.panelHeaderRow}>
                  <Text style={styles.panelTitle}>Categories</Text>
                  <Pressable
                    style={(state) => [
                      styles.addCategoryButton,
                      isHovered(state) && styles.addCategoryButtonHovered,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Add category"
                  >
                    <Ionicons
                      name="add"
                      size={18}
                      color={colors.isDark ? colors.purple[400] : colors.purple[600]}
                    />
                  </Pressable>
                </View>
                <View style={styles.searchContainer}>
                  <Ionicons
                    name="search"
                    size={16}
                    color={colors.text.tertiary}
                    style={styles.searchIcon}
                  />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Filter categories..."
                    placeholderTextColor={colors.text.tertiary}
                    value={categorySearch}
                    onChangeText={setCategorySearch}
                    accessibilityLabel="Filter categories"
                  />
                </View>
              </View>

              <FlatList
                data={categoryData}
                renderItem={renderCategory}
                keyExtractor={keyExtractorCat}
                numColumns={2}
                style={styles.categoryList}
                contentContainerStyle={styles.categoryListContent}
                columnWrapperStyle={styles.categoryColumnWrapper}
                showsVerticalScrollIndicator={true}
              />

              {/* Create New Category */}
              <Pressable
                style={(state) => [
                  styles.createCategoryRow,
                  isHovered(state) && styles.createCategoryRowHovered,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Create new category"
              >
                {(state) => (
                  <>
                    <Ionicons
                      name="add"
                      size={16}
                      color={
                        isHovered(state)
                          ? (colors.isDark ? colors.purple[400] : colors.purple[600])
                          : colors.text.secondary
                      }
                    />
                    <Text style={[
                      styles.createCategoryText,
                      isHovered(state) && styles.createCategoryTextHovered,
                    ]}>
                      Create New Category
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </StaggeredView>
        </View>
      </View>

      {/* Branded toast — bottom-right confirmation on successful categorization */}
      <BrandedToast data={toast} onDismiss={clearToast} />
    </View>
  );
}
