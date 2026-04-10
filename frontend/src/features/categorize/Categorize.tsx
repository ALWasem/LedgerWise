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
import TransactionFilterDropdown from './components/TransactionFilterDropdown';
import MobileCategorizeList from './components/MobileCategorizeList';
import NewCategoryCard from './components/NewCategoryCard';
import CategoryModal from './components/CategoryModal';
import DeleteCategoryModal from './components/DeleteCategoryModal';
import CategoryMenu from './components/CategoryMenu';
import type { Transaction } from '../../types/transaction';
import type { CategoryInfo } from '../../types/categorize';

type CategoryListItem = CategoryInfo | { id: '__new__'; _newCard: true } | { id: '__spacer__'; _spacer: true };
const SPACER: CategoryListItem = { id: '__spacer__', _spacer: true };

function isSpacer(item: CategoryListItem): item is typeof SPACER {
  return '_spacer' in item;
}

function isNewCard(item: CategoryListItem): item is { id: '__new__'; _newCard: true } {
  return '_newCard' in item;
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
    allCategories,
    categorizedCount,
    totalTransactions,
    totalSpendingAmount,
    loading,
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
  } = useCategorizeData();

  const uncategorizedCount = totalTransactions - categorizedCount;

  const isMobile = windowWidth < SIDEBAR_BREAKPOINT;

  // Toast state for desktop drag & drop confirmation
  const [toast, setToast] = useState<ToastData | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  // --- Category management modal state ---
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryInfo | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryInfo | null>(null);
  const [menuState, setMenuState] = useState<{
    category: CategoryInfo;
    position: { top: number; right: number };
  } | null>(null);

  const existingCategoryNames = useMemo(
    () => allCategories.map((c) => c.name),
    [allCategories],
  );

  const handleOpenCreateModal = useCallback(() => setCreateModalVisible(true), []);
  const handleCloseCreateModal = useCallback(() => setCreateModalVisible(false), []);

  const handleCreateCategory = useCallback(
    async (name: string, color: string) => {
      await createCategory(name, color);
    },
    [createCategory],
  );

  const handleEditCategory = useCallback(
    async (name: string, color: string) => {
      if (!editTarget) return;
      await updateCategory(editTarget.id, { name, color }, editTarget.name);
    },
    [editTarget, updateCategory],
  );

  const handleDeleteCategory = useCallback(async () => {
    if (!deleteTarget) return;
    await deleteCategory(deleteTarget.id, deleteTarget.name);
  }, [deleteTarget, deleteCategory]);

  const handleMenuOpen = useCallback(
    (category: CategoryInfo, position: { top: number; right: number }) => {
      setMenuState({ category, position });
    },
    [],
  );

  const handleMenuClose = useCallback(() => setMenuState(null), []);

  const handleMenuEdit = useCallback(() => {
    if (menuState) setEditTarget(menuState.category);
  }, [menuState]);

  const handleMenuDelete = useCallback(() => {
    if (menuState) setDeleteTarget(menuState.category);
  }, [menuState]);

  const handleCloseEditModal = useCallback(() => setEditTarget(null), []);
  const handleCloseDeleteModal = useCallback(() => setDeleteTarget(null), []);

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

  // Build category grid data: categories + "New Category" card + optional spacer
  const categoryData: CategoryListItem[] = useMemo(() => {
    const newCard: CategoryListItem = { id: '__new__', _newCard: true };
    const items: CategoryListItem[] = [...categories, newCard];
    // Pad to even count for 2-column grid
    if (items.length % 2 !== 0) {
      items.push(SPACER);
    }
    return items;
  }, [categories]);

  const renderCategory = useCallback(
    ({ item }: { item: CategoryListItem }) => {
      if (isSpacer(item)) {
        return <View style={styles.categoryCardSpacer} />;
      }
      if (isNewCard(item)) {
        return <NewCategoryCard onPress={handleOpenCreateModal} />;
      }
      return (
        <CategoryTarget
          category={item}
          totalSpending={totalSpendingAmount}
          onDrop={handleAssignToCategory}
          onMenuOpen={handleMenuOpen}
          compact={compactCards}
        />
      );
    },
    [handleAssignToCategory, handleMenuOpen, handleOpenCreateModal, totalSpendingAmount, compactCards, styles.categoryCardSpacer],
  );

  const keyExtractorTx = useCallback((item: Transaction) => item.id, []);
  const keyExtractorCat = useCallback((item: CategoryListItem) => item.id, []);

  const emptyTitle = transactionSearch
    ? 'No matches found'
    : filterMode === 'uncategorized'
      ? 'All done!'
      : 'No transactions';

  const emptySubtitle = transactionSearch
    ? 'Try a different search term'
    : filterMode === 'uncategorized'
      ? 'All transactions have been categorized'
      : filterMode === 'all'
        ? 'No spending transactions found'
        : `No transactions in ${filterMode}`;

  const transactionEmptyState = (
    <View style={styles.emptyContainer}>
      <Ionicons
        name={filterMode === 'uncategorized' && !transactionSearch ? 'checkmark-circle-outline' : 'search-outline'}
        size={48}
        color={colors.text.tertiary}
      />
      <Text style={styles.emptyTitle}>{emptyTitle}</Text>
      <Text style={styles.emptyText}>{emptySubtitle}</Text>
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
        allCategories={allCategories}
        categorizedCount={categorizedCount}
        totalTransactions={totalTransactions}
        filterMode={filterMode}
        setFilterMode={setFilterMode}
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
                  <Text style={styles.panelTitle}>
                    {filterMode === 'uncategorized'
                      ? 'Uncategorized Transactions'
                      : filterMode === 'all'
                        ? 'All Transactions'
                        : `${filterMode} Transactions`}
                  </Text>
                  <Text style={styles.countBadge}>{transactions.length}</Text>
                </View>
                <View style={styles.filterSearchRow}>
                  <TransactionFilterDropdown
                    filterMode={filterMode}
                    onFilterChange={setFilterMode}
                    categories={allCategories}
                    uncategorizedCount={uncategorizedCount}
                    totalCount={totalTransactions}
                  />
                  <View style={styles.searchContainerFlex}>
                    <Ionicons
                      name="search"
                      size={16}
                      color={colors.text.tertiary}
                      style={styles.searchIcon}
                    />
                    <TextInput
                      style={styles.searchInput}
                      placeholder={compactCards ? 'Search...' : 'Search transactions...'}
                      placeholderTextColor={colors.text.tertiary}
                      value={transactionSearch}
                      onChangeText={setTransactionSearch}
                      accessibilityLabel="Search transactions"
                    />
                  </View>
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
                initialNumToRender={15}
                maxToRenderPerBatch={15}
                windowSize={5}
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
                    onPress={handleOpenCreateModal}
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
                    placeholder={compactCards ? 'Filter...' : 'Filter categories...'}
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
            </View>
          </StaggeredView>
        </View>
      </View>

      {/* Branded toast — bottom-right confirmation on successful categorization */}
      <BrandedToast data={toast} onDismiss={clearToast} />

      {/* Category Management Modals */}
      <CategoryModal
        visible={createModalVisible}
        onClose={handleCloseCreateModal}
        onSave={handleCreateCategory}
        existingNames={existingCategoryNames}
      />

      <CategoryModal
        visible={!!editTarget}
        onClose={handleCloseEditModal}
        onSave={handleEditCategory}
        initialName={editTarget?.name}
        initialColor={editTarget?.color}
        existingNames={existingCategoryNames}
      />

      <DeleteCategoryModal
        visible={!!deleteTarget}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteCategory}
        categoryName={deleteTarget?.name ?? ''}
        transactionCount={deleteTarget?.transactionCount ?? 0}
      />

      <CategoryMenu
        visible={!!menuState}
        onClose={handleMenuClose}
        onEdit={handleMenuEdit}
        onDelete={handleMenuDelete}
        anchorPosition={menuState?.position ?? { top: 0, right: 0 }}
      />
    </View>
  );
}
