import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, GestureResponderEvent, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../../../contexts/ThemeContext';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { formatCurrency, formatLocalDate } from '../../../utils/formatters';
import { createMobileCategorizeStyles } from '../styles/mobileCategorize.styles';
import CategoryGridOverlay from './CategoryGridOverlay';
import useCategorizeDrag from '../useCategorizeDrag';
import type { Transaction } from '../../../types/transaction';
import type { CategoryInfo } from '../../../types/categorize';

interface ToastData {
  categoryName: string;
  merchant: string;
  amount: string;
}

interface Props {
  transactions: Transaction[];
  categories: CategoryInfo[];
  categorizedCount: number;
  totalTransactions: number;
  transactionSearch: string;
  setTransactionSearch: (text: string) => void;
  assignToCategory: (transactionId: string, categoryName: string) => void;
}

export default function MobileCategorizeList({
  transactions,
  categories,
  categorizedCount,
  totalTransactions,
  transactionSearch,
  setTransactionSearch,
  assignToCategory,
}: Props) {
  const colors = useColors();
  const styles = useThemeStyles(createMobileCategorizeStyles);

  const [toast, setToast] = useState<ToastData | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const percentage = totalTransactions > 0
    ? Math.round((categorizedCount / totalTransactions) * 100)
    : 0;

  // Toast animation
  const showToast = useCallback((data: ToastData) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(data);
    Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(
        () => setToast(null),
      );
    }, 1800);
  }, [toastOpacity]);

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
    isDragging,
    isDraggingRef,
    draggedTransaction,
    activeTileIndex,
    isOverCancel,
    dragX,
    dragY,
    startDrag,
    onOverlayMove,
    onOverlayRelease,
    registerTileBounds,
    registerCancelBounds,
  } = useCategorizeDrag(categories, handleAssign);

  const handleLongPress = useCallback((transaction: Transaction, e: GestureResponderEvent) => {
    startDrag(transaction, e.nativeEvent.pageX, e.nativeEvent.pageY);
  }, [startDrag]);

  // Container-level responder: captures touch once dragging starts.
  // This lets the same finger that triggered onLongPress seamlessly
  // continue driving the drag without lifting.
  const shouldCapture = useCallback(() => isDraggingRef.current, [isDraggingRef]);

  const handleResponderMove = useCallback((e: GestureResponderEvent) => {
    if (isDraggingRef.current) {
      onOverlayMove(e.nativeEvent.pageX, e.nativeEvent.pageY);
    }
  }, [isDraggingRef, onOverlayMove]);

  const handleResponderRelease = useCallback(() => {
    if (isDraggingRef.current) {
      onOverlayRelease();
    }
  }, [isDraggingRef, onOverlayRelease]);

  const renderTransaction = useCallback(({ item }: { item: Transaction }) => {
    const formattedDate = formatLocalDate(item.date, { includeYear: true });
    const amount = parseFloat(item.amount);
    const formattedAmount = formatCurrency(amount);

    return (
      <Pressable
        onLongPress={(e) => handleLongPress(item, e)}
        delayLongPress={300}
        style={styles.transactionRow}
        accessibilityRole="button"
        accessibilityLabel={`${item.description}, ${formattedAmount}, ${formattedDate}. Long press to categorize.`}
      >
        <View style={styles.dragHandle}>
          <View style={styles.dragDots}>
            <Ionicons name="ellipsis-vertical" size={14} color={colors.text.tertiary} />
            <Ionicons name="ellipsis-vertical" size={14} color={colors.text.tertiary} style={styles.dragDotSecond} />
          </View>
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionMerchant} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.transactionDate}>{formattedDate}</Text>
        </View>
        <Text style={styles.transactionAmount}>{formattedAmount}</Text>
      </Pressable>
    );
  }, [handleLongPress, styles, colors]);

  const keyExtractor = useCallback((item: Transaction) => item.id, []);

  const emptyState = useMemo(() => (
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
  ), [transactionSearch, styles, colors]);

  return (
    <View
      style={styles.container}
      onStartShouldSetResponder={shouldCapture}
      onMoveShouldSetResponder={shouldCapture}
      onMoveShouldSetResponderCapture={shouldCapture}
      onResponderMove={handleResponderMove}
      onResponderRelease={handleResponderRelease}
      onResponderTerminate={handleResponderRelease}
    >
      {/* Header */}
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
            <View style={[styles.progressFill, { width: `${percentage}%` }]} />
          </View>
        </View>

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

      {/* Transaction List */}
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={keyExtractor}
        ListEmptyComponent={emptyState}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={transactions.length === 0 ? styles.listEmptyContent : undefined}
      />

      {/* Category Grid Overlay — shown during drag */}
      {isDragging && draggedTransaction && (
        <CategoryGridOverlay
          transaction={draggedTransaction}
          categories={categories}
          activeTileIndex={activeTileIndex}
          isOverCancel={isOverCancel}
          dragX={dragX}
          dragY={dragY}
          onRegisterTile={registerTileBounds}
          onRegisterCancel={registerCancelBounds}
        />
      )}

      {/* Toast */}
      {toast && (
        <Animated.View style={[styles.toastContainer, { opacity: toastOpacity }]} pointerEvents="none">
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <View>
              <Text style={styles.toastText}>Assigned to {toast.categoryName}</Text>
              <Text style={styles.toastDetail}>
                {toast.merchant} · {toast.amount}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
