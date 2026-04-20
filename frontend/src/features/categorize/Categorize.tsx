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
import { COMPACT_BREAKPOINT, SIDEBAR_BREAKPOINT } from '../../utils/responsive';
import ProLockOverlay from '../../components/ProLockOverlay';
import StaggeredView from '../../components/StaggeredView';
import EmptyState from '../../components/EmptyState';
import PlaidModal from '../../components/PlaidModal';
import BrandedToast from '../../components/BrandedToast';
import type { ToastData } from '../../components/BrandedToast';
import useCategorizeData from './useCategorizeData';
import useCategoryModals from './useCategoryModals';
import TransactionRow from './components/TransactionRow';
import CategoryTarget from './components/CategoryTarget';
import ProgressHeader from './components/ProgressHeader';
import TransactionFilterDropdown from './components/TransactionFilterDropdown';
import MobileCategorizeList from './components/MobileCategorizeList';
import MerchantRulePrompt from './components/MerchantRulePrompt';
import NewCategoryCard from './components/NewCategoryCard';
import CategoryModal from './components/CategoryModal';
import DeleteCategoryModal from './components/DeleteCategoryModal';
import CategoryMenu from './components/CategoryMenu';
import { getEmptyStateText } from './utils/emptyStateText';
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
  const { session, isPro } = useAuth();
  const token = session?.access_token ?? null;
  const [linkError, setLinkError] = useState<string | null>(null);
  const { openPlaidLink, linkLoading, enrolling, mobileLinkToken, handleMobileSuccess, handleMobileExit } = usePlaidLink(token, refresh, setLinkError);

  const {
    transactions,
    categories,
    allCategories,
    userCategories,
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
    rulePrompt,
    assignWithRuleCheck,
    handleRuleApplyAll,
    handleRuleJustThisOne,
    createCategory,
    updateCategory,
    deleteCategory,
  } = useCategorizeData();

  const uncategorizedCount = totalTransactions - categorizedCount;

  const isMobile = windowWidth < SIDEBAR_BREAKPOINT;

  // Toast state for desktop drag & drop confirmation
  const [toast, setToast] = useState<ToastData | null>(null);
  const clearToast = useCallback(() => setToast(null), []);

  // --- Category management modal state (extracted to hook) ---
  const {
    createModalVisible,
    editTarget,
    deleteTarget,
    menuState,
    existingCategoryNames,
    takenColorIds,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleCreateCategory,
    handleEditCategory,
    handleDeleteCategory,
    handleMenuOpen,
    handleMenuClose,
    handleMenuEdit,
    handleMenuDelete,
    handleCloseEditModal,
    handleCloseDeleteModal,
  } = useCategoryModals({
    allCategories,
    userCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  });

  const handleAssignToCategory = useCallback(
    (transactionId: string, categoryName: string) => {
      assignWithRuleCheck(transactionId, categoryName);
    },
    [assignWithRuleCheck],
  );

  const handleApplyAll = useCallback(async () => {
    const result = await handleRuleApplyAll();
    if (result?.type === 'bulk') {
      setToast({
        categoryName: result.categoryName,
        merchant: result.merchant,
        amount: `${result.count} transactions`,
        bulk: true,
        bulkCount: result.count,
      });
    } else if (result?.type === 'single') {
      setToast({
        categoryName: result.categoryName,
        merchant: result.merchant,
        amount: result.amount,
      });
    }
  }, [handleRuleApplyAll]);

  const handleJustThisOne = useCallback(() => {
    const result = handleRuleJustThisOne();
    if (result) {
      setToast({
        categoryName: result.categoryName,
        merchant: result.merchant,
        amount: result.amount,
      });
    }
  }, [handleRuleJustThisOne]);

  const renderTransaction = useCallback(
    ({ item }: { item: Transaction }) => <TransactionRow transaction={item} />,
    [],
  );

  const newCard = useMemo<CategoryListItem>(() => ({ id: '__new__', _newCard: true }), []);

  // Build category grid data: categories + "New Category" card + optional spacer
  const categoryData: CategoryListItem[] = useMemo(() => {
    const items: CategoryListItem[] = [...categories, newCard];
    // Pad to even count for 2-column grid
    if (items.length % 2 !== 0) {
      items.push(SPACER);
    }
    return items;
  }, [categories, newCard]);

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

  const emptyState = getEmptyStateText(filterMode, !!transactionSearch);

  const tertiaryColor = colors.text.tertiary;
  const transactionEmptyState = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name={emptyState.icon} size={48} color={tertiaryColor} />
      <Text style={styles.emptyTitle}>{emptyState.title}</Text>
      <Text style={styles.emptyText}>{emptyState.subtitle}</Text>
    </View>
  ), [emptyState, styles.emptyContainer, styles.emptyTitle, styles.emptyText, tertiaryColor]);

  if (loading || accountsLoading || enrolling || linkLoading) {
    return (
      <View style={styles.loadingContainer} accessibilityLiveRegion="polite">
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

  if (isMobile && !isPro) {
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
        <ProLockOverlay message="Categorize Transactions is a Pro feature">
          <View style={styles.lockedPlaceholder} />
        </ProLockOverlay>
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
        assignWithRuleCheck={assignWithRuleCheck}
        rulePrompt={rulePrompt}
        onRuleApplyAll={handleRuleApplyAll}
        onRuleJustThisOne={handleRuleJustThisOne}
        existingCategoryNames={existingCategoryNames}
        onCreateCategory={handleCreateCategory}
        onUpdateCategory={updateCategory}
        onDeleteCategory={deleteCategory}
        takenColorIds={takenColorIds}
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
      {!isPro ? (
        <ProLockOverlay message="Categorize Transactions is a Pro feature">
          <View style={styles.lockedPlaceholder} />
        </ProLockOverlay>
      ) : (
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
      )}

      {/* Merchant rule prompt — shown when other transactions share the same merchant */}
      <MerchantRulePrompt
        data={rulePrompt}
        onApplyAll={handleApplyAll}
        onJustThisOne={handleJustThisOne}
      />

      {/* Branded toast — bottom-right confirmation on successful categorization */}
      <BrandedToast data={toast} onDismiss={clearToast} />

      {/* Category Management Modals */}
      <CategoryModal
        visible={createModalVisible}
        onClose={handleCloseCreateModal}
        onSave={handleCreateCategory}
        existingNames={existingCategoryNames}
        takenColorIds={takenColorIds}
      />

      <CategoryModal
        visible={!!editTarget}
        onClose={handleCloseEditModal}
        onSave={handleEditCategory}
        initialName={editTarget?.name}
        initialColorId={editTarget?.colorId}
        existingNames={existingCategoryNames}
        takenColorIds={takenColorIds}
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
