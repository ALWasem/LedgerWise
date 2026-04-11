import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { formatCurrency } from '../../../utils/formatters';
import { createMobileCategorizeStyles } from '../styles/mobileCategorize.styles';
import StaggeredView from '../../../components/StaggeredView';
import CategoryGridOverlay from './CategoryGridOverlay';
import MobileDraggableRow from './MobileDraggableRow';
import useCategorizeDrag from '../useCategorizeDrag';
import MobileFilterPills from './MobileFilterPills';
import CategoryListScreen from './CategoryListScreen';
import { getEmptyStateText } from '../utils/emptyStateText';
import type { Transaction } from '../../../types/transaction';
import type { CategoryInfo, TransactionFilter } from '../../../types/categorize';
import type { ToastData } from '../../../components/BrandedToast';

interface Props {
  transactions: Transaction[];
  categories: CategoryInfo[];
  allCategories: CategoryInfo[];
  categorizedCount: number;
  totalTransactions: number;
  filterMode: TransactionFilter;
  setFilterMode: (filter: TransactionFilter) => void;
  transactionSearch: string;
  setTransactionSearch: (text: string) => void;
  assignToCategory: (transactionId: string, categoryName: string) => void;
  existingCategoryNames: string[];
  onCreateCategory: (name: string, colorId: number) => Promise<void>;
  onUpdateCategory: (id: string, updates: { name?: string; color_id?: number }, oldName: string) => Promise<void>;
  onDeleteCategory: (id: string, categoryName: string) => Promise<void>;
  takenColorIds: number[];
}

export default function MobileCategorizeList({
  transactions,
  categories,
  allCategories,
  categorizedCount,
  totalTransactions,
  filterMode,
  setFilterMode,
  transactionSearch,
  setTransactionSearch,
  assignToCategory,
  existingCategoryNames,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  takenColorIds,
}: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createMobileCategorizeStyles);

  const [toast, setToast] = useState<ToastData | null>(null);
  const toastOpacity = useSharedValue(0);
  const toastScale = useSharedValue(0.8);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Category management state
  const [categoryListVisible, setCategoryListVisible] = useState(false);
  const [categoryListCreateMode, setCategoryListCreateMode] = useState(false);

  const percentage = totalTransactions > 0
    ? Math.round((categorizedCount / totalTransactions) * 100)
    : 0;

  const progressFillWidth = useMemo(() => ({ width: `${percentage}%` as `${number}%` }), [percentage]);

  const clearToast = useCallback(() => setToast(null), []);

  // Toast animation: spring entrance, timed exit
  const showToast = useCallback((data: ToastData) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(data);
    toastOpacity.value = 0;
    toastScale.value = 0.8;
    toastOpacity.value = withSpring(1, { damping: 15, stiffness: 200 });
    toastScale.value = withSpring(1, { damping: 15, stiffness: 200 });
    toastTimer.current = setTimeout(() => {
      toastOpacity.value = withTiming(0, { duration: 300 }, () => {
        runOnJS(clearToast)();
      });
    }, 1500);
  }, [toastOpacity, toastScale, clearToast]);

  const toastAnimatedStyle = useAnimatedStyle(() => ({
    opacity: toastOpacity.value,
    transform: [{ scale: toastScale.value }],
  }));

  useEffect(() => {
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, []);

  // Drag handling with confirmation toast
  const handleAssign = useCallback((transactionId: string, categoryName: string) => {
    const tx = transactions.find(t => t.id === transactionId);
    assignToCategory(transactionId, categoryName);
    if (tx) {
      showToast({
        categoryName,
        merchant: tx.description,
        amount: formatCurrency(parseFloat(tx.amount)),
      });
    }
  }, [transactions, assignToCategory, showToast]);

  const {
    draggedTransaction,
    activeTileSV,
    overlayVisible,
    pulsingTileIndex,
    dragX,
    dragY,
    isDragActive,
    dragCardScale,
    dragCardOpacity,
    sourceRowOpacity,
    sourceRowScale,
    cancelHoverSV,
    listOpacity,
    listScale,
    gridOpacity,
    gridScale,
    gridTranslateY,
    startDrag,
    onDragMove,
    onDragEnd,
    registerTileBounds,
    registerCancelBounds,
  } = useCategorizeDrag(categories, handleAssign);

  const draggedTransactionId = draggedTransaction?.id ?? null;

  const renderTransaction = useCallback(({ item }: { item: Transaction }) => (
    <MobileDraggableRow
      transaction={item}
      draggedTransactionId={draggedTransactionId}
      dragX={dragX}
      dragY={dragY}
      isDragActive={isDragActive}
      sourceRowOpacity={sourceRowOpacity}
      sourceRowScale={sourceRowScale}
      onDragStart={startDrag}
      onDragMove={onDragMove}
      onDragEnd={onDragEnd}
    />
  ), [draggedTransactionId, dragX, dragY, isDragActive, sourceRowOpacity, sourceRowScale, startDrag, onDragMove, onDragEnd]);

  const keyExtractor = useCallback((item: Transaction) => item.id, []);

  const listAnimStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
    transform: [{ scale: listScale.value }],
  }));

  // Category management handlers
  const handleEditCategories = useCallback(() => {
    setCategoryListCreateMode(false);
    setCategoryListVisible(true);
  }, []);
  const handleCloseCategoryList = useCallback(() => {
    setCategoryListVisible(false);
    setCategoryListCreateMode(false);
  }, []);
  const handleNewCategory = useCallback(() => {
    setCategoryListCreateMode(true);
    setCategoryListVisible(true);
  }, []);

  const emptyText = getEmptyStateText(filterMode, !!transactionSearch);

  const emptyState = useMemo(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name={emptyText.icon} size={48} color={colors.text.tertiary} />
      <Text style={styles.emptyTitle}>{emptyText.title}</Text>
      <Text style={styles.emptyText}>{emptyText.subtitle}</Text>
    </View>
  ), [emptyText, styles, colors]);

  return (
    <View style={styles.container}>
      {/* Transaction list layer — fades out during drag */}
      <Animated.View style={[styles.listLayer, listAnimStyle]}>
        {/* Header */}
        <StaggeredView index={0} total={3}>
          <View style={styles.header}>
            <Text style={styles.title}>Categorize</Text>
            <Text style={styles.subtitle}>
              {categorizedCount} of {totalTransactions} categorized
            </Text>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressLabelRow}>
                <View style={styles.progressLabelLeft}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color={colors.isDark ? colors.purple[400] : colors.purple[600]}
                  />
                  <Text style={styles.progressLabelText}>Progress</Text>
                </View>
                <Text style={styles.progressPercentage}>{percentage}%</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, progressFillWidth]} />
              </View>
            </View>

            {/* Filter Pills */}
            <MobileFilterPills
              filterMode={filterMode}
              onFilterChange={setFilterMode}
              categories={allCategories}
              uncategorizedCount={totalTransactions - categorizedCount}
              totalCount={totalTransactions}
              onEditCategories={handleEditCategories}
              onNewCategory={handleNewCategory}
            />

            {/* Search */}
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
        </StaggeredView>

        {/* Transaction List */}
        <StaggeredView index={1} total={3} style={styles.transactionList}>
        <FlatList
          data={transactions}
          renderItem={renderTransaction}
          keyExtractor={keyExtractor}
          ListEmptyComponent={emptyState}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={transactions.length === 0 ? styles.listEmptyContent : undefined}
          initialNumToRender={10}
          maxToRenderPerBatch={15}
          windowSize={5}
        />
        </StaggeredView>
      </Animated.View>

      {/* Category Grid Overlay — always mounted, crossfades via shared values */}
      {overlayVisible && draggedTransaction && (
        <CategoryGridOverlay
          transaction={draggedTransaction}
          categories={categories}
          activeTileSV={activeTileSV}
          pulsingTileIndex={pulsingTileIndex}
          cancelHoverSV={cancelHoverSV}
          dragX={dragX}
          dragY={dragY}
          dragCardScale={dragCardScale}
          dragCardOpacity={dragCardOpacity}
          gridOpacity={gridOpacity}
          gridScale={gridScale}
          gridTranslateY={gridTranslateY}
          onRegisterTile={registerTileBounds}
          onRegisterCancel={registerCancelBounds}
        />
      )}

      {/* Toast */}
      {toast && (
        <Animated.View style={[styles.toastContainer, toastAnimatedStyle]} pointerEvents="none">
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={20} color={colors.text.inverse} />
            <View>
              <Text style={styles.toastText}>Assigned to {toast.categoryName}</Text>
              <Text style={styles.toastDetail}>
                {toast.merchant} · {toast.amount}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Category List Screen — pencil opens list, + New opens list with create sheet */}
      <CategoryListScreen
        visible={categoryListVisible}
        onClose={handleCloseCategoryList}
        categories={allCategories}
        existingNames={existingCategoryNames}
        onCreateCategory={onCreateCategory}
        onUpdateCategory={onUpdateCategory}
        onDeleteCategory={onDeleteCategory}
        openCreateOnMount={categoryListCreateMode}
        takenColorIds={takenColorIds}
      />
    </View>
  );
}
