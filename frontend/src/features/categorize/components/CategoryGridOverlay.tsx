import { useCallback, useRef } from 'react';
import { Animated, GestureResponderEvent, LayoutChangeEvent, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStyles } from '../../../hooks/useThemeStyles';
import { formatCurrency, formatLocalDate } from '../../../utils/formatters';
import { createMobileCategorizeStyles } from '../styles/mobileCategorize.styles';
import CategoryTile from './CategoryTile';
import type { Transaction } from '../../../types/transaction';
import type { CategoryInfo } from '../../../types/categorize';

const GRID_COLUMNS = 4;

interface Props {
  transaction: Transaction;
  categories: CategoryInfo[];
  activeTileIndex: number | null;
  isOverCancel: boolean;
  dragX: Animated.Value;
  dragY: Animated.Value;
  onRegisterTile: (index: number, pageX: number, pageY: number, width: number, height: number) => void;
  onRegisterCancel: (pageX: number, pageY: number, width: number, height: number) => void;
  onMove: (pageX: number, pageY: number) => void;
  onRelease: () => void;
}

export default function CategoryGridOverlay({
  transaction,
  categories,
  activeTileIndex,
  isOverCancel,
  dragX,
  dragY,
  onRegisterTile,
  onRegisterCancel,
  onMove,
  onRelease,
}: Props) {
  const styles = useThemeStyles(createMobileCategorizeStyles);
  const cancelRef = useRef<View>(null);

  const amount = parseFloat(transaction.amount);
  const formattedAmount = formatCurrency(amount);
  const formattedDate = formatLocalDate(transaction.date, { includeYear: true });

  const handleCancelLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    cancelRef.current?.measureInWindow((pageX, pageY) => {
      onRegisterCancel(pageX, pageY, width, height);
    });
  }, [onRegisterCancel]);

  // Responder handlers — overlay captures all touch movement
  const handleResponderMove = useCallback((e: GestureResponderEvent) => {
    onMove(e.nativeEvent.pageX, e.nativeEvent.pageY);
  }, [onMove]);

  const handleResponderRelease = useCallback(() => {
    onRelease();
  }, [onRelease]);

  // Build grid rows (4 columns per row, max 6 rows = 24 tiles)
  const rows: (CategoryInfo | null)[][] = [];
  for (let i = 0; i < Math.min(categories.length, 24); i += GRID_COLUMNS) {
    const row: (CategoryInfo | null)[] = [];
    for (let j = 0; j < GRID_COLUMNS; j++) {
      row.push(i + j < categories.length ? categories[i + j] : null);
    }
    rows.push(row);
  }

  return (
    <View
      style={styles.overlay}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onMoveShouldSetResponderCapture={() => true}
      onResponderMove={handleResponderMove}
      onResponderRelease={handleResponderRelease}
      onResponderTerminate={handleResponderRelease}
      accessibilityRole="menu"
      accessibilityLabel="Category selection. Drag to a category or drop on cancel to dismiss."
    >
      {/* Header showing transaction being assigned */}
      <View style={styles.overlayHeader}>
        <Text style={styles.overlayHeaderLabel}>Assigning transaction</Text>
        <View style={styles.overlayHeaderRow}>
          <Text style={styles.overlayHeaderMerchant} numberOfLines={1}>
            {transaction.description}
          </Text>
          <Text style={styles.overlayHeaderAmount}>{formattedAmount}</Text>
        </View>
        <Text style={styles.overlayHeaderDate}>{formattedDate}</Text>
      </View>

      {/* Category Grid */}
      <View style={styles.gridContainer}>
        {rows.map((row, rowIdx) => (
          <View key={rowIdx} style={styles.gridRow}>
            {row.map((cat, colIdx) => {
              const tileIndex = rowIdx * GRID_COLUMNS + colIdx;
              if (!cat) {
                return <View key={`empty-${colIdx}`} style={styles.tileEmpty} />;
              }
              return (
                <CategoryTile
                  key={cat.id}
                  category={cat}
                  index={tileIndex}
                  isActive={activeTileIndex === tileIndex}
                  onLayout={onRegisterTile}
                />
              );
            })}
          </View>
        ))}
      </View>

      {/* Cancel Zone */}
      <View
        ref={cancelRef}
        style={[styles.cancelZone, isOverCancel && styles.cancelZoneActive]}
        onLayout={handleCancelLayout}
        accessibilityRole="button"
        accessibilityLabel="Cancel categorization"
        accessibilityState={{ selected: isOverCancel }}
      >
        <Ionicons
          name="close-circle-outline"
          size={20}
          color={isOverCancel ? '#B91C1C' : '#999999'}
        />
        <Text style={[styles.cancelText, isOverCancel && styles.cancelTextActive]}>
          Drop here to cancel
        </Text>
      </View>

      {/* Floating Drag Card */}
      <Animated.View
        style={[
          styles.floatingCard,
          {
            transform: [
              { translateX: Animated.subtract(dragX, 80) },
              { translateY: Animated.subtract(dragY, 40) },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <Text style={styles.floatingCardMerchant} numberOfLines={1}>
          {transaction.description}
        </Text>
        <Text style={styles.floatingCardAmount}>{formattedAmount}</Text>
      </Animated.View>
    </View>
  );
}
